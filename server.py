#!/usr/bin/env python3
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
BODY_LIMIT = 12 * 1024 * 1024
MODEL = os.environ.get("OPENAI_VISION_MODEL", "gpt-4.1-mini")

CATEGORIES = {"food", "medicine", "pet", "document", "tool", "daily", "appliance"}


def clamp(value, minimum, maximum):
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = minimum
    return min(max(number, minimum), maximum)


def normalize_box(box):
    box = box if isinstance(box, dict) else {}
    width = clamp(box.get("w", 18), 4, 100)
    height = clamp(box.get("h", 12), 4, 100)
    return {
        "x": clamp(box.get("x", 0), 0, 100 - width),
        "y": clamp(box.get("y", 0), 0, 100 - height),
        "w": width,
        "h": height,
    }


def normalize_candidate(candidate):
    if not isinstance(candidate, dict):
        return None
    name = str(candidate.get("name", "")).strip()
    if not name:
        return None
    category = candidate.get("category")
    if category not in CATEGORIES:
        category = "daily"
    try:
        qty = max(1, int(round(float(candidate.get("qty", 1)))))
    except (TypeError, ValueError):
        qty = 1
    return {
        "name": name,
        "category": category,
        "qty": qty,
        "expireAt": str(candidate.get("expireAt") or ""),
        "nextAt": str(candidate.get("nextAt") or ""),
        "nextLabel": str(candidate.get("nextLabel") or ""),
        "container": str(candidate.get("container") or ""),
        "box": normalize_box(candidate.get("box")),
        "confidence": clamp(candidate.get("confidence", 0.7), 0, 1),
    }


def output_text(response_json):
    if isinstance(response_json.get("output_text"), str):
        return response_json["output_text"]
    parts = []
    for output in response_json.get("output", []):
        for content in output.get("content", []):
            text = content.get("text")
            if isinstance(text, str):
                parts.append(text)
    return "\n".join(parts)


def recognize(payload):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("未配置 OPENAI_API_KEY，上传照片不会使用本地模拟候选。")

    image = payload.get("image")
    if not isinstance(image, str) or not image.startswith("data:image/"):
        raise ValueError("请先上传一张图片。")

    room = payload.get("room") or "未知房间"
    place = payload.get("place") or "未知储物点"
    place_note = payload.get("placeNote") or ""
    existing_items = payload.get("existingItems") or []

    schema = {
        "type": "object",
        "additionalProperties": False,
        "required": ["candidates"],
        "properties": {
            "candidates": {
                "type": "array",
                "maxItems": 12,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "name",
                        "category",
                        "qty",
                        "expireAt",
                        "nextAt",
                        "nextLabel",
                        "container",
                        "box",
                        "confidence",
                    ],
                    "properties": {
                        "name": {"type": "string"},
                        "category": {
                            "type": "string",
                            "enum": ["food", "medicine", "pet", "document", "tool", "daily", "appliance"],
                        },
                        "qty": {"type": "integer", "minimum": 1},
                        "expireAt": {"type": "string"},
                        "nextAt": {"type": "string"},
                        "nextLabel": {"type": "string"},
                        "container": {"type": "string"},
                        "box": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["x", "y", "w", "h"],
                            "properties": {
                                "x": {"type": "number", "minimum": 0, "maximum": 100},
                                "y": {"type": "number", "minimum": 0, "maximum": 100},
                                "w": {"type": "number", "minimum": 1, "maximum": 100},
                                "h": {"type": "number", "minimum": 1, "maximum": 100},
                            },
                        },
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                },
            }
        },
    }

    prompt = (
        "你是家庭物品照片识别助手。只根据用户上传的这一张真实图片生成候选物品，"
        "不要使用任何演示数据、历史候选或先验模板。识别可收纳、可查找、值得入库的真实可见物品；"
        "不要把电视、墙面、窗帘、人体、房间结构当作候选物品，除非它们是用户明显要管理的独立物品。"
        "bounding box 使用相对于整张图片的百分比坐标：x/y/w/h 均为 0-100。"
        "如果日期、数量、容器无法从图片判断，使用空字符串或合理保守数量 1。"
        f"当前房间：{room}。当前储物点：{place}。储物点备注：{place_note}。"
        f"已有同位置物品参考（只用于避免重复命名，不可照抄）：{json.dumps(existing_items, ensure_ascii=False)}。"
    )

    request_body = {
        "model": MODEL,
        "input": [
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {"type": "input_image", "image_url": image, "detail": "high"},
                ],
            }
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "home_inventory_candidates",
                "strict": True,
                "schema": schema,
            }
        },
    }

    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(request_body).encode("utf-8"),
        headers={
            "authorization": f"Bearer {api_key}",
            "content-type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            api_response = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI 识别请求失败：{detail[:500]}") from error

    text = output_text(api_response)
    if not text:
        raise RuntimeError("OpenAI 没有返回可解析的候选物品。")

    parsed = json.loads(text)
    candidates = [
        normalized
        for normalized in (normalize_candidate(candidate) for candidate in parsed.get("candidates", []))
        if normalized
    ]
    return {"provider": f"openai:{MODEL}", "candidates": candidates}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("cache-control", "no-store")
        super().end_headers()

    def guess_type(self, path):
        guessed = mimetypes.guess_type(path)[0]
        if path.endswith(".js") or path.endswith(".mjs"):
            return "text/javascript; charset=utf-8"
        if path.endswith(".css"):
            return "text/css; charset=utf-8"
        if path.endswith(".html"):
            return "text/html; charset=utf-8"
        if path.endswith(".wasm"):
            return "application/wasm"
        return guessed or "application/octet-stream"

    def do_POST(self):
        if self.path != "/api/recognize":
            self.send_error(404, "Not found")
            return

        try:
            length = int(self.headers.get("content-length", "0"))
            if length > BODY_LIMIT:
                raise ValueError("图片太大，请压缩后再试。")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            result = recognize(payload)
            self.send_json(200, result)
        except Exception as error:
            self.send_json(500, {"error": str(error)})

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    print(f"Home Memory serving at http://localhost:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
