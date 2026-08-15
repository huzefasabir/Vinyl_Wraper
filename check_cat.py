import json
import os

with open('bodaq_cat.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

categories = data.get('categories', {})
print("Categories:", list(categories.keys()))

total_items = 0
missing_images = 0
found_images = 0

for cat_name, cat_val in categories.items():
    subcats = cat_val.get('sub_categories', {})
    cat_items = sum(len(items) for items in subcats.values())
    total_items += cat_items
    print(f"\nCategory [{cat_name}] ({len(subcats)} subcategories, {cat_items} items):")
    for subcat_name, items in subcats.items():
        print(f"  - {subcat_name}: {len(items)} items")
        for it in items:
            diff = it.get('diffuse_map_path')
            if diff:
                # check in storage_data/images
                # In bodaq_cat.json diff is "images/wood/optical-grain/OGW01_diffuse.jpg"
                # so path is storage_data/images/... or storage_data/...
                p1 = os.path.join('storage_data', diff)
                # or if diff starts with "images/", path is storage_data / diff
                p2 = os.path.join('storage_data', 'images', diff.replace('images/', ''))
                if os.path.exists(p1) or os.path.exists(p2):
                    found_images += 1
                else:
                    missing_images += 1
                    if missing_images <= 5:
                        print(f"    Missing image: {diff} (checked {p1}, {p2})")

print(f"\nTotal items: {total_items}")
print(f"Found images: {found_images}, Missing images: {missing_images}")
