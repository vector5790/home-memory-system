export function createImageProcessing({ visionConfig }) {
  let heicConverterPromise = null;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("图片无法读取，请换一张照片。"));
      image.src = src;
    });
  }

  function withTimeout(promise, timeoutMs, message) {
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
  }

  function isImageFile(file) {
    if (file?.type?.startsWith("image/")) return true;
    return /\.(avif|bmp|gif|heic|heif|jpe?g|png|webp)$/i.test(file?.name || "");
  }

  function isLikelyImageDecodeError(error) {
    return /decode|解码|图片无法读取|source image|unsupported|invalid image/i.test(error?.message || String(error || ""));
  }

  async function readFileSignature(file, length = 32) {
    const buffer = await file.slice(0, length).arrayBuffer();
    return new Uint8Array(buffer);
  }

  function asciiFromBytes(bytes, start, end) {
    return Array.from(bytes.slice(start, end), (byte) => String.fromCharCode(byte)).join("");
  }

  async function isHeicHeifFile(file) {
    const mime = String(file?.type || "").toLowerCase();
    if (/image\/hei[cf]|image\/heif-sequence|image\/heic-sequence/.test(mime)) return true;
    if (/\.(heic|heif|heics|heifs)$/i.test(file?.name || "")) return true;

    try {
      const bytes = await readFileSignature(file, 32);
      if (bytes.length < 12 || asciiFromBytes(bytes, 4, 8) !== "ftyp") return false;
      const brands = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"]);
      for (let index = 8; index + 4 <= bytes.length; index += 4) {
        if (brands.has(asciiFromBytes(bytes, index, index + 4))) return true;
      }
    } catch (error) {
      console.warn("HEIC signature check failed.", error);
    }
    return false;
  }

  async function loadHeicConverter() {
    if (typeof window.heic2any === "function") return window.heic2any;
    if (!heicConverterPromise) {
      heicConverterPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${visionConfig.localHeicConverterScript}?v=${visionConfig.appVersion}`;
        script.async = true;
        script.onload = () => {
          if (typeof window.heic2any === "function") {
            resolve(window.heic2any);
            return;
          }
          reject(new Error("HEIC 转换器加载失败。"));
        };
        script.onerror = () => reject(new Error("HEIC 转换器加载失败。"));
        document.head.appendChild(script);
      }).catch((error) => {
        heicConverterPromise = null;
        throw error;
      });
    }
    return heicConverterPromise;
  }

  function canUseLocalImageConversionApi() {
    return ["http:", "https:"].includes(window.location.protocol);
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("图片数据读取失败。"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(blob);
    });
  }

  async function convertHeicFileWithLocalServer(file) {
    const image = await blobToDataUrl(file);
    const response = await fetch("/api/convert-image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        image,
        filename: file.name || "upload.heic",
        quality: Math.round(visionConfig.uploadJpegQuality * 100),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "本地 HEIC/HEIF 转换失败。");
    }
    if (!String(payload.image || "").startsWith("data:image/jpeg;base64,")) {
      throw new Error("本地 HEIC/HEIF 转换没有返回 JPEG。");
    }
    return fetch(payload.image).then((convertedResponse) => convertedResponse.blob());
  }

  async function convertHeicFileInBrowser(file) {
    const heic2any = await loadHeicConverter();
    const converted = await withTimeout(
      heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: Math.min(0.92, Math.max(0.72, visionConfig.uploadJpegQuality)),
        multiple: false,
      }),
      visionConfig.heicConversionTimeoutMs,
      "HEIC/HEIF 转 JPEG 超时，请稍后重试或先裁剪照片。",
    );
    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!(blob instanceof Blob)) {
      throw new Error("HEIC/HEIF 转 JPEG 失败。");
    }
    return blob;
  }

  async function convertHeicFileToJpegBlob(file) {
    const errors = [];
    if (canUseLocalImageConversionApi()) {
      try {
        return await convertHeicFileWithLocalServer(file);
      } catch (error) {
        errors.push(error);
        console.warn("Local HEIC conversion failed, falling back to browser converter.", error);
      }
    }
    try {
      return await convertHeicFileInBrowser(file);
    } catch (error) {
      errors.push(error);
    }
    console.warn("HEIC conversion failed.", errors);
    throw new Error("HEIC/HEIF 自动转换失败，请换一张照片或先在相册导出为 JPEG/PNG。");
  }

  function getDrawableSize(source) {
    return {
      width: source.videoWidth || source.naturalWidth || source.width || 1,
      height: source.videoHeight || source.naturalHeight || source.height || 1,
    };
  }

  function drawSourceToDataUrl(source, width, height, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  }

  async function resizeImageSourceToDataUrl(source, options = {}) {
    const maxDimension = options.maxDimension || visionConfig.maxUploadDimension;
    const maxLength = options.maxLength || visionConfig.maxUploadDataUrlLength;
    let quality = options.quality || visionConfig.uploadJpegQuality;
    const original = getDrawableSize(source);
    let scale = Math.min(1, maxDimension / Math.max(original.width, original.height));
    let width = Math.max(1, Math.round(original.width * scale));
    let height = Math.max(1, Math.round(original.height * scale));
    let dataUrl = drawSourceToDataUrl(source, width, height, quality);

    while (dataUrl.length > maxLength && quality > 0.58) {
      quality = Math.max(0.58, quality - 0.08);
      dataUrl = drawSourceToDataUrl(source, width, height, quality);
    }

    while (dataUrl.length > maxLength && Math.max(width, height) > 960) {
      scale *= 0.86;
      width = Math.max(1, Math.round(original.width * scale));
      height = Math.max(1, Math.round(original.height * scale));
      dataUrl = drawSourceToDataUrl(source, width, height, quality);
    }

    if (dataUrl.length > maxLength * 1.2) {
      throw new Error("照片仍然过大，请换一张更小的图片或稍微裁剪后再上传。");
    }
    return dataUrl;
  }

  async function prepareImageForDetection(image) {
    const source = await loadImage(image);
    const size = getDrawableSize(source);
    if (Math.max(size.width, size.height) <= visionConfig.detectionMaxDimension) return image;
    return resizeImageSourceToDataUrl(source, {
      maxDimension: visionConfig.detectionMaxDimension,
      maxLength: Math.min(visionConfig.maxUploadDataUrlLength, 520000),
      quality: 0.78,
    });
  }

  async function decodeImageBlobToDataUrl(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const image = await withTimeout(
        loadImage(url),
        visionConfig.uploadDecodeTimeoutMs,
        "照片解码超时，请换一张 JPEG/PNG 或先裁剪后再上传。",
      ).catch(async (error) => {
        if (!window.createImageBitmap) throw error;
        const bitmap = await withTimeout(
          createImageBitmap(blob, { imageOrientation: "from-image" }),
          visionConfig.uploadDecodeTimeoutMs,
          "照片解码超时，请换一张 JPEG/PNG 或先裁剪后再上传。",
        );
        return bitmap;
      });
      try {
        return await resizeImageSourceToDataUrl(image);
      } finally {
        image.close?.();
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function prepareUploadedImage(file) {
    const isHeif = await isHeicHeifFile(file);
    if (!isImageFile(file) && !isHeif) {
      throw new Error("请选择图片文件。");
    }

    try {
      return await decodeImageBlobToDataUrl(file);
    } catch (error) {
      if (isHeif && isLikelyImageDecodeError(error)) {
        try {
          const jpegBlob = await convertHeicFileToJpegBlob(file);
          return await decodeImageBlobToDataUrl(jpegBlob);
        } catch (conversionError) {
          throw new Error(conversionError.message || "HEIC/HEIF 自动转换失败，请换一张照片。");
        }
      }
      if (isLikelyImageDecodeError(error)) {
        throw new Error("这张图片浏览器无法解码；如果是 HEIC/HEIF，系统会自动转换，请确认文件没有损坏。");
      }
      throw error;
    }
  }

  async function getImageDimensions(image) {
    const source = await loadImage(image);
    return {
      width: source.naturalWidth || source.width || 0,
      height: source.naturalHeight || source.height || 0,
    };
  }

  return {
    getDrawableSize,
    getImageDimensions,
    loadImage,
    prepareImageForDetection,
    prepareUploadedImage,
    resizeImageSourceToDataUrl,
  };
}
