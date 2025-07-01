import os
import subprocess
import argparse
from pikepdf import Pdf, PasswordError, PdfError, Dictionary
import pypdfium2 as pdfium
from PIL import Image
import cv2
import numpy as np

# Version number
SCRIPT_VERSION = "1.14"

downloads = "/Users/chriscullin/Downloads/"

def check_pdffonts(pdf_path):
    """Check if the PDF has CID fonts or non-embedded fonts using pdffonts."""
    try:
        result = subprocess.run(["pdffonts", pdf_path], capture_output=True, text=True, check=True)
        lines = result.stdout.splitlines()
        if len(lines) <= 2:
            return False, False, False

        header = lines[0].split()
        name_idx = header.index("name")
        type_idx = header.index("type")
        encoding_idx = header.index("encoding")
        embedded_idx = next((i for i, h in enumerate(header) if h in ("embedded", "emb")), -1)
        if embedded_idx == -1:
            raise ValueError("'embedded' or 'emb' not in header")

        has_cid_fonts = False
        has_identity_h = False
        has_non_embedded_fonts = False
        for line in lines[2:]:
            fields = line.split(maxsplit=len(header)-1)
            if len(fields) < max(name_idx, type_idx, encoding_idx, embedded_idx) + 1:
                continue
            font_type = fields[type_idx].lower()
            encoding = fields[encoding_idx].lower()
            embedded = fields[embedded_idx].lower()
            if "cid" in font_type and embedded != "no":
                has_cid_fonts = True
            if encoding == "identity-h":
                has_identity_h = True
            if embedded == "no":
                has_non_embedded_fonts = True
        return has_cid_fonts, has_identity_h, has_non_embedded_fonts
    except (subprocess.CalledProcessError, ValueError, FileNotFoundError):
        return False, False, False

def is_scanned_pdf(pdf_path):
    """Check if the PDF is a scanned document by attempting to extract text using pdfium."""
    try:
        pdf_doc = pdfium.PdfDocument(pdf_path)
        text = ""
        for page_num in range(len(pdf_doc)):
            page = pdf_doc[page_num]
            # Create a PdfText object for the page
            text_page = page.get_textpage()
            # Get the page dimensions using get_mediabox()
            x0, y0, x1, y1 = page.get_mediabox()
            width = x1 - x0
            height = y1 - y0
            # Extract text from the entire page (bounding box: left, bottom, right, top)
            page_text = text_page.get_text_bounded(left=0, bottom=0, right=width, top=height) or ""
            text += page_text
            text_page.close()  # Close the text page to free resources
        pdf_doc.close()
        
        # Debug: Log whether text was found
        is_scanned = len(text.strip()) == 0
        # print(f"DEBUG: {os.path.basename(pdf_path)} - Text found: {len(text.strip()) > 0}, Scanned: {is_scanned}", flush=True)
        return is_scanned
    except Exception as e:
        print(f"DEBUG: {os.path.basename(pdf_path)} - Error in is_scanned_pdf: {e}, Scanned: False", flush=True)
        return False

def detect_hollow_rectangles(pil_image):
    """Detect hollow rectangles (.notdef glyphs) in the PIL image using OpenCV (in memory)."""
    # Convert PIL image to OpenCV format
    img_array = np.array(pil_image)
    img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
    
    # Enhance contrast to preserve white areas
    alpha = 3.0  # Increased contrast
    beta = 0     # Brightness control
    gray = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
    
    # Use simple thresholding to preserve white areas
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    
    # Size ranges (unchanged)
    width_range = (10, 40)
    height_range = (20, 65)
    min_area = 300
    aspect_ratio_range = (0.4, 0.8)
    
    hollow_rectangles = 0
    for contour in contours:
        # Approximate the contour to a polygon with a smaller epsilon
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        
        # Check if the contour is a rectangle (4 sides)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = w / float(h)
            
            # Check minimum area
            area = w * h
            if area < min_area:
                continue
            
            # Check if the shape is a vertically oriented rectangle
            if (aspect_ratio_range[0] <= aspect_ratio <= aspect_ratio_range[1]) and \
               (width_range[0] <= w <= width_range[1]) and \
               (height_range[0] <= h <= height_range[1]):
                # Check if the rectangle is hollow by examining the interior
                roi = thresh[y:y+h, x:x+w]
                # Exclude a border to avoid counting the outline
                border = 2
                interior = roi[border:-border, border:-border]
                if interior.size > 0:
                    white_pixels = np.sum(interior == 255)
                    total_pixels = interior.size
                    white_ratio = white_pixels / total_pixels
                    # Set threshold based on known white interior (60–100%)
                    if white_ratio > 0.6:
                        # Check for overlap with other text by examining the surrounding area
                        margin = 5
                        expanded_roi = thresh[max(0, y-margin):min(thresh.shape[0], y+h+margin),
                                            max(0, x-margin):min(thresh.shape[1], x+w+margin)]
                        expanded_contours, _ = cv2.findContours(expanded_roi, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
                        if len(expanded_contours) <= 5:
                            # Check a larger surrounding area for contour density
                            large_margin = 20
                            large_roi = thresh[max(0, y-large_margin):min(thresh.shape[0], y+h+large_margin),
                                              max(0, x-large_margin):min(thresh.shape[1], x+w+large_margin)]
                            if large_roi.size > 0:
                                large_contours, _ = cv2.findContours(large_roi, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
                                contour_density = len(large_contours) / (large_roi.shape[0] * large_roi.shape[1])
                                if 0.0001 < contour_density < 0.01:
                                    hollow_rectangles += 1
    
    return hollow_rectangles

def check_for_notdef(pdf_path, max_filename_length=None, current=None, total=None):
    """Process PDF pages and check for .notdef glyphs (in memory)."""
    filename = os.path.basename(pdf_path)
    if max_filename_length is None:
        max_filename_length = 30
    padded_filename = filename.ljust(max_filename_length)

    # Format the "X of Y" prefix
    if current is not None and total is not None:
        prefix = f"{current} of {total}"
    else:
        prefix = "1 of 1"
    prefix = prefix.ljust(10)

    has_notdef = False
    try:
        pdf_doc = pdfium.PdfDocument(pdf_path)
        total_pages = len(pdf_doc)
        for page_num in range(total_pages):
            page = pdf_doc[page_num]
            bitmap = page.render(scale=300/72)
            pil_image = bitmap.to_pil()
            
            hollow_rectangles = detect_hollow_rectangles(pil_image)
            if hollow_rectangles > 0:
                has_notdef = True
                break
        pdf_doc.close()
        
        if has_notdef:
            print(f"{prefix}{padded_filename}\tfailed", flush=True)
        else:
            print(f"{prefix}{padded_filename}\tpassed", flush=True)
        return has_notdef
    except Exception as e:
        print(f"{prefix}{padded_filename}\tfailed due to error: {e}", flush=True)
        return None

def check_pdf_fonts(pdf_path, password=None, max_filename_length=None, current=None, total=None):
    filename = os.path.basename(pdf_path)
    if max_filename_length is None:
        max_filename_length = 30
    padded_filename = filename.ljust(max_filename_length)

    # Format the "X of Y" prefix
    if current is not None and total is not None:
        prefix = f"{current} of {total}"
    else:
        prefix = "1 of 1"
    prefix = prefix.ljust(10)

    # Check if the PDF is a scanned document
    if is_scanned_pdf(pdf_path):
        print(f"{prefix}{padded_filename}\tpassed (scanned document)", flush=True)
        return True

    pdf = None
    try:
        if password:
            pdf = Pdf.open(pdf_path, password=password)
        else:
            pdf = Pdf.open(pdf_path)
    except PasswordError:
        has_cid_fonts, has_identity_h, has_non_embedded_fonts = check_pdffonts(pdf_path)
        if not has_cid_fonts and not has_non_embedded_fonts:
            print(f"{prefix}{padded_filename}\tpassed (no CID or non-embedded fonts)", flush=True)
            return True
        has_notdef = check_for_notdef(pdf_path, max_filename_length, current, total)
        if has_notdef is None:
            print(f"{prefix}{padded_filename}\tfailed (error in notdef check)", flush=True)
            return False
        if has_notdef:
            return False  # Message already printed in check_for_notdef
        print(f"{prefix}{padded_filename}\tpassed", flush=True)
        return True
    except PdfError:
        print(f"{prefix}{padded_filename}\tpassed (PDF error)", flush=True)
        return True

    try:
        has_cid_fonts, has_identity_h, has_non_embedded_fonts = check_pdffonts(pdf_path)
        if not has_cid_fonts and not has_non_embedded_fonts:
            print(f"{prefix}{padded_filename}\tpassed (no CID or non-embedded fonts)", flush=True)
            return True
        has_notdef = check_for_notdef(pdf_path, max_filename_length, current, total)
        if has_notdef is None:
            result = has_cid_fonts or has_non_embedded_fonts
            print(f"{prefix}{padded_filename}\t{'failed' if result else 'passed'} (based on font check)", flush=True)
            return not result
        if has_notdef:
            return False  # Message already printed in check_for_notdef
        print(f"{prefix}{padded_filename}\tpassed", flush=True)
        return True
    finally:
        if pdf is not None:
            pdf.close()

def scan_directory(base_path, password=None):
    pdf_files = [
        file for file in os.listdir(base_path)
        if os.path.isfile(os.path.join(base_path, file)) and file.lower().endswith(".pdf")
    ]
    total_files = len(pdf_files)
    print(f"Found {total_files} PDF files in {base_path}. Starting processing…", flush=True)

    max_filename_length = max((len(file) for file in pdf_files), default=30)

    problematic_files = []
    passed_count = 0
    failed_count = 0
    for idx, file in enumerate(pdf_files, 1):
        full_path = os.path.join(base_path, file)
        fonts_ok = check_pdf_fonts(full_path, password, max_filename_length, idx, total_files)
        if not fonts_ok:
            problematic_files.append((base_path, file))
            failed_count += 1
        else:
            passed_count += 1

    for _, file in problematic_files:
        print(file, flush=True)

    output_path = os.path.join(downloads, "notdef_files.txt")
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            if problematic_files:
                directory = problematic_files[0][0]
                f.write(f"Directory: {directory}\n")
                for _, file in problematic_files:
                    f.write(f"{file}\n")
            else:
                f.write("No problematic files found.\n")
    except (FileNotFoundError, PermissionError) as e:
        print(f"Error writing to {output_path}: {e}", flush=True)

    print("Finished processing all files.", flush=True)
    print(f"Total: {total_files} files, {passed_count} passed, {failed_count} failed", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=f"Scan PDFs for rendering issues (.notdef glyphs). Version {SCRIPT_VERSION}")
    parser.add_argument("path", help="File or directory to scan")
    parser.add_argument("--password", help="Password for locked PDFs (optional)", default=None)
    args = parser.parse_args()

    output_path = os.path.join(downloads, "notdef_files.txt")

    if os.path.isdir(args.path):
        scan_directory(args.path, args.password)
    elif os.path.isfile(args.path) and args.path.lower().endswith(".pdf"):
        full_path = args.path
        passed_count = 0
        failed_count = 0
        fonts_ok = check_pdf_fonts(full_path, args.password)
        if not fonts_ok:
            print(os.path.basename(full_path), flush=True)
            failed_count += 1
        else:
            passed_count += 1
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                if not fonts_ok:
                    directory = os.path.dirname(full_path)
                    filename = os.path.basename(full_path)
                    f.write(f"Directory: {directory}\n")
                    f.write(f"{filename}\n")
                else:
                    f.write("No problematic files found.\n")
        except (FileNotFoundError, PermissionError) as e:
            print(f"Error writing to {output_path}: {e}", flush=True)
        print("Finished processing.", flush=True)
        print(f"Total: 1 files, {passed_count} passed, {failed_count} failed", flush=True)
    else:
        print("Please provide a valid PDF file or directory path.", flush=True)