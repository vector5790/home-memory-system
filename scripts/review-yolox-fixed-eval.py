#!/usr/bin/env python3
import argparse
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


DEFAULT_DATASET = Path("/tmp/home-memory-yolox-fixed-eval/COCO")
DEFAULT_DECISIONS = DEFAULT_DATASET / "review" / "fixed-eval-review-decisions.json"


def load_dataset(dataset_dir):
    annotation_path = dataset_dir / "annotations" / "instances_val2017.json"
    data = json.loads(annotation_path.read_text(encoding="utf-8"))
    anns_by_image = {}
    for ann in data.get("annotations", []):
        anns_by_image.setdefault(ann["image_id"], []).append(ann)
    items = []
    for image in data.get("images", []):
        items.append({
            "id": image["id"],
            "fileName": image["file_name"],
            "source": image.get("source", ""),
            "width": image["width"],
            "height": image["height"],
            "annotations": anns_by_image.get(image["id"], []),
        })
    return items


def read_json(path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


HTML = r"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>YOLOX 固定评测集 Review</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f6f7f8; color: #17202a; }
    header { height: 52px; display: flex; align-items: center; gap: 14px; padding: 0 18px; background: #fff; border-bottom: 1px solid #d8dde3; }
    main { display: grid; grid-template-columns: minmax(0, 1fr) 360px; height: calc(100vh - 53px); }
    #stage { display: grid; place-items: center; overflow: auto; padding: 16px; }
    canvas { max-width: 100%; max-height: calc(100vh - 92px); background: #fff; box-shadow: 0 1px 8px rgba(0,0,0,.12); }
    aside { background: #fff; border-left: 1px solid #d8dde3; padding: 16px; overflow: auto; }
    .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    button { border: 1px solid #c6ccd4; background: #fff; border-radius: 7px; padding: 8px 11px; font-size: 14px; cursor: pointer; }
    button:hover { background: #f1f4f7; }
    button.active { border-color: #1769e0; background: #eaf2ff; color: #0c50b8; font-weight: 650; }
    button.primary { background: #1769e0; border-color: #1769e0; color: #fff; }
    h1 { margin: 0; font-size: 16px; }
    h2 { font-size: 15px; margin: 18px 0 8px; }
    .muted { color: #687385; font-size: 13px; }
    .meta { line-height: 1.55; font-size: 14px; }
    textarea { width: 100%; min-height: 90px; resize: vertical; border: 1px solid #c6ccd4; border-radius: 7px; padding: 8px; font: inherit; box-sizing: border-box; }
    .box-list { display: grid; gap: 7px; }
    .box { border: 1px solid #dde2e8; border-radius: 7px; padding: 8px; font-size: 13px; }
    .progress { margin-left: auto; color: #4e5968; font-size: 14px; }
    .kbd { border: 1px solid #b9c0ca; border-bottom-width: 2px; border-radius: 5px; padding: 1px 5px; background: #fff; font-size: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>YOLOX 固定评测集 Review</h1>
    <button id="prev">上一张</button>
    <button id="next">下一张</button>
    <button id="save" class="primary">保存</button>
    <span class="progress" id="progress"></span>
  </header>
  <main>
    <section id="stage"><canvas id="canvas"></canvas></section>
    <aside>
      <div class="meta" id="meta"></div>
      <h2>图片结论</h2>
      <div class="row" id="statuses">
        <button data-status="keep_main">保留主评测</button>
        <button data-status="move_product">移到商品图</button>
        <button data-status="remove">删除</button>
        <button data-status="needs_relabel">需要改框</button>
      </div>
      <h2>备注</h2>
      <textarea id="notes" placeholder="例如：不是家庭大场景；柜体框偏大；漏了抽屉；保留但要补框..."></textarea>
      <h2>真值框</h2>
      <div class="box-list" id="boxes"></div>
      <h2>快捷键</h2>
      <p class="muted"><span class="kbd">←</span>/<span class="kbd">→</span> 切图，<span class="kbd">1</span> 保留，<span class="kbd">2</span> 商品图，<span class="kbd">3</span> 删除，<span class="kbd">4</span> 改框，<span class="kbd">S</span> 保存。</p>
      <p class="muted" id="saved"></p>
    </aside>
  </main>
<script>
let state = { items: [], decisions: {} };
let index = 0;
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const meta = document.querySelector("#meta");
const boxes = document.querySelector("#boxes");
const notes = document.querySelector("#notes");
const saved = document.querySelector("#saved");

async function init() {
  state = await (await fetch("/api/state")).json();
  const undecided = state.items.findIndex((item) => !state.decisions[item.id]?.status);
  index = Math.max(0, undecided);
  render();
}

function current() { return state.items[index]; }

function decisionFor(item) {
  if (!state.decisions[item.id]) state.decisions[item.id] = { imageId: item.id, fileName: item.fileName, status: "", notes: "" };
  return state.decisions[item.id];
}

async function render() {
  const item = current();
  const decision = decisionFor(item);
  document.querySelector("#progress").textContent = `${index + 1} / ${state.items.length}`;
  meta.innerHTML = `<b>#${item.id}</b><br>${item.fileName}<br><span class="muted">${item.source || ""}</span><br>${item.width} x ${item.height}，gt=${item.annotations.length}`;
  notes.value = decision.notes || "";
  document.querySelectorAll("#statuses button").forEach((button) => button.classList.toggle("active", button.dataset.status === decision.status));
  boxes.innerHTML = item.annotations.map((ann, i) => {
    const [x,y,w,h] = ann.bbox;
    return `<div class="box">#${i + 1} ${ann.sourceLabel || "household_subject"}<br><span class="muted">x=${x.toFixed(1)}, y=${y.toFixed(1)}, w=${w.toFixed(1)}, h=${h.toFixed(1)}</span></div>`;
  }).join("");
  await draw(item);
}

async function draw(item) {
  const image = new Image();
  image.src = `/image?id=${item.id}&t=${Date.now()}`;
  await image.decode();
  const maxW = Math.min(window.innerWidth - 410, item.width);
  const maxH = window.innerHeight - 92;
  const scale = Math.min(maxW / item.width, maxH / item.height, 1);
  canvas.width = Math.round(item.width * scale);
  canvas.height = Math.round(item.height * scale);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.font = `${Math.max(12, 18 * scale)}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
  item.annotations.forEach((ann, i) => {
    const [x,y,w,h] = ann.bbox.map((v) => v * scale);
    ctx.strokeStyle = "#20d45a";
    ctx.fillStyle = "rgba(32,212,90,.92)";
    ctx.strokeRect(x, y, w, h);
    const label = `${i + 1} ${ann.sourceLabel || ""}`.trim();
    const textW = ctx.measureText(label).width + 8;
    ctx.fillRect(x, Math.max(0, y - 20), textW, 20);
    ctx.fillStyle = "#06230f";
    ctx.fillText(label, x + 4, Math.max(14, y - 5));
  });
}

async function save() {
  const item = current();
  const decision = decisionFor(item);
  decision.notes = notes.value;
  await fetch("/api/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(decision) });
  saved.textContent = `已保存：#${item.id} ${new Date().toLocaleTimeString()}`;
}

async function move(delta) {
  await save();
  index = Math.max(0, Math.min(state.items.length - 1, index + delta));
  render();
}

document.querySelector("#prev").onclick = () => move(-1);
document.querySelector("#next").onclick = () => move(1);
document.querySelector("#save").onclick = save;
document.querySelector("#statuses").onclick = (event) => {
  const button = event.target.closest("button[data-status]");
  if (!button) return;
  decisionFor(current()).status = button.dataset.status;
  render();
};
notes.oninput = () => { decisionFor(current()).notes = notes.value; };
window.onkeydown = (event) => {
  if (event.target === notes) return;
  if (event.key === "ArrowLeft") move(-1);
  if (event.key === "ArrowRight") move(1);
  if (event.key === "s" || event.key === "S") save();
  const map = { "1": "keep_main", "2": "move_product", "3": "remove", "4": "needs_relabel" };
  if (map[event.key]) { decisionFor(current()).status = map[event.key]; render(); }
};
window.onresize = () => render();
init();
</script>
</body>
</html>
"""


def make_handler(dataset_dir, decisions_path):
    items = load_dataset(dataset_dir)
    images_by_id = {str(item["id"]): dataset_dir / "val2017" / item["fileName"] for item in items}

    class Handler(BaseHTTPRequestHandler):
        def send_json(self, payload, status=200):
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("content-type", "application/json; charset=utf-8")
            self.send_header("content-length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            parsed = urlparse(self.path)
            if parsed.path == "/":
                body = HTML.encode("utf-8")
                self.send_response(200)
                self.send_header("content-type", "text/html; charset=utf-8")
                self.send_header("content-length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            if parsed.path == "/api/state":
                self.send_json({"items": items, "decisions": read_json(decisions_path, {})})
                return
            if parsed.path == "/image":
                image_id = parse_qs(parsed.query).get("id", [""])[0]
                path = images_by_id.get(image_id)
                if not path or not path.exists():
                    self.send_error(404)
                    return
                body = path.read_bytes()
                self.send_response(200)
                self.send_header("content-type", mimetypes.guess_type(path.name)[0] or "image/jpeg")
                self.send_header("content-length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            self.send_error(404)

        def do_POST(self):
            if urlparse(self.path).path != "/api/review":
                self.send_error(404)
                return
            length = int(self.headers.get("content-length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            decisions = read_json(decisions_path, {})
            decisions[str(payload["imageId"])] = payload
            write_json(decisions_path, decisions)
            self.send_json({"ok": True, "path": str(decisions_path)})

        def log_message(self, fmt, *args):
            return

    return Handler


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--decisions", type=Path, default=DEFAULT_DECISIONS)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8791)
    args = parser.parse_args()
    handler = make_handler(args.dataset, args.decisions)
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f"review server: http://{args.host}:{args.port}")
    print(f"decisions: {args.decisions}")
    server.serve_forever()


if __name__ == "__main__":
    main()
