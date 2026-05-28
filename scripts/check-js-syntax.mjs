import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const roots = ["src", "scripts"];

async function listJavaScriptFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listJavaScriptFiles(full));
    } else if (entry.isFile() && /\.(?:mjs|js)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = [];
for (const relativeRoot of roots) {
  files.push(...await listJavaScriptFiles(path.join(root, relativeRoot)));
}
files.push(path.join(root, "server.mjs"));

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`Checked ${files.length} JavaScript files.`);
