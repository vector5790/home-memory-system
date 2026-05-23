export const HOME_DATA_SCHEMA_VERSION = 1;

function getCapacitor() {
  return globalThis.Capacitor || null;
}

function getPlugin(name) {
  return getCapacitor()?.Plugins?.[name] || null;
}

function detectRuntime() {
  const capacitor = getCapacitor();
  const platform = capacitor?.getPlatform?.() || "web";
  const isNative = Boolean(capacitor?.isNativePlatform?.()) || platform === "ios";
  return {
    platform,
    isNative,
    isIOS: platform === "ios",
    hasCapacitor: Boolean(capacitor),
  };
}

function makeStorageAdapter({ storageKey, schemaVersion }) {
  function unwrapSnapshot(value) {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && typeof parsed.value === "string") {
        return parsed.value;
      }
    } catch {
      // Plain prototype snapshots are already the app state JSON.
    }
    return value;
  }

  return {
    readSnapshotSync() {
      try {
        return localStorage.getItem(storageKey);
      } catch (error) {
        console.warn("Unable to read browser storage.", error);
        return null;
      }
    },

    async readSnapshotAsync() {
      const Preferences = getPlugin("Preferences");
      if (Preferences?.get) {
        const result = await Preferences.get({ key: storageKey }).catch((error) => {
          console.warn("Native storage read failed.", error);
          return null;
        });
        const nativeValue = unwrapSnapshot(result?.value);
        if (nativeValue) return nativeValue;
      }
      return this.readSnapshotSync();
    },

    writeSnapshot(value) {
      let browserSaved = false;
      try {
        localStorage.setItem(storageKey, value);
        browserSaved = true;
      } catch (error) {
        console.warn("Browser storage write failed.", error);
      }

      const Preferences = getPlugin("Preferences");
      if (Preferences?.set) {
        Preferences.set({
          key: storageKey,
          value: JSON.stringify({
            schemaVersion,
            savedAt: new Date().toISOString(),
            value,
          }),
        }).catch((error) => console.warn("Native storage write failed.", error));
        return true;
      }

      return browserSaved;
    },

    removeSnapshot() {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn("Browser storage clear failed.", error);
      }
      const Preferences = getPlugin("Preferences");
      if (Preferences?.remove) {
        Preferences.remove({ key: storageKey }).catch((error) => console.warn("Native storage clear failed.", error));
      }
    },
  };
}

function makeFileAdapter() {
  return {
    isAvailable: () => Boolean(getPlugin("Filesystem")?.writeFile),

    async writeText(path, data) {
      const Filesystem = getPlugin("Filesystem");
      if (!Filesystem?.writeFile) throw new Error("当前环境暂不支持原生文件写入。");
      return Filesystem.writeFile({
        path,
        data,
        directory: "DATA",
        recursive: true,
        encoding: "utf8",
      });
    },

    async writeDataUrl(path, dataUrl) {
      const Filesystem = getPlugin("Filesystem");
      if (!Filesystem?.writeFile) throw new Error("当前环境暂不支持原生照片保存。");
      const match = String(dataUrl || "").match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
      if (!match) throw new Error("照片数据格式不正确。");
      await Filesystem.writeFile({
        path,
        data: match[2],
        directory: "DATA",
        recursive: true,
      });
      const result = await Filesystem.getUri?.({ path, directory: "DATA" });
      const uri = result?.uri || path;
      return {
        path,
        mimeType: match[1],
        uri,
        webPath: getCapacitor()?.convertFileSrc?.(uri) || uri,
      };
    },

    async readText(path) {
      const Filesystem = getPlugin("Filesystem");
      if (!Filesystem?.readFile) throw new Error("当前环境暂不支持原生文件读取。");
      const result = await Filesystem.readFile({
        path,
        directory: "DATA",
        encoding: "utf8",
      });
      return result.data || "";
    },

    async getUri(path) {
      const Filesystem = getPlugin("Filesystem");
      if (!Filesystem?.getUri) return path;
      const result = await Filesystem.getUri({ path, directory: "DATA" });
      return result.uri || path;
    },
  };
}

function makePhotoAdapter(runtime) {
  const cameraOptions = {
    quality: 88,
    allowEditing: false,
    correctOrientation: true,
    resultType: "dataUrl",
  };

  async function photoToDataUrl(photo) {
    if (photo?.dataUrl) return photo.dataUrl;
    if (photo?.base64String) {
      const format = photo.format || "jpeg";
      return `data:image/${format};base64,${photo.base64String}`;
    }

    const sourceUrl = photo?.webPath || photo?.path;
    if (!sourceUrl) return "";
    const readableUrl = getCapacitor()?.convertFileSrc?.(sourceUrl) || sourceUrl;
    const response = await fetch(readableUrl);
    if (!response.ok) {
      throw new Error("照片数据读取失败，请重试。");
    }
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("照片数据读取失败，请重试。"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(blob);
    });
  }

  async function getNativePhoto(source) {
    const Camera = getPlugin("Camera");
    if (!runtime.isIOS || !Camera?.getPhoto) {
      throw new Error("当前环境暂不支持原生相机/相册。");
    }
    const photo = await Camera.getPhoto({
      ...cameraOptions,
      source,
    });
    const dataUrl = await photoToDataUrl(photo);
    if (!dataUrl) {
      throw new Error("没有拿到可用照片，请重试。");
    }
    return {
      dataUrl,
      format: photo.format || "jpeg",
      source,
    };
  }

  return {
    canUseNativeCamera: () => Boolean(runtime.isIOS && getPlugin("Camera")?.getPhoto),
    canUseNativePhotoLibrary: () => Boolean(runtime.isIOS && getPlugin("Camera")?.getPhoto),
    captureFromCamera: () => getNativePhoto("CAMERA"),
    pickFromLibrary: () => getNativePhoto("PHOTOS"),
  };
}

function makeNotificationsAdapter() {
  return {
    async requestPermissions() {
      const LocalNotifications = getPlugin("LocalNotifications");
      if (!LocalNotifications?.requestPermissions) return { display: "unavailable" };
      return LocalNotifications.requestPermissions();
    },

    async schedule(notifications = []) {
      const LocalNotifications = getPlugin("LocalNotifications");
      if (!LocalNotifications?.schedule || !Array.isArray(notifications) || !notifications.length) {
        return { scheduled: [] };
      }
      return LocalNotifications.schedule({
        notifications: notifications.map((notification) => ({
          id: Number(notification.id),
          title: notification.title || "家忆提醒",
          body: notification.body || "",
          schedule: notification.schedule,
          extra: notification.extra || {},
        })),
      });
    },

    async cancel(ids = []) {
      const LocalNotifications = getPlugin("LocalNotifications");
      const notifications = ids
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id))
        .map((id) => ({ id }));
      if (!LocalNotifications?.cancel || !notifications.length) return { cancelled: [] };
      return LocalNotifications.cancel({ notifications });
    },
  };
}

export function createHomeMemoryPlatform(options = {}) {
  const runtime = detectRuntime();
  return {
    ...runtime,
    storage: makeStorageAdapter(options),
    files: makeFileAdapter(),
    photos: makePhotoAdapter(runtime),
    notifications: makeNotificationsAdapter(),
    convertFileSrc(url) {
      return getCapacitor()?.convertFileSrc?.(url) || url;
    },
    describe() {
      return runtime.isIOS ? "iOS App" : "Web Browser";
    },
  };
}
