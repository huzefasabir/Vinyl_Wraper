import os
import cv2
import numpy as np
import json
from sklearn.cluster import KMeans

def get_dominant_hex(img_bgr, k=3):
    """
    Extracts the dominant Hex color from an OpenCV BGR image array.
    """
    # 1. Convert BGR (OpenCV format) to RGB
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    
    # 2. Resize image to speed up processing
    img_resized = cv2.resize(img_rgb, (100, 100))
    
    # 3. Reshape the image into a 2D array of pixels
    pixels = img_resized.reshape((-1, 3))
    
    # 4. Use K-Means clustering to find the dominant color
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(pixels)
    
    # 5. Find the cluster with the most pixels
    # pyrefly: ignore [bad-argument-type]
    counts = np.bincount(kmeans.labels_.astype(np.intp))
    dominant_rgb = kmeans.cluster_centers_[np.argmax(counts)]
    
    # 6. Convert the RGB array to a Hex string
    r, g, b = [int(c) for c in dominant_rgb]
    hex_color = f"#{r:02x}{g:02x}{b:02x}".upper()
    
    return hex_color

def generate_maps_for_directory():
    print("=== Vinyl Map Generator & Color Extractor (Multi-Side Cropping) ===")
    
    # 1. Get folder path
    target_dir = input(r"Enter the folder path: ").strip()
    
    if target_dir.startswith('"') and target_dir.endswith('"'):
        target_dir = target_dir[1:-1]
        
    if not os.path.exists(target_dir):
        print(f"Error: The directory '{target_dir}' does not exist.")
        return

    # 2. Get intensity
    try:
        intensity = float(input("Enter bump intensity (e.g., 0.0 for Solid, 2.0 for Concrete, 3.0 for Wood): "))
    except ValueError:
        print("Error: Please enter a valid number for intensity.")
        return

    # 3. Get multi-side crop percentages
    print("\nEnter crop percentages for Top, Bottom, Left, and Right.")
    print("Example: If you want to crop 5% from top, 15% from bottom, and 0% from left/right, type: 5, 15, 0, 0")
    crop_input = input("Crop % (Top, Bottom, Left, Right): ").strip()
    
    try:
        t_pct, b_pct, l_pct, r_pct = [float(x.strip()) for x in crop_input.split(',')]
    except ValueError:
        print("Error: Please enter exactly 4 numbers separated by commas.")
        return

    valid_extensions = ('.jpg', '.jpeg', '.png')
    processed_count = 0
    
    # Dictionary to store the extracted hex codes
    extracted_colors = {}

    # 4. Iterate through all files
    for filename in os.listdir(target_dir):
        filepath = os.path.join(target_dir, filename)
        
        if not os.path.isfile(filepath) or not filename.lower().endswith(valid_extensions):
            continue
            
        # Prevent processing already generated maps
        if "_diffuse" in filename or "_bump" in filename or "_normal" in filename:
            continue
            
        print(f"\nProcessing: {filename}...")
        
        img = cv2.imread(filepath)
        if img is None:
            print(f"  -> Failed to read {filename}. Skipping.")
            continue
            
        base_name, _ = os.path.splitext(filename)
        
        # 5. Execute Multi-Side Cropping
        h, w, _ = img.shape
        
        top_px = int(h * (t_pct / 100.0))
        bottom_px = int(h * (1.0 - (b_pct / 100.0)))
        left_px = int(w * (l_pct / 100.0))
        right_px = int(w * (1.0 - (r_pct / 100.0)))
        
        if top_px >= bottom_px or left_px >= right_px:
            print(f"  -> Error: Crop percentages are too high for {filename}. Skipping.")
            continue
            
        # Apply the crop
        img_cropped = img[top_px:bottom_px, left_px:right_px]
        
        # 6. Extract Dominant Hex Color & Store it
        extracted_hex = get_dominant_hex(img_cropped)
        extracted_colors[base_name] = extracted_hex
        print(f"  -> Extracted Base Color: {extracted_hex}")

        # Output paths
        diffuse_path = os.path.join(target_dir, f"{base_name}_diffuse.jpg")
        bump_path = os.path.join(target_dir, f"{base_name}_bump.jpg")
        normal_path = os.path.join(target_dir, f"{base_name}_normal.jpg")

        # 7. Save Diffuse Map
        cv2.imwrite(diffuse_path, img_cropped)

        # 8. Process Grayscale for Bump & Normal Maps
        gray = cv2.cvtColor(img_cropped, cv2.COLOR_BGR2GRAY)
        gray_smooth = cv2.GaussianBlur(gray, (3, 3), 0)
            
        # 9. Generate Bump Map
        if intensity == 0.0:
            bump_map = np.full_like(gray_smooth, 128)
        else:
            bump_map = cv2.normalize(gray_smooth, np.zeros_like(gray_smooth), alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
            
        cv2.imwrite(bump_path, bump_map)
        
        # 10. Generate Normal Map
        if intensity == 0.0:
            normal_map = np.zeros((bump_map.shape[0], bump_map.shape[1], 3), dtype=np.uint8)
            normal_map[:] = [255, 128, 128]
        else:
            sobel_x = cv2.Sobel(bump_map, cv2.CV_64F, 1, 0, ksize=3)
            sobel_y = cv2.Sobel(bump_map, cv2.CV_64F, 0, 1, ksize=3)
            
            dx = sobel_x * (intensity / 255.0)
            dy = sobel_y * (intensity / 255.0)
            dz = np.ones_like(dx)
            
            length = np.sqrt(dx**2 + dy**2 + dz**2)
            nx = dx / length
            ny = dy / length
            nz = dz / length
            
            normal_map = np.zeros((bump_map.shape[0], bump_map.shape[1], 3), dtype=np.uint8)
            normal_map[:, :, 2] = np.clip((nx * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
            normal_map[:, :, 1] = np.clip((ny * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
            normal_map[:, :, 0] = np.clip((nz * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
        
        cv2.imwrite(normal_path, normal_map)
        print(f"  -> Success: Maps saved.")
        processed_count += 1

    # 11. Save the extracted hex codes to a JSON file
    if extracted_colors:
        json_output_path = os.path.join(target_dir, "extracted_hex_codes.json")
        with open(json_output_path, "w", encoding="utf-8") as f:
            json.dump(extracted_colors, f, indent=4)
        print(f"\nSaved all hex colors to: {json_output_path}")

    print(f"Done! Processed {processed_count} images successfully.")

if __name__ == "__main__":
    generate_maps_for_directory()