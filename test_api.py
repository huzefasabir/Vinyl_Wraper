import urllib.request
import json

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/api/health') as r:
        print('Health:', r.read().decode())
    with urllib.request.urlopen('http://127.0.0.1:8000/api/categories') as r:
        data = json.loads(r.read().decode())
        print('Categories count:', len(data['categories']))
        for c in data['categories']:
            print(f" - {c['name']}: {c['count']} items, {len(c['subCategories'])} subcategories")
    with urllib.request.urlopen('http://127.0.0.1:8000/api/images/wood/optical-grain/OGW01.jpg') as r:
        img_bytes = r.read()
        print('Image OGW01.jpg status:', r.status, 'size:', len(img_bytes), 'bytes')
except Exception as e:
    print('Error:', e)
