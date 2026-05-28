#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function renderHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>视觉运行时能力检测</title>
  <style>
    body { font: 14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; margin: 24px; color: #172033; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    table { border-collapse: collapse; width: 100%; max-width: 760px; }
    th, td { border-bottom: 1px solid #d8dde6; padding: 8px 10px; text-align: left; }
    .ok { color: #16794c; font-weight: 700; }
    .bad { color: #b42318; font-weight: 700; }
    code { background: #f2f4f7; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>视觉运行时能力检测</h1>
  <table>
    <thead><tr><th>能力</th><th>状态</th><th>说明</th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
  <script type="module">
    const checks = [
      ["TextDetector", "TextDetector" in window, "浏览器原生 OCR；iOS WKWebView 通常不可用，需要实际设备验证。"],
      ["BarcodeDetector", "BarcodeDetector" in window, "可辅助识别包装条码。"],
      ["createImageBitmap", "createImageBitmap" in window, "OCR 和 crop 后处理会用到。"],
      ["OffscreenCanvas", "OffscreenCanvas" in window, "可提升图像预处理性能。"],
      ["SharedArrayBuffer", "SharedArrayBuffer" in window, "WASM 多线程需要 crossOriginIsolated。"],
      ["crossOriginIsolated", window.crossOriginIsolated === true, "Transformers/ONNX 多线程条件。"],
    ];
    document.getElementById("rows").innerHTML = checks.map(([name, ok, note]) => \`
      <tr><td><code>\${name}</code></td><td class="\${ok ? "ok" : "bad"}">\${ok ? "可用" : "不可用"}</td><td>\${note}</td></tr>
    \`).join("");
    window.__visionRuntimeCapabilityReport = Object.fromEntries(checks.map(([name, ok]) => [name, ok]));
  </script>
</body>
</html>`;
}

async function main() {
  const output = path.join(ROOT, "data/generated/vision-runtime-capability-check.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, renderHtml(), "utf8");
  console.log(`wrote ${path.relative(ROOT, output)}`);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
