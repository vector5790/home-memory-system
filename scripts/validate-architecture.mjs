import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLocalDataStore } from "../src/store/local-data-store.js";
import { normalizeText } from "../src/domain/text.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceDir = path.join(root, "src");
const fileSizeLimits = new Map([
  ["src/main.js", 80],
  ["src/ui/app.js", 3800],
  ["src/config/app-config.js", 500],
  ["src/vision/catalog.js", 650],
  ["src/vision/image-processing.js", 450],
  ["src/vision/recognition-pipeline.js", 1700],
  ["src/styles/base.css", 700],
  ["src/styles/capture.css", 1700],
  ["src/styles/surface.css", 600],
  ["src/styles/responsive.css", 600],
]);

const forbiddenRootFiles = ["app.js", "platform.js"];

const forbiddenImports = [
  {
    filePattern: /^src\/domain\//,
    importPattern: /from\s+["'][^"']*(?:ui|store|platform|vision)\//,
    message: "domain modules must not import UI, store, platform, or vision modules",
  },
  {
    filePattern: /^src\/store\//,
    importPattern: /from\s+["'][^"']*(?:ui|vision)\//,
    message: "store modules must not import UI or vision modules",
  },
  {
    filePattern: /^src\/vision\//,
    importPattern: /from\s+["'][^"']*(?:ui|store)\//,
    message: "vision modules must not import UI or store modules",
  },
];

function findImportBoundaryViolation(relativePath, source) {
  for (const rule of forbiddenImports) {
    if (rule.filePattern.test(relativePath) && rule.importPattern.test(source)) {
      return `${relativePath}: ${rule.message}`;
    }
  }
  return "";
}

async function listJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listJsFiles(full));
    if (entry.isFile() && entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

async function assertFileSizes() {
  for (const [relativePath, maxLines] of fileSizeLimits) {
    const file = path.join(root, relativePath);
    const content = await readFile(file, "utf8");
    const lines = content.trimEnd().split("\n").length;
    if (lines > maxLines) {
      throw new Error(`${relativePath} has ${lines} lines; expected <= ${maxLines}`);
    }
  }
}

async function assertSourceLayout() {
  for (const required of ["config", "domain", "platform", "store", "styles", "ui", "vision"]) {
    const info = await stat(path.join(sourceDir, required)).catch(() => null);
    if (!info?.isDirectory()) {
      throw new Error(`Missing frontend module directory: src/${required}`);
    }
  }
}

async function assertRootEntrypointsRemoved() {
  for (const relativePath of forbiddenRootFiles) {
    const info = await stat(path.join(root, relativePath)).catch(() => null);
    if (info?.isFile()) {
      throw new Error(`${relativePath} must stay under src/ module boundaries`);
    }
  }
}

async function assertImportBoundaries() {
  const files = await listJsFiles(sourceDir);
  for (const file of files) {
    const rel = relative(file);
    const source = await readFile(file, "utf8");
    const violation = findImportBoundaryViolation(rel, source);
    if (violation) throw new Error(violation);
  }
}

async function assertDomainAndStoreSmoke() {
  if (normalizeText("  牛奶，Milk! ") !== "牛奶milk") {
    throw new Error("domain normalizeText smoke check failed");
  }

  const writes = [];
  const platform = {
    isNative: false,
    storage: {
      readSnapshotSync: () => "",
      readSnapshotAsync: async () => "",
      writeSnapshot: (value) => {
        writes.push(value);
        return true;
      },
      removeSnapshot: () => {},
      flushPendingWrites: async () => {},
    },
    files: {
      isAvailable: () => false,
    },
    convertFileSrc: (value) => value,
  };
  const store = createLocalDataStore({
    platform,
    createId: (prefix) => `${prefix}-test`,
  });
  const seedState = { rooms: [], items: [], capture: { image: "data:image/jpeg;base64,AAAA" } };
  const loaded = store.loadInitialStateSync({
    seedState,
    normalizeState: (parsed) => ({ ...seedState, ...parsed }),
  });
  if (loaded === seedState || !Array.isArray(loaded.rooms)) {
    throw new Error("store load smoke check failed");
  }
  const saved = store.saveSnapshot({ state: seedState, schemaVersion: 1, usePhotoReferences: true });
  if (!saved.ok || writes.length !== 1) {
    throw new Error("store save smoke check failed");
  }
  const snapshot = JSON.parse(writes[0]);
  if (snapshot.capture.image !== null) {
    throw new Error("store photo-reference serialization smoke check failed");
  }
}

async function main() {
  if (process.argv.includes("--self-test")) {
    const violation = findImportBoundaryViolation("src/domain/bad.js", "import { render } from '../ui/app.js';");
    if (!violation) throw new Error("Architecture validation self-test failed to detect a domain -> UI import.");
    console.log("Architecture validation self-test passed.");
    return;
  }

  await assertSourceLayout();
  await assertRootEntrypointsRemoved();
  await assertFileSizes();
  await assertImportBoundaries();
  await assertDomainAndStoreSmoke();
  console.log("Architecture validation passed.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
