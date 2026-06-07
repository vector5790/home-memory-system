import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildNativeCatalogIndex } from "./build-native-catalog-index.mjs";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const outDir = path.join(root, "www");

const requiredFiles = [
  "index.html",
  "src/main.js",
  "src/ui/app.js",
  "src/platform/index.js",
  "styles.css",
  "data/vision-categories.household.json",
  "data/vision-catalog.seed.json",
  "data/vision-index.seed.json",
  "data/vision-index.household-cn.owlvit-clip.json",
  "data/vision-index.household-cn.grounding-dino-clip.json",
  "data/vision-index-packages/household-cn-grounding-dino-siglip/manifest.json",
  "data/vision-index-packages/household-cn-grounding-dino-siglip/metadata.json",
  "data/vision-index-packages/household-cn-grounding-dino-siglip/vectors.f32",
];

const requiredVendorFiles = [
  "vendor/vision-manifest.json",
  "vendor/heic2any/heic2any.min.js",
  "vendor/onnxruntime/ort.wasm.min.mjs",
  "vendor/onnxruntime/ort-wasm-simd-threaded.mjs",
  "vendor/onnxruntime/ort-wasm-simd-threaded.wasm",
  "vendor/models/home-memory/yolox-household-subject/model.onnx",
  "vendor/transformers/transformers.min.js",
  "vendor/transformers/ort-wasm-simd-threaded.jsep.mjs",
  "vendor/transformers/ort-wasm-simd-threaded.jsep.wasm",
];

async function assertFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  const info = await stat(fullPath).catch(() => null);
  if (!info?.isFile()) {
    const assetHint = relativePath.startsWith("vendor/")
      ? "\nRun `npm run assets:vision` before packaging the iOS MVP, then retry `npm run build:web`."
      : "";
    throw new Error(`Missing required asset: ${relativePath}${assetHint}`);
  }
}

async function copyPath(relativePath) {
  const source = path.join(root, relativePath);
  const target = path.join(outDir, relativePath);
  if (!existsSync(source)) return false;
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true });
  return true;
}

async function validateVendorManifest() {
  for (const relativePath of requiredVendorFiles) {
    await assertFile(relativePath);
  }

  const manifest = JSON.parse(await readFile(path.join(root, "vendor/vision-manifest.json"), "utf8"));
  const files = manifest.files && typeof manifest.files === "object" ? manifest.files : {};
  for (const modelFiles of Object.values(files)) {
    if (!Array.isArray(modelFiles)) continue;
    for (const modelFile of modelFiles) {
      await assertFile(path.join("vendor/models", modelFile));
    }
  }
}

async function main() {
  for (const relativePath of requiredFiles) {
    await assertFile(relativePath);
  }
  await validateVendorManifest();
  await buildNativeCatalogIndex("data/vision-index.household-cn.grounding-dino-clip.json");
  await buildNativeCatalogIndex("data/vision-index.household-cn.owlvit-clip.json");

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const relativePath of ["index.html", "src", "styles.css", "data", "vendor"]) {
    await copyPath(relativePath);
  }

  const buildInfo = {
    generatedAt: new Date().toISOString(),
    app: "Home Memory",
    webDir: "www",
    includesVendorModels: true,
  };
  await writeFile(path.join(outDir, "build-info.json"), `${JSON.stringify(buildInfo, null, 2)}\n`);
  console.log(`Built web assets into ${path.relative(root, outDir)}/`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
