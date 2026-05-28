#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function resolveRoot(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(resolveRoot(filePath), "utf8"));
}

async function writeJson(filePath, payload) {
  const resolved = resolveRoot(filePath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`wrote ${path.relative(ROOT, resolved)}`);
}

function inferRole(sample) {
  const explicit = String(sample.imageRole || sample.indexRole || sample.role || "").toLowerCase();
  if (["product", "scene", "detail", "variant"].includes(explicit)) return explicit;
  const text = [
    sample.sourceTitle,
    sample.variant,
    sample.sourceProvider,
    sample.sourceHost,
    sample.imagePath,
  ].join(" ").toLowerCase();
  if (/scene|room|living|kitchen|bedroom|home|家里|客厅|厨房|卧室|实拍|场景|晒单|买家秀/.test(text)) return "scene";
  if (/detail|close|port|label|knob|局部|细节|接口|铭牌|旋钮/.test(text)) return "detail";
  if (/variant|color|style|model|型号|款式|颜色|系列/.test(text)) return "variant";
  return "product";
}

function countRoles(samples) {
  const counts = {};
  for (const sample of samples) {
    const role = inferRole(sample);
    counts[role] = (counts[role] || 0) + 1;
  }
  return counts;
}

function roleRequirement(policy, role, highConfusion = false) {
  const required = (policy.requiredRoles || []).find((item) => item.role === role);
  if (required) return Number(required.minPerLeaf) || 0;
  const recommended = (policy.recommendedRoles || []).find((item) => item.role === role);
  if (recommended && highConfusion) return Number(recommended.minPerHighConfusionLeaf) || 0;
  return 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const taxonomy = await readJson(args.taxonomy || "data/vision-categories.household.json");
  const manifest = await readJson(args.manifest || "data/vision-household-image-manifest.cn.json");
  const policy = await readJson(args.policy || "data/vision-index-image-policy.household.json");
  const categories = (taxonomy.categories || []).filter((category) => category.active !== false);
  const samples = manifest.samples || [];
  const byCategory = new Map();
  for (const sample of samples) {
    if (!byCategory.has(sample.categoryId)) byCategory.set(sample.categoryId, []);
    byCategory.get(sample.categoryId).push(sample);
  }
  const highConfusionIds = new Set();
  const clusterConfig = (await readFile(resolveRoot("src/config/app-config.js"), "utf8"))
    .match(/catalogClusterThresholds:\s*\[([\s\S]*?)\],\n\s*maxDetectedObjects/)?.[1] || "";
  for (const categoryId of clusterConfig.matchAll(/"([a-z0-9-]+)"/g)) {
    highConfusionIds.add(categoryId[1]);
  }
  const rows = categories.map((category) => {
    const categorySamples = byCategory.get(category.id) || [];
    const roleCounts = countRoles(categorySamples);
    const highConfusion = highConfusionIds.has(category.id);
    const missingRoles = ["product", "scene", "detail", "variant"].filter((role) => {
      const required = roleRequirement(policy, role, highConfusion);
      return required > 0 && (roleCounts[role] || 0) < required;
    });
    return {
      categoryId: category.id,
      displayName: category.displayName,
      highConfusion,
      sampleCount: categorySamples.length,
      roleCounts,
      missingRoles,
      ready: missingRoles.length === 0,
    };
  });
  const report = {
    kind: "vision-index-image-coverage-report",
    version: "20260528-household-index-image-coverage",
    generatedAt: new Date().toISOString(),
    policyVersion: policy.version,
    categoryCount: rows.length,
    readyCount: rows.filter((row) => row.ready).length,
    missingSceneCount: rows.filter((row) => row.missingRoles.includes("scene")).length,
    highConfusionCount: rows.filter((row) => row.highConfusion).length,
    highConfusionReadyCount: rows.filter((row) => row.highConfusion && row.ready).length,
    rows,
  };
  await writeJson(args.output || "data/generated/vision-index-image-coverage.household.json", report);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
