import pix2text
import json
import numpy as np

def serialize_element(element):
    # Convert Element or dict-like object to a serializable dict
    data = {}
    # If it's a dict, use as is; if not, use __dict__
    if hasattr(element, '__dict__'):
        element = element.__dict__
    for k, v in element.items():
        if k == 'total_img':
            continue  # Skip non-serializable image objects
        if isinstance(v, np.ndarray):
            data[k] = v.tolist()
        elif isinstance(v, (list, tuple)):
            new_list = []
            for i in v:
                if isinstance(i, dict) or hasattr(i, '__dict__'):
                    new_list.append(serialize_element(i))
                elif isinstance(i, np.ndarray):
                    new_list.append(i.tolist())
                else:
                    new_list.append(i)
            data[k] = new_list
        elif isinstance(v, dict):
            data[k] = serialize_element(v)
        else:
            try:
                json.dumps(v)  # Test if serializable
                data[k] = v
            except TypeError:
                data[k] = str(v)  # Fallback: convert to string
    return data

def serialize_page(page):
    # Convert Page or dict-like object to a serializable dict
    if hasattr(page, '__dict__'):
        page = page.__dict__
    data = {}
    for k, v in page.items():
        if k == 'elements':
            data[k] = [serialize_element(e) for e in v]
        else:
            try:
                json.dumps(v)
                data[k] = v
            except TypeError:
                data[k] = str(v)
    return data

OCR = pix2text.Pix2Text()
pages = OCR.recognize_page("matheg2.png")

# If output is a list of Page objects
if isinstance(pages, list):
    json_data = [serialize_page(page) for page in pages]
else:
    json_data = serialize_page(pages)

with open("output.json", "w") as f:
    json.dump(json_data, f, indent=2)

print("Saved OCR output to output.json")
