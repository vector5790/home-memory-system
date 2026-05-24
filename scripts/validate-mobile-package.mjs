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

async function assertFile(relativePath) {
  const info = await stat(path.join(root, relativePath)).catch(() => null);
  if (!info?.isFile()) {
    throw new Error(`Missing packaged iOS runtime asset: ${relativePath}`);
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

  console.log("Mobile package validation passed.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
