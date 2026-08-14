import os
import sys
from pathlib import Path

# Ensure Grounded-SAM-2 repository root and grounding_dino folder are in sys.path BEFORE any module imports
REPO_ROOT = Path(__file__).resolve().parent
GDINO_DIR = REPO_ROOT / "grounding_dino"

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
if str(GDINO_DIR) not in sys.path:
    sys.path.insert(0, str(GDINO_DIR))

import cv2
import json
import argparse
import torch
import numpy as np
import supervision as sv
import pycocotools.mask as mask_util
from typing import cast, Any
from torchvision.ops import box_convert

# Import SAM2
try:
    from sam2.build_sam import build_sam2
    from sam2.sam2_image_predictor import SAM2ImagePredictor
except ImportError:
    from .sam2.build_sam import build_sam2
    from .sam2.sam2_image_predictor import SAM2ImagePredictor

# Import Grounding DINO
try:
    from groundingdino.util.inference import load_model, load_image, predict
except ImportError:
    try:
        from grounding_dino.groundingdino.util.inference import load_model, load_image, predict
    except ImportError as e:
        raise ImportError(
            f"Failed to import Grounding DINO inference utilities: {e}. "
            f"Ensure grounding_dino is installed or located at {GDINO_DIR}"
        )

def resolve_path(path_str):
    """Resolves path relative to CWD first, then relative to REPO_ROOT."""
    p = Path(path_str)
    if p.is_absolute() and p.exists():
        return p
    if (Path.cwd() / p).exists():
        return Path.cwd() / p
    if (REPO_ROOT / p).exists():
        return REPO_ROOT / p
    return p

def parse_args():
    parser = argparse.ArgumentParser(description="Grounded SAM 2 Image Inference")
    parser.add_argument("--image_path", type=str, default="test_images/door.jpg", help="Path to input image")
    parser.add_argument("--text_prompt", type=str, default="door. handle.", help="Text prompt for Grounding DINO (end with dot)")
    parser.add_argument("--output_dir", type=str, default="outputs", help="Output directory")
    parser.add_argument("--sam2_checkpoint", type=str, default=None, help="Path to SAM2 checkpoint")
    parser.add_argument("--sam2_config", type=str, default=None, help="Path to SAM2 config file")
    parser.add_argument("--gdino_config", type=str, default="grounding_dino/groundingdino/config/GroundingDINO_SwinT_OGC.py", help="Path to Grounding DINO config")
    parser.add_argument("--gdino_checkpoint", type=str, default="gdino_checkpoints/groundingdino_swint_ogc.pth", help="Path to Grounding DINO checkpoint")
    parser.add_argument("--box_threshold", type=float, default=0.35, help="Box threshold for Grounding DINO")
    parser.add_argument("--text_threshold", type=float, default=0.25, help="Text threshold for Grounding DINO")
    parser.add_argument("--device", type=str, default=None, help="Device (cuda or cpu)")
    return parser.parse_args()

def get_sam2_defaults():
    ckpts = [
        (REPO_ROOT / "checkpoints" / "sam2.1_hiera_tiny.pt", "configs/sam2.1/sam2.1_hiera_t.yaml")
    ]
    for ckpt_path, config_path in ckpts:
        if ckpt_path.exists():
            return str(ckpt_path), config_path
    return str(REPO_ROOT / "checkpoints" / "sam2.1_hiera_tiny.pt"), "configs/sam2.1/sam2.1_hiera_t.yaml"

def single_mask_to_rle(mask):
    rle = cast(Any, mask_util.encode(np.array(mask[:, :, None], order="F", dtype=np.uint8)))[0]
    rle["counts"] = rle["counts"].decode("utf-8")
    return rle

def main():
    args = parse_args()

    # Determine device
    if args.device:
        device = args.device
    else:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[INFO] Using device: {device}")

    # Determine SAM2 checkpoint & config
    if args.sam2_checkpoint and args.sam2_config:
        sam2_checkpoint = str(resolve_path(args.sam2_checkpoint))
        sam2_config = args.sam2_config
    else:
        sam2_checkpoint, sam2_config = get_sam2_defaults()

    gdino_config_path = str(resolve_path(args.gdino_config))
    gdino_checkpoint_path = str(resolve_path(args.gdino_checkpoint))
    image_path = str(resolve_path(args.image_path))

    print(f"[INFO] SAM2 Checkpoint: {sam2_checkpoint}")
    print(f"[INFO] SAM2 Config: {sam2_config}")
    print(f"[INFO] Grounding DINO Config: {gdino_config_path}")
    print(f"[INFO] Grounding DINO Checkpoint: {gdino_checkpoint_path}")

    if not os.path.exists(image_path):
        print(f"[ERROR] Image not found at {args.image_path} (resolved: {image_path})")
        sys.exit(1)

    if not os.path.exists(sam2_checkpoint):
        print(f"[ERROR] SAM2 checkpoint not found at {sam2_checkpoint}")
        print("[HINT] Run checkpoints/download_ckpts.sh to download checkpoints.")
        sys.exit(1)

    if not os.path.exists(gdino_checkpoint_path):
        print(f"[ERROR] Grounding DINO checkpoint not found at {gdino_checkpoint_path}")
        print("[HINT] Run gdino_checkpoints/download_ckpts.sh to download checkpoints.")
        sys.exit(1)

    # Output directory
    output_dir = resolve_path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Prepare text prompt (ensure lowercased & trailing dot)
    text_prompt = args.text_prompt.strip().lower()
    if not text_prompt.endswith("."):
        text_prompt += "."

    print(f"[INFO] Processing image: {image_path}")
    print(f"[INFO] Text prompt: {text_prompt}")

    # 1. Build SAM2 Predictor
    sam2_model = build_sam2(sam2_config, sam2_checkpoint, device=device)
    sam2_predictor = SAM2ImagePredictor(sam2_model)

    # 2. Build Grounding DINO Model
    grounding_model = load_model(
        model_config_path=gdino_config_path,
        model_checkpoint_path=gdino_checkpoint_path,
        device=device
    )

    # Load image for Grounding DINO
    image_source, image = load_image(image_path)
    sam2_predictor.set_image(image_source)

    # Predict bounding boxes with Grounding DINO
    boxes, confidences, labels = predict(
        model=grounding_model,
        image=image,
        caption=text_prompt,
        box_threshold=args.box_threshold,
        text_threshold=args.text_threshold,
        device=device
    )

    h, w, _ = image_source.shape
    if len(boxes) == 0:
        print("[WARNING] No objects detected matching prompt.")
        input_boxes = np.empty((0, 4))
        masks = np.empty((0, h, w))
        scores = np.empty((0,))
    else:
        # Convert box format for SAM 2 (cxcywh -> xyxy)
        boxes_scaled = boxes * torch.Tensor([w, h, w, h])
        input_boxes = box_convert(boxes=boxes_scaled, in_fmt="cxcywh", out_fmt="xyxy").numpy()

        if device == "cuda":
            with torch.autocast(device_type="cuda", dtype=torch.bfloat16):
                if torch.cuda.get_device_properties(0).major >= 8:
                    torch.backends.cuda.matmul.allow_tf32 = True
                    torch.backends.cudnn.allow_tf32 = True

                masks, scores, logits = sam2_predictor.predict(
                    point_coords=None,
                    point_labels=None,
                    box=input_boxes,
                    multimask_output=False,
                )
        else:
            masks, scores, logits = sam2_predictor.predict(
                point_coords=None,
                point_labels=None,
                box=input_boxes,
                multimask_output=False,
            )

        if masks.ndim == 4:
            masks = masks.squeeze(1)

        scores = np.array(scores).flatten()

    # Visualization using supervision
    img = cv2.imread(image_path)
    confidences_list = confidences.numpy().tolist() if isinstance(confidences, torch.Tensor) else []
    class_names = labels if isinstance(labels, list) else []
    class_ids = np.array(list(range(len(class_names)))) if class_names else np.array([])

    annotated_labels = [
        f"{c_name} {conf:.2f}" for c_name, conf in zip(class_names, confidences_list)
    ]

    detections = sv.Detections(
        xyxy=input_boxes,
        mask=masks.astype(bool) if len(masks) > 0 else None,
        class_id=class_ids if len(class_ids) > 0 else None
    )

    box_annotator = sv.BoxAnnotator()
    annotated_frame = box_annotator.annotate(scene=img.copy(), detections=detections)

    label_annotator = sv.LabelAnnotator()
    annotated_frame = label_annotator.annotate(scene=annotated_frame, detections=detections, labels=annotated_labels)

    mask_annotator = sv.MaskAnnotator()
    annotated_frame_with_mask = mask_annotator.annotate(scene=annotated_frame, detections=detections)

    out_image_path = output_dir / "grounded_sam2_annotated.jpg"
    cv2.imwrite(str(out_image_path), annotated_frame_with_mask)
    print(f"[SUCCESS] Annotated image saved to: {out_image_path}")

    # Export JSON results
    if len(masks) > 0:
        mask_rles = [single_mask_to_rle(m) for m in masks]
        results = {
            "image_path": image_path,
            "prompt": text_prompt,
            "annotations": [
                {
                    "class_name": c_name,
                    "bbox": b.tolist() if isinstance(b, np.ndarray) else b,
                    "segmentation": rle,
                    "score": float(s),
                }
                for c_name, b, rle, s in zip(class_names, input_boxes, mask_rles, scores)
            ],
            "box_format": "xyxy",
            "img_width": w,
            "img_height": h,
        }
    else:
        results = {
            "image_path": image_path,
            "prompt": text_prompt,
            "annotations": [],
            "img_width": w,
            "img_height": h
        }

    out_json_path = output_dir / "grounded_sam2_results.json"
    with open(out_json_path, "w") as f:
        json.dump(results, f, indent=4)
    print(f"[SUCCESS] JSON results saved to: {out_json_path}")

if __name__ == "__main__":
    main()
