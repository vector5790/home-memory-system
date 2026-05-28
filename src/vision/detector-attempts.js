export function createDetectorAttemptPlanner({ getGroundingDinoDetector, getSmallModelDetector, visionConfig }) {
  function getOwlVitDetectorAttempt(assetMode) {
    return {
      getDetector: getSmallModelDetector,
      provider: assetMode.owlReady ? "local-owlvit" : "browser-owlvit",
      threshold: visionConfig.detectionThreshold,
    };
  }

  function getGroundingDinoDetectorAttempt(assetMode) {
    return {
      getDetector: getGroundingDinoDetector,
      provider: assetMode.groundingReady ? "local-grounding-dino" : "browser-grounding-dino",
      threshold: visionConfig.groundingThreshold,
    };
  }

  function shouldAttemptGroundingDino(assetMode) {
    if (!assetMode.groundingReady) return false;
    if (!assetMode.owlReady) return true;
    return visionConfig.preferredDetector === "grounding-dino" || visionConfig.enableGroundingDinoFallback;
  }

  function getDetectorAttempts(assetMode) {
    const preferOwlVit = visionConfig.preferredDetector === "owlvit";
    if (preferOwlVit) {
      return [
        ...(assetMode.owlReady || !assetMode.groundingReady ? [getOwlVitDetectorAttempt(assetMode)] : []),
        ...(shouldAttemptGroundingDino(assetMode) ? [getGroundingDinoDetectorAttempt(assetMode)] : []),
      ];
    }

    return [
      ...(assetMode.groundingReady ? [getGroundingDinoDetectorAttempt(assetMode)] : []),
      ...(assetMode.owlReady || !assetMode.groundingReady ? [getOwlVitDetectorAttempt(assetMode)] : []),
    ];
  }

  return {
    getDetectorAttempts,
  };
}
