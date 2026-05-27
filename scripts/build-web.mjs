import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const outDir = path.join(root, "www");

const requiredFiles = [
  "index.html",
  "app.js",
  "platform.js",
  "styles.css",
  "data/vision-categories.household.json",
  "data/vision-catalog.seed.json",
  "data/vision-index.seed.json",
  "data/vision-index.household-cn.owlvit-clip.json",
  "data/vision-index.household-cn.grounding-dino-clip.json",
];

const requiredVendorFiles = [
  "vendor/vision-manifest.json",
  "vendor/heic2any/heic2any.min.js",
  "vendor/transformers/transformers.min.js",
  "vendor/transformers/ort-wasm-simd-threaded.jsep.mjs",
  "vendor/transformers/ort-wasm-simd-threaded.jsep.wasm",
];

async function assertFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  const info = await stat(fullPath).catch(() => null);
  if (!info?.isFile()) {
    throw new Error(`Missing required asset: ${relativePath}`);
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

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const relativePath of ["index.html", "app.js", "platform.js", "styles.css", "data", "vendor"]) {
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
