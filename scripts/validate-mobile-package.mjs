import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const requiredPackagedFiles = [
  "www/index.html",
  "www/src/main.js",
  "www/src/ui/app.js",
  "www/src/platform/index.js",
  "www/vendor/vision-manifest.json",
  "www/vendor/transformers/transformers.min.js",
  "www/vendor/transformers/ort-wasm-simd-threaded.jsep.mjs",
  "www/vendor/transformers/ort-wasm-simd-threaded.jsep.wasm",
];
const expectedSiglipEntryCount = 3968;
const expectedSiglipDimension = 768;
const siglipPackageDir = "data/vision-index-packages/household-cn-grounding-dino-siglip";

async function assertFile(relativePath) {
  const info = await stat(path.join(root, relativePath)).catch(() => null);
  if (!info?.isFile()) {
    throw new Error(`Missing packaged iOS runtime asset: ${relativePath}`);
  }
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function assertSiglipPackage(publicRoot) {
  const prefix = `${publicRoot}/${siglipPackageDir}`;
  for (const file of [
    `${prefix}/manifest.json`,
    `${prefix}/metadata.json`,
    `${prefix}/vectors.f32`,
    `${publicRoot}/data/vision-index.household-cn.grounding-dino-siglip.json`,
  ]) {
    await assertFile(file);
  }
  const manifest = await readJson(`${prefix}/manifest.json`);
  const metadata = await readJson(`${prefix}/metadata.json`);
  const fallback = await readJson(`${publicRoot}/data/vision-index.household-cn.grounding-dino-siglip.json`);
  const vectorInfo = await stat(path.join(root, `${prefix}/vectors.f32`));
  const expectedVectorBytes = expectedSiglipEntryCount * expectedSiglipDimension * 4;
  if (
    Number(manifest.entryCount) !== expectedSiglipEntryCount
    || Number(manifest.dimension) !== expectedSiglipDimension
    || metadata.entries?.length !== expectedSiglipEntryCount
    || fallback.entries?.length !== expectedSiglipEntryCount
    || vectorInfo.size !== expectedVectorBytes
  ) {
    throw new Error(`${publicRoot} SigLIP package mismatch: manifest=${manifest.entryCount}/${manifest.dimension}, metadata=${metadata.entries?.length || 0}, fallback=${fallback.entries?.length || 0}, vectors=${vectorInfo.size}`);
  }
}

async function main() {
  for (const file of requiredPackagedFiles) {
    await assertFile(file);
  }

  const indexHtml = await readFile(path.join(root, "www/index.html"), "utf8");
  if (/server\\.(?:py|mjs)|localhost|127\\.0\\.0\\.1/.test(indexHtml)) {
    throw new Error("Packaged index.html contains a development server dependency.");
  }

  const appSource = await readFile(path.join(root, "www/src/ui/app.js"), "utf8");
  if (/allowRemoteVisionAssets:\\s*true/.test(appSource)) {
    throw new Error("Packaged iOS app enables unconditional remote vision assets.");
  }

  await assertSiglipPackage("www");
  await assertSiglipPackage("ios/App/App/public");

  console.log("Mobile package validation passed.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
