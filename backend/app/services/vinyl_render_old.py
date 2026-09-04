import cv2
import numpy as np

def extract_pure_vinyl_texture(vinyl_img):
    """
    Automatically detects and crops out white background sections, 
    labels, and color dots from the vinyl swatch image, keeping ONLY 
    the pure vinyl texture area.
    """
    # 1. Convert to grayscale
    gray = cv2.cvtColor(vinyl_img, cv2.COLOR_BGR2GRAY)
    
    # 2. Threshold to separate dark/colored vinyl area from the white card background
    # White background usually has high brightness (> 240)
    _, white_bg_mask = cv2.threshold(gray, 235, 255, cv2.THRESH_BINARY_INV)
    
    # 3. Find contours of the non-white regions
    contours, _ = cv2.findContours(white_bg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # Find the largest continuous region (which corresponds to the vinyl texture block)
        largest_contour = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)
        
        # Add a tiny inner margin (2px) to guarantee no border line leakage
        margin = 2
        x1 = min(max(x + margin, 0), vinyl_img.shape[1] - 1)
        y1 = min(max(y + margin, 0), vinyl_img.shape[0] - 1)
        x2 = max(x + w - margin, x1 + 10)
        y2 = max(y + h - margin, y1 + 10)
        
        return vinyl_img[y1:y2, x1:x2]
    
    # Fallback: Default slice if no white area was detected
    return vinyl_img[:int(vinyl_img.shape[0] * 0.75), :]


def apply_vinyl_wrap(original_img, mask_img, vinyl_img):
    """
    Extracts purely the vinyl pattern from vinyl_img, tiles it, 
    and applies it opaquely over the masked region.
    """
    # Step 1: Extract ONLY the vinyl texture (removes white text/labels automatically)
    clean_vinyl = extract_pure_vinyl_texture(vinyl_img)
    
    # Step 2: Convert Mask to Binary Alpha Channel
    if len(mask_img.shape) == 3:
        mask_gray = cv2.cvtColor(mask_img, cv2.COLOR_BGR2GRAY)
    else:
        mask_gray = mask_img.copy()

    # Threshold: Non-black mask pixels = target surface
    _, binary_mask = cv2.threshold(mask_gray, 10, 255, cv2.THRESH_BINARY)
    
    # Smooth edges to prevent sharp boundary artifacts
    smooth_mask = cv2.GaussianBlur(binary_mask, (3, 3), 0)
    alpha_mask = (smooth_mask / 255.0)[:, :, np.newaxis]  # Shape: (H, W, 1)

    # Step 3: Seamlessly Tile ONLY the Extracted Vinyl Texture
    img_h, img_w = original_img.shape[:2]
    v_h, v_w = clean_vinyl.shape[:2]

    tiles_y = int(np.ceil(img_h / v_h))
    tiles_x = int(np.ceil(img_w / v_w))
    tiled_vinyl = np.tile(clean_vinyl, (tiles_y, tiles_x, 1))[:img_h, :img_w]

    # Step 4: Add lighting/shadow contours without leaking original marks/colors
    lab_orig = cv2.cvtColor(original_img, cv2.COLOR_BGR2LAB)
    L_orig = lab_orig[:, :, 0].astype(np.float32)

    # Calculate mean lightness across target mask area
    L_mean = np.mean(L_orig[binary_mask > 0]) if np.any(binary_mask > 0) else 128.0
    luminance_multiplier = np.clip(L_orig / L_mean, 0.7, 1.3)

    # Multiply lightness onto vinyl pattern
    realistic_vinyl = tiled_vinyl.astype(np.float32) * luminance_multiplier[:, :, np.newaxis]
    realistic_vinyl = np.clip(realistic_vinyl, 0, 255).astype(np.uint8)

    # Step 5: Replace surface area opaquely inside the mask
    final_output = (realistic_vinyl * alpha_mask + original_img * (1.0 - alpha_mask)).astype(np.uint8)

    return final_output


# --- Usage ---
if __name__ == "__main__":
    original = cv2.imread("door_image.jpg")
    mask = cv2.imread("sam_door_mask.png")
    vinyl_swatch = cv2.imread("RM009.jpg")

    result = apply_vinyl_wrap(original, mask, vinyl_swatch)
    cv2.imwrite("clean_vinyl_rendered.jpg", result)