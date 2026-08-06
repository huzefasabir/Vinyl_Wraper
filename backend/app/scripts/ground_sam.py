import cv2
import torch
import numpy as np
from PIL import Image

from groundingdino.util.inference import load_model
from groundingdino.util.inference import load_image
from groundingdino.util.inference import predict

from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor


##########################################
# CONFIGURATION
##########################################

IMAGE_PATH = "images/room.jpg"

TEXT_PROMPT = "wall"

BOX_THRESHOLD = 0.3

TEXT_THRESHOLD = 0.25

GROUNDING_CONFIG = "groundingdino/config/GroundingDINO_SwinT_OGC.py"

GROUNDING_CHECKPOINT = "models/groundingdino_swint_ogc.pth"

SAM2_CONFIG = "sam2_configs/sam2_hiera_l.yaml"

SAM2_CHECKPOINT = "models/sam2_hiera_large.pt"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

##########################################
# LOAD GROUNDING DINO
##########################################

grounding_model = load_model(
    GROUNDING_CONFIG,
    GROUNDING_CHECKPOINT
)

##########################################
# LOAD IMAGE
##########################################

image_source, image = load_image(IMAGE_PATH)

##########################################
# DETECT OBJECT
##########################################

boxes, logits, phrases = predict(
    model=grounding_model,
    image=image,
    caption=TEXT_PROMPT,
    box_threshold=BOX_THRESHOLD,
    text_threshold=TEXT_THRESHOLD,
)

##########################################
# LOAD SAM2
##########################################

sam_model = build_sam2(
    SAM2_CONFIG,
    SAM2_CHECKPOINT,
    device=DEVICE
)

predictor = SAM2ImagePredictor(sam_model)

rgb = cv2.cvtColor(image_source, cv2.COLOR_BGR2RGB)

predictor.set_image(rgb)

##########################################
# RUN SAM2
##########################################

masks, scores, logits = predictor.predict(
    box=boxes[0].cpu().numpy(),
    multimask_output=False,
)

mask = masks[0]

##########################################
# SAVE MASK
##########################################

mask_uint8 = (mask * 255).astype(np.uint8)

cv2.imwrite("wall_mask.png", mask_uint8)

##########################################
# VISUALIZATION
##########################################

overlay = image_source.copy()

overlay[mask] = (0,255,0)

alpha = 0.5

result = cv2.addWeighted(
    image_source,
    1-alpha,
    overlay,
    alpha,
    0
)

cv2.imwrite("wall_segmented.png", result)

print("Done.")