#!/usr/bin/env node
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PACKAGE_ID = "household-cn-grounding-dino-siglip";
const DEFAULT_SOURCE_PACKAGE_PATH = "data/generated/vision-index-packages/household-cn-grounding-dino-siglip-real-gallery-v2-plus-weak-v1-v2-full";
const DEFAULT_REPO_CANDIDATES = [
  process.env.HOME_MEMORY_ITEM_EMBEDDING_REPO,
  "/Users/guzeyu/workspace/home-memory-item-embedding",
  "/Users/guzeyu/workspace/home-momory-item-embedding",
  path.resolve(ROOT, "..", "home-memory-item-embedding"),
  path.resolve(ROOT, "..", "home-momory-item-embedding"),
].filter(Boolean);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function resolveRoot(value) {
  const text = String(value || "");
  return path.isAbsolute(text) ? text : path.join(ROOT, text);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function fileExists(filePath) {
  return Boolean(await stat(filePath).catch(() => null));
}

async function findRepo(explicitRepo) {
  const candidates = explicitRepo ? [explicitRepo] : DEFAULT_REPO_CANDIDATES;
  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (await fileExists(resolved)) return resolved;
  }
  throw new Error(`Cannot find home-memory-item-embedding repo. Pass --repo or set HOME_MEMORY_ITEM_EMBEDDING_REPO.`);
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  hash.update(await readFile(filePath));
  return hash.digest("hex");
}

async function resolvePackageDir(repo, args) {
  if (args.manifest) return path.dirname(path.resolve(args.manifest));

  const releasePath = path.join(repo, "data", "releases", "vision-index-current.json");
  if (await fileExists(releasePath)) {
    const release = await readJson(releasePath);
    const packagePath = release.packagePath
      || release.manifest
      || release.current?.packagePath
      || release.current?.manifest
      || release.packages?.catalog?.manifest
      || release.packages?.catalog?.packagePath;
    if (packagePath) {
      const manifestPath = path.isAbsolute(packagePath) ? packagePath : path.join(repo, packagePath);
      return path.dirname(manifestPath);
    }
  }

  const packageId = args.package || DEFAULT_PACKAGE_ID;
  const defaultGeneratedPackage = path.join(repo, DEFAULT_SOURCE_PACKAGE_PATH);
  if (!args.package && await fileExists(path.join(defaultGeneratedPackage, "manifest.json"))) {
    return defaultGeneratedPackage;
  }
  return path.join(repo, "data", "packages", packageId);
}

function requireManifestContract(manifest, manifestPath) {
  if (manifest.kind !== "vision-index-package-manifest") {
    throw new Error(`${manifestPath} is not a vision-index-package-manifest`);
  }
  if (!manifest.packageId || !manifest.version) throw new Error("Manifest must include packageId and version");
  if (!Number.isFinite(Number(manifest.entryCount)) || Number(manifest.entryCount) <= 0) {
    throw new Error("Manifest entryCount must be positive");
  }
  if (!Number.isFinite(Number(manifest.dimension)) || Number(manifest.dimension) <= 0) {
    throw new Error("Manifest dimension must be positive");
  }
  if (manifest.dtype !== "float32") throw new Error(`Unsupported vector dtype: ${manifest.dtype}`);
  if (!manifest.assets?.metadata || !manifest.assets?.vectors) {
    throw new Error("Manifest assets.metadata and assets.vectors are required");
  }
}

async function validatePackage(packageDir, manifest) {
  const metadataPath = path.join(packageDir, manifest.assets.metadata);
  const vectorsPath = path.join(packageDir, manifest.assets.vectors);
  const metadata = await readJson(metadataPath);
  const entries = Array.isArray(metadata.entries) ? metadata.entries : [];
  const entryCount = Number(manifest.entryCount);
  const dimension = Number(manifest.dimension);
  if (entries.length !== entryCount) {
    throw new Error(`metadata entries ${entries.length} != manifest entryCount ${entryCount}`);
  }
  const vectorInfo = await stat(vectorsPath);
  const expectedBytes = entryCount * dimension * 4;
  if (vectorInfo.size !== expectedBytes) {
    throw new Error(`vectors size ${vectorInfo.size} != expected ${expectedBytes}`);
  }
  const metadataSha = await sha256(metadataPath);
  const vectorsSha = await sha256(vectorsPath);
  if (manifest.checksums?.metadataSha256 && manifest.checksums.metadataSha256 !== metadataSha) {
    throw new Error("metadata sha256 mismatch");
  }
  if (manifest.checksums?.vectorsSha256 && manifest.checksums.vectorsSha256 !== vectorsSha) {
    throw new Error("vectors sha256 mismatch");
  }
  return { metadataPath, vectorsPath, metadataSha, vectorsSha, entries };
}

async function copyPackage({ packageDir, manifest, validation, outputRoot, targetPackageId }) {
  const targetDir = path.join(resolveRoot(outputRoot), targetPackageId);
  await mkdir(targetDir, { recursive: true });
  await copyFile(path.join(packageDir, "manifest.json"), path.join(targetDir, "manifest.json"));
  await copyFile(validation.metadataPath, path.join(targetDir, manifest.assets.metadata));
  await copyFile(validation.vectorsPath, path.join(targetDir, manifest.assets.vectors));
  return targetDir;
}

async function writeJsonFallback({ manifest, metadataPath, vectorsPath, outputPath, targetPackageId }) {
  const metadata = await readJson(metadataPath);
  const vectorBuffer = await readFile(vectorsPath);
  const dimension = Number(manifest.dimension);
  const entries = (metadata.entries || []).map((entry, rowIndex) => {
    const byteOffset = rowIndex * dimension * 4;
    const embedding = Array.from(new Float32Array(vectorBuffer.buffer, vectorBuffer.byteOffset + byteOffset, dimension));
    return {
      id: entry.id,
      itemId: entry.categoryId,
      categoryId: entry.categoryId,
      displayName: entry.name,
      name: entry.name,
      appCategory: entry.appCategory || "daily",
      categoryPath: Array.isArray(entry.path) ? entry.path : [],
      cluster: entry.cluster || entry.categoryId,
      sampleId: entry.sampleId || "",
      matchedSampleIds: Array.isArray(entry.matchedSampleIds) ? entry.matchedSampleIds : [entry.sampleId].filter(Boolean),
      metric: manifest.metric,
      embedding,
    };
  });
  const fallback = {
    kind: "vision-index",
    version: manifest.version,
    packageId: targetPackageId,
    sourcePackageId: manifest.packageId,
    embedding: {
      model: manifest.embeddingModel || "",
      dimension,
      normalized: Boolean(manifest.normalized),
    },
    embeddingModel: manifest.embeddingModel || "",
    dimension,
    metric: manifest.metric,
    algorithm: manifest.metric === "max-inner-product" ? "flat-inner-product" : "flat-cosine",
    threshold: Number(manifest.thresholds?.acceptScore ?? 0),
    marginThreshold: Number(manifest.thresholds?.acceptMargin ?? 0),
    thresholds: manifest.thresholds || {},
    topK: Math.max(1, Math.round(Number(manifest.search?.topK || 5))),
    entries,
  };
  const resolvedOutput = resolveRoot(outputPath);
  await mkdir(path.dirname(resolvedOutput), { recursive: true });
  await writeFile(resolvedOutput, `${JSON.stringify(fallback)}\n`);
  return resolvedOutput;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = await findRepo(args.repo);
  const packageDir = await resolvePackageDir(repo, args);
  const manifestPath = path.join(packageDir, "manifest.json");
  const manifest = await readJson(manifestPath);
  requireManifestContract(manifest, manifestPath);
  const validation = await validatePackage(packageDir, manifest);
  const outputRoot = args.outputRoot || "data/vision-index-packages";
  const targetPackageId = args.targetPackage || DEFAULT_PACKAGE_ID;
  const targetDir = await copyPackage({ packageDir, manifest, validation, outputRoot, targetPackageId });
  const fallbackPath = await writeJsonFallback({
    manifest,
    metadataPath: validation.metadataPath,
    vectorsPath: validation.vectorsPath,
    outputPath: args.fallbackOutput || "data/vision-index.household-cn.grounding-dino-siglip.json",
    targetPackageId,
  });
  const pointerPath = path.join(resolveRoot(outputRoot), "current.json");
  const pointer = {
    kind: "home-memory-current-vision-index-package",
    packageId: targetPackageId,
    sourcePackageId: manifest.packageId,
    version: manifest.version,
    embeddingModel: manifest.embeddingModel || "",
    entryCount: manifest.entryCount,
    dimension: manifest.dimension,
    metric: manifest.metric,
    normalized: manifest.normalized,
    manifestPath: path.posix.join(outputRoot.replace(/\\/g, "/"), targetPackageId, "manifest.json"),
    sourceRepo: repo,
    sourcePackageDir: packageDir,
    syncedAt: new Date().toISOString(),
    checksums: {
      metadataSha256: validation.metadataSha,
      vectorsSha256: validation.vectorsSha,
    },
  };
  await mkdir(path.dirname(pointerPath), { recursive: true });
  await writeFile(pointerPath, `${JSON.stringify(pointer, null, 2)}\n`);
  console.log(`Synced ${manifest.packageId}@${manifest.version}`);
  console.log(`- ${path.relative(ROOT, targetDir)}/`);
  console.log(`- ${path.relative(ROOT, pointerPath)}`);
  console.log(`- ${path.relative(ROOT, fallbackPath)}`);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
