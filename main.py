import json
import numpy as np
import logging
import sys
import base64
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
import tempfile
import shutil
from google.cloud import vision
import uvicorn
import os
import difflib
from collections import defaultdict

# Configure logging properly
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ],
    force=True
)

# Create logger for this module
logger = logging.getLogger(__name__)

# Test logging immediately
logger.info("Starting FastAPI application...")

app = FastAPI()
client = AsyncOpenAI(api_key="xxxx")
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/isaactan/Downloads/cloudvisionkey.json"
gclient = vision.ImageAnnotatorClient()

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

def load_prompt():
    try:
        with open("prompt.txt", "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        logger.error("prompt.txt file not found")
        return "You're a helpful math tutor. Please solve the math problem shown in the image."

def detect_text_google_vision(image_path):
    """Extract text and word boundaries using Google Vision OCR"""
    logger.info("Starting Google Vision OCR...")
    
    with open(image_path, "rb") as image_file:
        content = image_file.read()

    image = vision.Image(content=content)
    response = gclient.text_detection(image=image)
    
    if response.error.message:
        raise Exception(
            f"Google Vision API error: {response.error.message}\n"
            "For more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors"
        )
    
    texts = response.text_annotations
    
    if not texts:
        logger.warning("No text detected by Google Vision")
        return "", []
    
    # First annotation contains all text
    full_text = texts[0].description
    logger.info(f"Google Vision extracted text: {full_text[:100]}...")
    
    # Get individual words with their boundaries (skip first annotation which is full text)
    words_with_bounds = []
    for text in texts[1:]:  # Skip first element (full text)
        word = text.description
        vertices = text.bounding_poly.vertices
        bounds = [(vertex.x, vertex.y) for vertex in vertices]
        words_with_bounds.append((word, bounds))
    
    return full_text, words_with_bounds

def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def fuzzy_match(gpt_lines, ocr_lines, threshold=0.7):
    """
    Fuzzy match GPT lines against OCR lines with better matching logic
    """
    matches = []
    for gpt_line in gpt_lines:
        if not gpt_line.strip():  # Skip empty lines
            continue
            
        # Try exact matching first
        exact_matches = [ocr_line for ocr_line in ocr_lines if gpt_line.strip() in ocr_line]
        if exact_matches:
            matches.append((gpt_line, exact_matches[0]))
            continue
            
        # Try fuzzy matching
        best_match = difflib.get_close_matches(gpt_line, ocr_lines, n=1, cutoff=threshold)
        if best_match:
            matches.append((gpt_line, best_match[0]))
        else:
            # Try matching individual components (for math expressions)
            best_score = 0
            best_ocr_line = None
            for ocr_line in ocr_lines:
                # Calculate similarity for math expressions
                similarity = difflib.SequenceMatcher(None, gpt_line.lower(), ocr_line.lower()).ratio()
                if similarity > best_score and similarity > threshold:
                    best_score = similarity
                    best_ocr_line = ocr_line
            
            if best_ocr_line:
                matches.append((gpt_line, best_ocr_line))
            else:
                matches.append((gpt_line, None))
    return matches

def group_words_by_line(words_with_bounds, y_threshold=15, x_threshold=100):
    """
    Groups OCR words into lines by y-coordinate proximity using middle Y values.
    Also considers X-coordinate proximity to avoid grouping distant columns.
    Returns lines with merged boundaries.
    """
    if not words_with_bounds:
        return []
        
    def get_middle_y(bounds):
        """Calculate the middle Y coordinate of a bounding box"""
        y_coords = [pt[1] for pt in bounds]
        return (min(y_coords) + max(y_coords)) / 2
    
    def get_middle_x(bounds):
        """Calculate the middle X coordinate of a bounding box"""
        x_coords = [pt[0] for pt in bounds]
        return (min(x_coords) + max(x_coords)) / 2
    
    def get_x_range(line):
        """Get the X range (min_x, max_x) of words in a line"""
        if not line:
            return (0, 0)
        x_coords = []
        for word, bounds in line:
            x_coords.extend([pt[0] for pt in bounds])
        return (min(x_coords), max(x_coords))
    
    def merge_line_boundaries(line_words):
        """Merge boundaries of all words in a line into a single bounding box"""
        if not line_words:
            return []
        
        all_x_coords = []
        all_y_coords = []
        
        for word, bounds in line_words:
            for pt in bounds:
                all_x_coords.append(pt[0])
                all_y_coords.append(pt[1])
        
        # Create bounding box: top-left, top-right, bottom-right, bottom-left
        min_x, max_x = min(all_x_coords), max(all_x_coords)
        min_y, max_y = min(all_y_coords), max(all_y_coords)
        
        merged_bounds = [
            (min_x, min_y),  # top-left
            (max_x, min_y),  # top-right
            (max_x, max_y),  # bottom-right
            (min_x, max_y)   # bottom-left
        ]
        
        return merged_bounds
    
    lines = defaultdict(list)
    line_id = 0

    # Sort by middle y coordinate first, then by middle x coordinate
    sorted_words = sorted(words_with_bounds, key=lambda x: (get_middle_y(x[1]), get_middle_x(x[1])))
    
    for word, bounds in sorted_words:
        word_middle_y = get_middle_y(bounds)
        word_middle_x = get_middle_x(bounds)
        matched = False
        
        # Try to match with existing lines
        for lid, line in lines.items():
            # Calculate average middle y position of the line
            line_middle_y = sum(get_middle_y(pts) for w, pts in line) / len(line)
            
            # Check Y proximity
            if abs(word_middle_y - line_middle_y) < y_threshold:
                # Check X proximity - word should be reasonably close to existing line's X range
                line_min_x, line_max_x = get_x_range(line)
                
                # Allow word if it's within threshold of the line's X range
                # or if it extends the line naturally (not too far from either end)
                word_too_far_left = word_middle_x < line_min_x - x_threshold
                word_too_far_right = word_middle_x > line_max_x + x_threshold
                
                if not (word_too_far_left or word_too_far_right):
                    lines[lid].append((word, bounds))
                    matched = True
                    break
        
        if not matched:
            lines[line_id].append((word, bounds))
            line_id += 1

    # Convert to text lines with merged boundaries
    result_lines = []
    for lid in sorted(lines):
        # Sort words in line by x coordinate (left edge)
        line_words = sorted(lines[lid], key=lambda x: x[1][0][0])
        line_text = " ".join(word for word, _ in line_words)
        merged_bounds = merge_line_boundaries(line_words)
        
        result_lines.append({
            'text': line_text,
            'bounds': merged_bounds,
            'word_count': len(line_words)
        })

    return result_lines

@app.post("/solve/")
async def extract_and_solve(file: UploadFile = File(...)):
    logger.info(f"=== NEW REQUEST ===")
    logger.info(f"Uploaded File: {file.filename}")
    logger.info(f"File content type: {file.content_type}")
    
    # Save uploaded file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    logger.info(f"Temporary file saved to: {tmp_path}")

    try:
        # Use Google Vision OCR - get both full text and word boundaries
        extracted_text, words_with_bounds = detect_text_google_vision(tmp_path)
        
        if not extracted_text:
            logger.warning("No text extracted from image")
        
        # Load prompt from file
        system_prompt = load_prompt()
        
        # Encode image to base64 for OpenAI
        base64_image = encode_image_to_base64(tmp_path)
        
        logger.info(f"Extracted Text: {extracted_text}")
        logger.info("Calling OpenAI API with image and text...")
        
        # Call OpenAI with both text and image
        response = await client.chat.completions.create(
            model="gpt-4o",  # Using gpt-4o for vision capabilities
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user", 
                    "content": [
                        {
                            "type": "text",
                            "text": f"Here is the text extracted from the image: {extracted_text}\n\nPlease solve the problem shown in both the text and the image."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ]
        )
        answer = response.choices[0].message.content.strip()
        logger.info(f"OpenAI response received: {answer}")
        
        # Try to parse as JSON, handling markdown code blocks
        try:
            # Remove markdown code block formatting if present
            json_str = answer.strip()
            if json_str.startswith('```json'):
                json_str = json_str[7:]  # Remove ```json
            if json_str.startswith('```'):
                json_str = json_str[3:]   # Remove ``` 
            if json_str.endswith('```'):
                json_str = json_str[:-3]  # Remove trailing ```
            json_str = json_str.strip()
            
            gpt_output = json.loads(json_str)
            method_marks = gpt_output.get("method_marks", [])
            answer_mark = gpt_output.get("answer_mark", "")
            logger.info(f"Successfully parsed JSON. Method marks: {method_marks}, Answer mark: {answer_mark}")
            
        except json.JSONDecodeError as e:
            logger.info(f"GPT response is not valid JSON format: {e}")
            logger.info("Treating as plain text")
            # If not JSON, split the answer into lines for comparison
            method_marks = [line.strip() for line in answer.split('\n') if line.strip()]
            answer_mark = ""
        
        # Group OCR words into lines
        ocr_lines_data = group_words_by_line(words_with_bounds)
        ocr_lines = [line_data['text'] for line_data in ocr_lines_data]
        logger.info(f"OCR grouped into {len(ocr_lines)} lines:")
        for i, line_data in enumerate(ocr_lines_data):
            logger.info(f"  Line {i}: '{line_data['text'][:50]}...' (bounds: {line_data['bounds'][:2]}...)")
        
        # Perform fuzzy matching
        all_gpt_lines = method_marks + ([answer_mark] if answer_mark else [])
        fuzzy_matches = fuzzy_match(all_gpt_lines, ocr_lines)
        
        # Enhanced matching results with boundary information
        matches_with_bounds = []
        for gpt_line, matched_ocr_line in fuzzy_matches:
            matched_bounds = None
            if matched_ocr_line:
                # Find the bounds for the matched line
                for line_data in ocr_lines_data:
                    if line_data['text'] == matched_ocr_line:
                        matched_bounds = line_data['bounds']
                        break
            
            matches_with_bounds.append({
                'gpt_line': gpt_line,
                'matched_ocr_line': matched_ocr_line,
                'bounds': matched_bounds
            })
        logger.info(matches_with_bounds)
        logger.info("Fuzzy Matches between GPT output and OCR lines:")
        for match in matches_with_bounds:
            bounds_info = f" (bounds: {match['bounds'][:2]}...)" if match['bounds'] else ""
            logger.info(f"GPT: '{match['gpt_line']}'  ==>  OCR: '{match['matched_ocr_line']}'{bounds_info}")
        
    except Exception as e:
        logger.error(f"Error during processing: {str(e)}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": str(e)})
    
    finally:
        try:
            os.unlink(tmp_path)
            logger.info("Temporary file cleaned up")
        except Exception as e:
            logger.warning(f"Failed to clean up temporary file: {e}")
    
    logger.info("Request completed successfully")
    return {
        "question": extracted_text,
        "answer": answer,
        "fuzzy_matches": matches_with_bounds,
        "ocr_lines": ocr_lines_data
    }

@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI application startup complete")

if __name__ == "__main__":
    logger.info("Starting uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")