export const LOCAL_DATA_STORE_CONTRACT_VERSION = 1;

export function createLocalDataStore({ platform, createId } = {}) {
  if (!platform?.storage) {
    throw new Error("Local data store requires a platform storage adapter.");
  }

  function clone(value) {
    return structuredClone(value);
  }

  function getDurableImageValue(image, imageRef) {
    if (imageRef?.webPath) return imageRef.webPath;
    if (imageRef?.uri) return platform.convertFileSrc(imageRef.uri);
    if (typeof image === "string" && image.startsWith("data:image/")) return null;
    return image || null;
  }

  function createPersistSnapshot(state, { schemaVersion, omitCaptureImage = false, omitPlaceImages = false, usePhotoReferences = false } = {}) {
    const snapshot = clone(state);
    snapshot.schemaVersion = schemaVersion;
    snapshot.savedAt = new Date().toISOString();
    snapshot.cameraOn = false;
    if (omitCaptureImage && snapshot.capture) {
      snapshot.capture.image = null;
    }
    if (usePhotoReferences && snapshot.capture) {
      snapshot.capture.image = getDurableImageValue(snapshot.capture.image, snapshot.capture.imageRef);
    }
    if (omitPlaceImages) {
      snapshot.rooms = snapshot.rooms.map((room) => ({
        ...room,
        places: (room.places || []).map((place) => ({ ...place, image: null })),
      }));
    } else if (usePhotoReferences) {
      snapshot.rooms = snapshot.rooms.map((room) => ({
        ...room,
        places: (room.places || []).map((place) => ({
          ...place,
          image: getDurableImageValue(place.image, place.imageRef),
        })),
      }));
    }
    return snapshot;
  }

  function normalizeRawState(raw, { seedState, normalizeState }) {
    if (!raw) return clone(seedState);
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  }

  return {
    createPersistSnapshot,

    loadInitialStateSync({ seedState, normalizeState }) {
      try {
        return normalizeRawState(platform.storage.readSnapshotSync(), { seedState, normalizeState });
      } catch {
        return clone(seedState);
      }
    },

    async hydrateNativeState({ seedState, normalizeState }) {
      const raw = await platform.storage.readSnapshotAsync();
      return normalizeRawState(raw, { seedState, normalizeState });
    },

    saveSnapshot({ state, schemaVersion, usePhotoReferences = false }) {
      const attempts = [
        createPersistSnapshot(state, { schemaVersion, usePhotoReferences }),
        createPersistSnapshot(state, { schemaVersion, usePhotoReferences, omitCaptureImage: true }),
        createPersistSnapshot(state, { schemaVersion, usePhotoReferences, omitCaptureImage: true, omitPlaceImages: true }),
      ];
      let lastError = null;
      for (const snapshot of attempts) {
        try {
          if (platform.storage.writeSnapshot(JSON.stringify(snapshot))) {
            return { ok: true, lastError: null };
          }
        } catch (error) {
          lastError = error;
        }
      }
      return { ok: false, lastError };
    },

    async flushPendingWrites() {
      return platform.storage.flushPendingWrites();
    },

    clearSnapshot() {
      platform.storage.removeSnapshot();
    },

    async persistPhotoDataUrl(dataUrl, source = "capture") {
      if (!platform.isNative || !platform.files.isAvailable() || !String(dataUrl || "").startsWith("data:image/")) {
        return null;
      }
      const extension = dataUrl.startsWith("data:image/png") ? "png" : "jpg";
      const id = createId("photo", source);
      const saved = await platform.files.writeDataUrl(`photos/${id}.${extension}`, dataUrl);
      return {
        id,
        source,
        ...saved,
      };
    },
  };
}
