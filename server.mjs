import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const port = Number(process.argv[2] || 4173);
const root = fileURLToPath(new URL(".", import.meta.url));
const bodyLimit = 12 * 1024 * 1024;
const model = process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini";

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".wasm", "application/wasm"],
]);

const categories = new Set(["food", "medicine", "pet", "document", "tool", "daily", "appliance"]);

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > bodyLimit) {
        reject(new Error("图片太大，请压缩后再试。"));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("请求 JSON 无法解析。"));
      }
    });
    request.on("error", reject);
  });
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function normalizeBox(box = {}) {
  const w = clamp(box.w ?? 18, 4, 100);
  const h = clamp(box.h ?? 12, 4, 100);
  return {
    x: clamp(box.x ?? 0, 0, 100 - w),
    y: clamp(box.y ?? 0, 0, 100 - h),
    w,
    h,
  };
}

function normalizeCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  const name = String(candidate.name || "").trim();
  if (!name) return null;
  return {
    name,
    category: categories.has(candidate.category) ? candidate.category : "daily",
    qty: Math.max(1, Math.round(Number(candidate.qty) || 1)),
    expireAt: String(candidate.expireAt || ""),
    nextAt: String(candidate.nextAt || ""),
    nextLabel: String(candidate.nextLabel || ""),
    container: String(candidate.container || ""),
    box: normalizeBox(candidate.box),
    confidence: clamp(candidate.confidence ?? 0.7, 0, 1),
  };
}

function getOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  return (payload.output || [])
    .flatMap((output) => output.content || [])
    .map((content) => content.text)
    .filter((text) => typeof text === "string")
    .join("\n");
}

async function recognizeImage(payload) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("未配置 OPENAI_API_KEY，上传照片不会使用本地模拟候选。");
  }
  if (typeof payload.image !== "string" || !payload.image.startsWith("data:image/")) {
    throw new Error("请先上传一张图片。");
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["candidates"],
    properties: {
      candidates: {
        type: "array",
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "category", "qty", "expireAt", "nextAt", "nextLabel", "container", "box", "confidence"],
          properties: {
            name: { type: "string" },
            category: { type: "string", enum: [...categories] },
            qty: { type: "integer", minimum: 1 },
            expireAt: { type: "string" },
            nextAt: { type: "string" },
            nextLabel: { type: "string" },
            container: { type: "string" },
            box: {
              type: "object",
              additionalProperties: false,
              required: ["x", "y", "w", "h"],
              properties: {
                x: { type: "number", minimum: 0, maximum: 100 },
                y: { type: "number", minimum: 0, maximum: 100 },
                w: { type: "number", minimum: 1, maximum: 100 },
                h: { type: "number", minimum: 1, maximum: 100 },
              },
            },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
        },
      },
    },
  };

  const prompt = [
    "你是家庭物品照片识别助手。只根据用户上传的这一张真实图片生成候选物品，不要使用任何演示数据、历史候选或先验模板。",
    "识别可收纳、可查找、值得入库的真实可见物品；不要把电视、墙面、窗帘、人体、房间结构当作候选物品，除非它们是用户明显要管理的独立物品。",
    "bounding box 使用相对于整张图片的百分比坐标：x/y/w/h 均为 0-100。",
    "如果日期、数量、容器无法从图片判断，使用空字符串或合理保守数量 1。",
    `当前房间：${payload.room || "未知房间"}。当前储物点：${payload.place || "未知储物点"}。储物点备注：${payload.placeNote || ""}。`,
    `已有同位置物品参考（只用于避免重复命名，不可照抄）：${JSON.stringify(payload.existingItems || [])}。`,
  ].join("");

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: payload.image, detail: "high" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "home_inventory_candidates",
          strict: true,
          schema,
        },
      },
    }),
  });

  const apiPayload = await apiResponse.json();
  if (!apiResponse.ok) {
    throw new Error(`OpenAI 识别请求失败：${JSON.stringify(apiPayload).slice(0, 500)}`);
  }

  const text = getOutputText(apiPayload);
  if (!text) throw new Error("OpenAI 没有返回可解析的候选物品。");
  const parsed = JSON.parse(text);
  const candidates = (parsed.candidates || []).map(normalizeCandidate).filter(Boolean);
  return { provider: `openai:${model}`, candidates };
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://localhost:${port}`);

  if (request.method === "POST" && url.pathname === "/api/recognize") {
    try {
      sendJson(response, 200, await recognizeImage(await readJsonBody(request)));
    } catch (error) {
      sendJson(response, 500, { error: error.message || "真实图片识别失败" });
    }
    return;
  }

  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const safePath = normalize(requested).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath);

  if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": types.get(extname(filePath)) || "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(filePath).pipe(response);
}).listen(port);
