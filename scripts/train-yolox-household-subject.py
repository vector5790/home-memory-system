#!/usr/bin/env python3
import argparse
import hashlib
import json
import random
import sys
import time
from pathlib import Path

import cv2
import numpy as np
import torch
from torch.utils.data import DataLoader


DEFAULT_DATA_DIR = Path("/tmp/home-memory-yolox-household-dataset/COCO")
DEFAULT_YOLOX_ROOT = Path("/tmp/YOLOX-home-memory")
DEFAULT_OUT_DIR = Path("/tmp/home-memory-yolox-runs/household-subject-v1")
DEFAULT_FIXED_EVAL_DIR = Path("/tmp/home-memory-yolox-fixed-eval-gold-v1/COCO")


def patch_cuda_for_apple_cpu():
    torch.Tensor.cuda = lambda self, *args, **kwargs: self
    torch.nn.Module.cuda = lambda self, *args, **kwargs: self
    torch.cuda.empty_cache = lambda: None


def import_yolox(yolox_root):
    sys.path.insert(0, str(yolox_root))
    from yolox.data import COCODataset, TrainTransform, ValTransform
    from yolox.exp import get_exp
    from yolox.utils import postprocess
    return COCODataset, TrainTransform, ValTransform, get_exp, postprocess


def collate(batch):
    images, targets, infos, ids = zip(*batch)
    return (
        torch.from_numpy(np.stack(images)).float(),
        torch.from_numpy(np.stack(targets)).float(),
        infos,
        ids,
    )


def load_coco_annotations(data_dir, split):
    path = data_dir / "annotations" / f"instances_{split}2017.json"
    return json.loads(path.read_text(encoding="utf-8"))


def image_sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def collect_split_hashes(data_dir, split):
    annotations = load_coco_annotations(data_dir, split)
    hashes = {}
    image_dir = data_dir / f"{split}2017"
    for image in annotations.get("images", []):
        path = image_dir / image["file_name"]
        if path.exists():
            hashes[image_sha256(path)] = str(path)
    return hashes


def assert_no_fixed_eval_leak(train_data_dir, fixed_eval_dir):
    if not fixed_eval_dir:
        return
    if not fixed_eval_dir.exists():
        raise RuntimeError(f"fixed evaluation dataset is missing: {fixed_eval_dir}; run scripts/build-yolox-fixed-eval.py first")
    train_hashes = collect_split_hashes(train_data_dir, "train")
    fixed_hashes = collect_split_hashes(fixed_eval_dir, "val")
    overlaps = sorted(set(train_hashes) & set(fixed_hashes))
    if overlaps:
        details = [
            {
                "sha256": digest,
                "trainImage": train_hashes[digest],
                "fixedEvalImage": fixed_hashes[digest],
            }
            for digest in overlaps[:12]
        ]
        raise RuntimeError(
            "fixed evaluation leakage detected; remove these images from train2017 before training: "
            + json.dumps(details, ensure_ascii=False)
        )


def make_model(get_exp, yolox_root, input_size):
    exp = get_exp(str(yolox_root / "exps/default/yolox_nano.py"), None)
    exp.num_classes = 1
    exp.input_size = (input_size, input_size)
    exp.test_size = (input_size, input_size)
    exp.mosaic_prob = 0.0
    exp.mixup_prob = 0.0
    model = exp.get_model()
    model.train()
    return model


def load_matching_checkpoint(model, checkpoint_path):
    if not checkpoint_path:
        return {"loaded": 0, "skipped": 0}
    payload = torch.load(checkpoint_path, map_location="cpu")
    state = payload.get("model", payload)
    current = model.state_dict()
    matched = {}
    skipped = []
    for key, value in state.items():
        if key in current and tuple(current[key].shape) == tuple(value.shape):
            matched[key] = value
        else:
            skipped.append(key)
    current.update(matched)
    model.load_state_dict(current)
    return {"loaded": len(matched), "skipped": len(skipped)}


def make_loader(COCODataset, TrainTransform, data_dir, split, input_size, batch_size, shuffle):
    dataset = COCODataset(
        data_dir=str(data_dir),
        json_file=f"instances_{split}2017.json",
        name=f"{split}2017",
        img_size=(input_size, input_size),
        preproc=TrainTransform(max_labels=120, flip_prob=0.5, hsv_prob=0.5),
        cache=False,
    )
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=shuffle, num_workers=0, collate_fn=collate)
    return loader, dataset


def train(args):
    patch_cuda_for_apple_cpu()
    COCODataset, TrainTransform, ValTransform, get_exp, postprocess = import_yolox(args.yolox_root)
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    args.out_dir.mkdir(parents=True, exist_ok=True)
    assert_no_fixed_eval_leak(args.data_dir, args.fixed_eval_dir)

    train_loader, train_dataset = make_loader(
        COCODataset,
        TrainTransform,
        args.data_dir,
        "train",
        args.input_size,
        args.batch_size,
        True,
    )
    model = make_model(get_exp, args.yolox_root, args.input_size)
    pretrained = load_matching_checkpoint(model, args.pretrained)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=5e-4)
    logs = []
    step = 0
    started = time.time()
    while step < args.steps:
        for images, targets, _, _ in train_loader:
            step += 1
            step_started = time.time()
            optimizer.zero_grad(set_to_none=True)
            outputs = model(images, targets)
            loss = outputs["total_loss"]
            loss.backward()
            optimizer.step()
            log = {
                "step": step,
                "loss": round(float(loss.detach()), 5),
                "iou_loss": round(float(outputs["iou_loss"].detach()), 5),
                "conf_loss": round(float(outputs["conf_loss"].detach()), 5),
                "cls_loss": round(float(outputs["cls_loss"].detach()), 5),
                "num_fg": round(float(outputs["num_fg"]), 3),
                "stepSeconds": round(time.time() - step_started, 3),
            }
            logs.append(log)
            if step == 1 or step % args.log_every == 0 or step == args.steps:
                print(json.dumps(log))
            if step >= args.steps:
                break

    ckpt = args.out_dir / "yolox_nano_household_subject_v1.pt"
    torch.save({"model": model.state_dict(), "logs": logs}, ckpt)
    summary = {
        "trainImages": len(train_dataset),
        "steps": args.steps,
        "seconds": round(time.time() - started, 3),
        "firstLoss": logs[0]["loss"] if logs else None,
        "lastLoss": logs[-1]["loss"] if logs else None,
        "checkpoint": str(ckpt),
        "pretrained": str(args.pretrained) if args.pretrained else "",
        "pretrainedLoad": pretrained,
    }
    (args.out_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    quick_val(model, COCODataset, ValTransform, postprocess, args, args.data_dir, "quick_val", "val-preview")
    fixed_eval_summary = None
    if args.fixed_eval_dir:
        fixed_eval_summary = quick_val(model, COCODataset, ValTransform, postprocess, args, args.fixed_eval_dir, "fixed_eval", "fixed-eval-preview")
        summary["fixedEval"] = fixed_eval_summary
        (args.out_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


def eval_only(args):
    patch_cuda_for_apple_cpu()
    COCODataset, TrainTransform, ValTransform, get_exp, postprocess = import_yolox(args.yolox_root)
    model = make_model(get_exp, args.yolox_root, args.input_size)
    checkpoint = torch.load(args.checkpoint, map_location="cpu")
    model.load_state_dict(checkpoint["model"])
    args.out_dir.mkdir(parents=True, exist_ok=True)
    quick_val(model, COCODataset, ValTransform, postprocess, args, args.data_dir, "quick_val", "val-preview")
    fixed_eval_summary = None
    if args.fixed_eval_dir:
        fixed_eval_summary = quick_val(model, COCODataset, ValTransform, postprocess, args, args.fixed_eval_dir, "fixed_eval", "fixed-eval-preview")
    return {
        "checkpoint": str(args.checkpoint),
        "quickVal": str(args.out_dir / "quick_val.json"),
        "fixedEval": fixed_eval_summary,
    }


@torch.no_grad()
def quick_val(model, COCODataset, ValTransform, postprocess, args, eval_data_dir, output_stem, preview_dir_name):
    val_data = load_coco_annotations(eval_data_dir, "val")
    anns_by_image = {}
    for ann in val_data.get("annotations", []):
        anns_by_image.setdefault(ann["image_id"], []).append(ann)
    dataset = COCODataset(
        data_dir=str(eval_data_dir),
        json_file="instances_val2017.json",
        name="val2017",
        img_size=(args.input_size, args.input_size),
        preproc=ValTransform(),
        cache=False,
    )
    model.eval()
    rows = []
    vis_dir = args.out_dir / preview_dir_name
    vis_dir.mkdir(parents=True, exist_ok=True)
    image_meta = {item["id"]: item for item in val_data.get("images", [])}
    totals = {"gt": 0, "pred": 0, "matched30": 0, "matched50": 0, "inferenceSeconds": 0.0}
    for index in range(min(len(dataset), args.max_val_images)):
        image, target, info, img_id = dataset[index]
        image_id = int(img_id[0]) if hasattr(img_id, "__len__") else int(img_id)
        tensor = torch.from_numpy(image).unsqueeze(0).float()
        started = time.time()
        raw = model(tensor)
        preds = postprocess(raw, 1, conf_thre=args.conf, nms_thre=0.45)[0]
        annotations = anns_by_image.get(image_id, [])
        metrics = match_detection_metrics(annotations, preds, info, args.input_size)
        totals["gt"] += metrics["gtCount"]
        totals["pred"] += metrics["predCount"]
        totals["matched30"] += metrics["matched30"]
        totals["matched50"] += metrics["matched50"]
        totals["inferenceSeconds"] += time.time() - started
        rows.append({
            "imageId": image_id,
            "fileName": image_meta[image_id]["file_name"],
            "gtCount": metrics["gtCount"],
            "predCount": 0 if preds is None else int(preds.shape[0]),
            "inferenceSeconds": round(time.time() - started, 4),
            "topScores": [] if preds is None else [round(float(v), 4) for v in preds[:8, 4].tolist()],
            "recall30": metrics["recall30"],
            "precision30": metrics["precision30"],
            "recall50": metrics["recall50"],
            "precision50": metrics["precision50"],
        })
        if index < args.preview_count:
            draw_preview(eval_data_dir, image_meta[image_id], annotations, preds, vis_dir, args.input_size)
    count = max(1, len(rows))
    summary = {
        "dataDir": str(eval_data_dir),
        "images": len(rows),
        "gtCount": totals["gt"],
        "predCount": totals["pred"],
        "recall30": round(totals["matched30"] / totals["gt"], 4) if totals["gt"] else 0,
        "precision30": round(totals["matched30"] / totals["pred"], 4) if totals["pred"] else 0,
        "recall50": round(totals["matched50"] / totals["gt"], 4) if totals["gt"] else 0,
        "precision50": round(totals["matched50"] / totals["pred"], 4) if totals["pred"] else 0,
        "avgInferenceSeconds": round(totals["inferenceSeconds"] / count, 4),
        "rows": rows,
    }
    (args.out_dir / f"{output_stem}.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return {key: value for key, value in summary.items() if key != "rows"}


def box_iou(left, right):
    x1 = max(left[0], right[0])
    y1 = max(left[1], right[1])
    x2 = min(left[2], right[2])
    y2 = min(left[3], right[3])
    intersection = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    left_area = max(0.0, left[2] - left[0]) * max(0.0, left[3] - left[1])
    right_area = max(0.0, right[2] - right[0]) * max(0.0, right[3] - right[1])
    union = left_area + right_area - intersection
    return intersection / union if union > 0 else 0.0


def match_count(gt_boxes, pred_boxes, threshold):
    pairs = []
    for gt_index, gt_box in enumerate(gt_boxes):
        for pred_index, pred_box in enumerate(pred_boxes):
            iou = box_iou(gt_box, pred_box)
            if iou >= threshold:
                pairs.append((iou, gt_index, pred_index))
    pairs.sort(reverse=True)
    used_gt = set()
    used_pred = set()
    matched = 0
    for _, gt_index, pred_index in pairs:
        if gt_index in used_gt or pred_index in used_pred:
            continue
        used_gt.add(gt_index)
        used_pred.add(pred_index)
        matched += 1
    return matched


def match_detection_metrics(annotations, preds, info, input_size):
    height, width = int(info[0]), int(info[1])
    scale = min(input_size / width, input_size / height)
    gt_boxes = []
    for ann in annotations:
        x, y, w, h = ann["bbox"]
        gt_boxes.append([float(x), float(y), float(x + w), float(y + h)])
    pred_boxes = []
    if preds is not None:
        for pred in preds.cpu().numpy():
            x1, y1, x2, y2 = pred[:4] / scale
            if np.isfinite([x1, y1, x2, y2]).all() and x2 > x1 and y2 > y1:
                pred_boxes.append([float(x1), float(y1), float(x2), float(y2)])
    matched30 = match_count(gt_boxes, pred_boxes, 0.3)
    matched50 = match_count(gt_boxes, pred_boxes, 0.5)
    gt_count = len(gt_boxes)
    pred_count = len(pred_boxes)
    return {
        "gtCount": gt_count,
        "predCount": pred_count,
        "matched30": matched30,
        "matched50": matched50,
        "recall30": round(matched30 / gt_count, 4) if gt_count else 0,
        "precision30": round(matched30 / pred_count, 4) if pred_count else 0,
        "recall50": round(matched50 / gt_count, 4) if gt_count else 0,
        "precision50": round(matched50 / pred_count, 4) if pred_count else 0,
    }


def draw_preview(data_dir, meta, annotations, preds, vis_dir, input_size):
    path = data_dir / "val2017" / meta["file_name"]
    image = cv2.imread(str(path))
    if image is None:
        return
    height, width = image.shape[:2]
    for ann in annotations:
        x, y, w, h = ann["bbox"]
        cv2.rectangle(image, (int(x), int(y)), (int(x + w), int(y + h)), (80, 220, 80), 2)
    if preds is not None:
        scale = min(input_size / width, input_size / height)
        for pred in preds[:20].cpu().numpy():
            x1, y1, x2, y2 = pred[:4] / scale
            if not np.isfinite([x1, y1, x2, y2]).all():
                continue
            score = float(pred[4])
            x1 = max(0, min(width - 1, int(x1)))
            y1 = max(0, min(height - 1, int(y1)))
            x2 = max(0, min(width - 1, int(x2)))
            y2 = max(0, min(height - 1, int(y2)))
            if x2 <= x1 or y2 <= y1:
                continue
            cv2.rectangle(image, (x1, y1), (x2, y2), (60, 80, 240), 2)
            cv2.putText(image, f"{score:.2f}", (x1, max(12, y1 - 3)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (60, 80, 240), 1)
    cv2.imwrite(str(vis_dir / f"{meta['id']:08d}.jpg"), image)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--yolox-root", type=Path, default=DEFAULT_YOLOX_ROOT)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--steps", type=int, default=500)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--input-size", type=int, default=320)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--log-every", type=int, default=50)
    parser.add_argument("--conf", type=float, default=0.05)
    parser.add_argument("--max-val-images", type=int, default=80)
    parser.add_argument("--preview-count", type=int, default=12)
    parser.add_argument("--checkpoint", type=Path, default=None)
    parser.add_argument("--pretrained", type=Path, default=None)
    parser.add_argument("--fixed-eval-dir", type=Path, default=DEFAULT_FIXED_EVAL_DIR)
    parser.add_argument("--eval-only", action="store_true")
    args = parser.parse_args()
    if args.eval_only:
        print(json.dumps(eval_only(args), ensure_ascii=False))
    else:
        print(json.dumps(train(args), ensure_ascii=False))


if __name__ == "__main__":
    main()
