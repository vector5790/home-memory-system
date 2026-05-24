export function createVisionAssetLoader({ configureTransformersRuntime, visionConfig }) {
  let visionAssetModePromise = null;
  let transformersModulePromise = null;

  async function getVisionAssetMode() {
    if (!visionAssetModePromise) {
      visionAssetModePromise = fetch(`${visionConfig.localManifest}?v=${visionConfig.assetVersion}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((manifest) => {
          const models = new Set(Array.isArray(manifest?.models) ? manifest.models : []);
          const hasLocalRuntime = Boolean(manifest?.transformers);
          const owlReady = models.has(visionConfig.detectionModel);
          const groundingReady = models.has(visionConfig.groundingDinoModel);
          return {
            local: hasLocalRuntime && (groundingReady || owlReady),
            hasLocalRuntime,
            owlReady,
            groundingReady,
            samReady: models.has(visionConfig.samModel),
            catalogReady: models.has(visionConfig.catalogModel),
            manifest,
          };
        })
        .catch(() => ({
          local: false,
          hasLocalRuntime: false,
          owlReady: false,
          groundingReady: false,
          samReady: false,
          catalogReady: false,
          manifest: null,
        }));
    }
    return visionAssetModePromise;
  }

  async function loadTransformersRuntime() {
    if (!transformersModulePromise) {
      transformersModulePromise = (async () => {
        const assetMode = await getVisionAssetMode();
        let module = null;
        let runtimeMode = assetMode;
        if (assetMode.hasLocalRuntime) {
          try {
            module = await import(`${visionConfig.localTransformersModule}?v=${visionConfig.assetVersion}`);
          } catch (error) {
            console.info("Local Transformers.js asset unavailable, using CDN fallback.", error);
            runtimeMode = {
              ...assetMode,
              local: false,
              hasLocalRuntime: false,
              manifest: null,
            };
          }
        }
        if (!module && visionConfig.allowRemoteVisionAssets) {
          module = await import(visionConfig.remoteTransformersModule);
        }
        if (!module) {
          throw new Error("本地识别运行时未打包，iOS MVP 不会联网加载模型资源。");
        }

        module.env.allowLocalModels = runtimeMode.hasLocalRuntime;
        module.env.allowRemoteModels = Boolean(visionConfig.allowRemoteVisionAssets);
        module.env.localModelPath = visionConfig.localModelPath;
        module.env.useBrowserCache = true;
        configureTransformersRuntime(module);

        return { ...module, runtimeMode };
      })();
    }
    return transformersModulePromise;
  }

  return {
    getVisionAssetMode,
    loadTransformersRuntime,
  };
}
