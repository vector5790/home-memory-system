export const remoteRecognitionProvider = {
  id: "cloud-vlm",
  configured: false,
};

export function providerLabel(provider) {
  if (!provider) return "未识别";
  const name = String(provider);
  if (name === "none") return "等待照片";
  if (name === "local-mock") return "本地演示";
  if (name.endsWith("-fallback")) return "本地降级候选";
  if (name.endsWith("+sam")) return `${providerLabel(name.replace("+sam", ""))} + SAM`;
  if (name.includes("+regions")) return `${providerLabel(name.split("+")[0])} + 区域补全`;
  if (name.startsWith("local-yolox")) return "本地 YOLOX 主体检测";
  if (name.startsWith("local-grounding-dino")) return "本地 Grounding DINO";
  if (name.startsWith("browser-grounding-dino")) return "在线 Grounding DINO";
  if (name.startsWith("local-owlvit")) return "本地 OWL-ViT";
  if (name.startsWith("browser-owlvit")) return "在线 OWL-ViT";
  if (name.startsWith("local-small-model")) return "本地小模型";
  if (name.startsWith("browser-small-model")) return "在线小模型";
  if (name === "local-image") return "本地候选区域";
  if (name === "ios-camera") return "iOS 相机";
  if (name === "ios-photo-library") return "iOS 相册";
  if (name === "android-camera") return "Android 相机";
  if (name === "android-photo-library") return "Android 相册";
  if (name === "native-camera") return "原生相机";
  if (name === "native-photo-library") return "原生相册";
  if (name === "cloud-vlm" || name.startsWith("openai:")) return "云端大模型";
  return name;
}

export function getRequestedRecognitionProvider(visionConfig) {
  if (visionConfig.preferredDetector === "yolox") return "local-yolox-household-subject";
  if (visionConfig.preferredDetector === "owlvit") return "local-owlvit";
  if (visionConfig.preferredDetector === "grounding-dino") return "local-grounding-dino";
  return "local-small-model";
}

export function nativePhotoProvider(platform, source) {
  const prefix = platform.isIOS ? "ios" : platform.isAndroid ? "android" : "native";
  return `${prefix}-${source === "camera" ? "camera" : "photo-library"}`;
}
