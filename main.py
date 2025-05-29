import json
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pix2text import Pix2Text
from openai import AsyncOpenAI
import tempfile
import shutil

app = FastAPI()
client = AsyncOpenAI(api_key="xxxxx")


# Load Pix2Text once
OCR = Pix2Text()

origins = [
    "http://localhost:8000",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def serialize_element(element):
    data = {}
    if hasattr(element, '__dict__'):
        element = element.__dict__
    for k, v in element.items():
        if k == 'total_img':
            continue
        if isinstance(v, np.ndarray):
            data[k] = v.tolist()
        elif isinstance(v, (list, tuple)):
            data[k] = [serialize_element(i) if hasattr(i, '__dict__') or isinstance(i, dict) else i for i in v]
        elif isinstance(v, dict):
            data[k] = serialize_element(v)
        else:
            try:
                json.dumps(v)
                data[k] = v
            except TypeError:
                data[k] = str(v)
    return data

def serialize_page(page):
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


@app.post("/solve/")
async def extract_and_solve(file: UploadFile = File(...)):
    # Save uploaded file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    # OCR
    pages = OCR.recognize_page(tmp_path)
    json_data = [serialize_page(page) for page in pages] if isinstance(pages, list) else [serialize_page(pages)]

    # Extract plain text from OCR output
    extracted_text = []
    for page in json_data:
        for element in page.get("elements", []):
            if "text" in element:
                extracted_text.append(element["text"])
    prompt = "\n".join(extracted_text)

    # Call OpenAI
    try:
        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You're a helpful math tutor."},
                {"role": "user", "content": prompt}
            ]
        )
        answer = response.choices[0].message.content.strip()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    return {
        "question": prompt,
        "answer": answer,
        "raw_ocr": json_data
    }