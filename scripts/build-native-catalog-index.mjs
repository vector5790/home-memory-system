import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultIndexes = [
  "data/vision-index.household-cn.grounding-dino-clip.json",
  "data/vision-index.household-cn.owlvit-clip.json",
];

function nativePaths(indexPath) {
  const parsed = path.parse(indexPath);
  const base = path.join(parsed.dir, parsed.name);
  return {
    idsPath: `${base}.native-ids.json`,
    valuesPath: `${base}.native.f32`,
  };
}

function normalize(values) {
  let norm = 0;
  for (const value of values) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  return values.map((value) => value / norm);
}

export async function buildNativeCatalogIndex(relativeIndexPath) {
  const fullIndexPath = path.join(root, relativeIndexPath);
  const index = JSON.parse(await readFile(fullIndexPath, "utf8"));
  const entries = Array.isArray(index.entries) ? index.entries : [];
  const dimension = Number(index.dimension || entries.find((entry) => Array.isArray(entry.embedding))?.embedding?.length || 0);
  if (!dimension) throw new Error(`Cannot infer embedding dimension for ${relativeIndexPath}`);

  const ids = [];
  const values = new Float32Array(entries.length * dimension);
  let count = 0;
  for (const entry of entries) {
    if (!entry?.id || !Array.isArray(entry.embedding) || entry.embedding.length !== dimension) continue;
    const vector = normalize(entry.embedding.map(Number));
    ids.push(entry.id);
    values.set(vector, count * dimension);
    count += 1;
  }
  if (!count) throw new Error(`No compatible embeddings found in ${relativeIndexPath}`);

  const slicedValues = values.subarray(0, count * dimension);
  const { idsPath, valuesPath } = nativePaths(relativeIndexPath);
  const metadataPath = `${path.join(path.parse(relativeIndexPath).dir, path.parse(relativeIndexPath).name)}.native-meta.json`;
  await mkdir(path.dirname(path.join(root, idsPath)), { recursive: true });
  const metadataEntries = entries.map((entry) => {
    const { embedding: _embedding, ...rest } = entry;
    return rest;
  });
  await writeFile(path.join(root, metadataPath), `${JSON.stringify({
    ...index,
    sourceIndex: `/${relativeIndexPath}`,
    nativeIdsPath: `/${idsPath}`,
    nativeValuesPath: `/${valuesPath}`,
    entries: metadataEntries,
  })}\n`);
  await writeFile(path.join(root, idsPath), `${JSON.stringify({
    kind: "home-memory-native-catalog-index",
    version: index.version || index.buildVersion || "",
    sourceIndex: `/${relativeIndexPath}`,
    metric: index.metric || "max-inner-product",
    normalized: true,
    dimension,
    count,
    ids,
    valuesPath: `/${valuesPath}`,
  })}\n`);
  await writeFile(path.join(root, valuesPath), Buffer.from(
    slicedValues.buffer,
    slicedValues.byteOffset,
    slicedValues.byteLength,
  ));
  return { idsPath, valuesPath, metadataPath, count, dimension };
}

async function main() {
  const indexes = process.argv.slice(2);
  const targets = indexes.length ? indexes : defaultIndexes;
  for (const indexPath of targets) {
    const output = await buildNativeCatalogIndex(indexPath.replace(/^\//, ""));
    console.log(`Built native catalog index ${indexPath}: ${output.count}x${output.dimension}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
