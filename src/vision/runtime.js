export function createVisionRuntimeHelpers({ maxWasmThreads }) {
  function getVisionWasmThreadCount() {
    if (!window.crossOriginIsolated || typeof SharedArrayBuffer === "undefined") return 1;
    const cores = Number(navigator.hardwareConcurrency) || 2;
    return Math.max(1, Math.min(maxWasmThreads, Math.max(1, cores - 1)));
  }

  function configureTransformersRuntime(module) {
    try {
      const wasmBackend = module.env?.backends?.onnx?.wasm;
      if (!wasmBackend) return;
      wasmBackend.numThreads = getVisionWasmThreadCount();
      wasmBackend.wasmPaths = "/vendor/transformers/";
    } catch (error) {
      console.info("Vision runtime thread tuning skipped.", error);
    }
  }

  return {
    configureTransformersRuntime,
    getVisionWasmThreadCount,
  };
}
