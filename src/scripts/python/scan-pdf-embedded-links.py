import os
import fitz  # PyMuPDF
import json
from urllib.parse import urlparse, parse_qs
# import argparse # Removed: No longer needed as command-line options are removed

def extract_pdf_data(pdf_path):
    """
    Extracts embedded links (annotations) and page dimensions from a single PDF file.

    Args:
        pdf_path (str): The full path to the PDF file.

    Returns:
        dict: A dictionary containing:
              - 'page_sizes' (list): List of dicts with 'page_number', 'width', 'height'.
              - 'links' (list): List of dictionaries, where each dictionary represents a link.
              Returns empty lists for page_sizes and links if no data is found or on error.
    """
    links_found = []
    page_dimensions = []
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(doc.page_count):
            page = doc[page_num]
            
            # Get the page dimensions (width and height in PDF units/points)
            current_page_width = page.rect.width
            current_page_height = page.rect.height

            page_dimensions.append({
                "page_number": page_num + 1,
                "width": current_page_width,
                "height": current_page_height
            })

            for link in page.get_links():
                link_details = {
                    "page_number": page_num + 1, # Human-readable page number (1-indexed)
                    "type": None,
                    "destination": None,
                    "text_area": None, # Bounding box coordinates [x0, y0, x1, y1]
                }

                link_kind = link.get("kind")
                
                # Convert fitz.Rect object to a list for JSON serialization
                bbox_rect = link.get("from")
                if bbox_rect is not None:
                    # Store coordinates as a list [x0, y0, x1, y1]
                    link_details["text_area"] = [bbox_rect.x0, bbox_rect.y0, bbox_rect.x1, bbox_rect.y1]

                if link_kind == fitz.LINK_URI: # External URL
                    link_details["type"] = "URI"
                    link_details["destination"] = link.get("uri")
                elif link_kind == fitz.LINK_GOTO: # Internal link to a page within the same PDF
                    link_details["type"] = "Internal Page"
                    # 'page' key is 0-indexed in fitz, convert to 1-indexed for display
                    link_details["destination"] = f"Page {link.get('page') + 1}"
                    link_details["target_page"] = link.get("page") + 1 
                elif link_kind == fitz.LINK_GOTOR: # Go to a page in another PDF (remote file)
                    link_details["type"] = "Remote GoTo"
                    link_details["destination"] = f"File: {link.get('file')}, Page: {link.get('page') + 1}"
                    link_details["target_file"] = link.get("file")
                    link_details["target_page"] = link.get("page") + 1
                elif link_kind == fitz.LINK_LAUNCH: # Launch a file
                    link_details["type"] = "Launch File"
                    link_details["destination"] = link.get("file")
                elif link_kind == fitz.LINK_NAMED: # Go to a named destination
                    link_details["type"] = "Named Destination"
                    link_details["destination"] = link.get("name")
                else:
                    link_details["type"] = f"Unknown Kind ({link_kind})"
                    link_details["destination"] = str(link) # Log raw link object for unknown types

                # Attempt to get text covered by the link's bounding box
                if link_details["text_area"]:
                    try:
                        link_text = page.get_textbox(link_details["text_area"]).strip()
                        if link_text:
                            link_details["text_covered"] = link_text
                    except Exception:
                        pass # Ignore errors for text extraction
                
                links_found.append(link_details)
        doc.close()
    except fitz.FileNotFoundError:
        print(f"  Error: PDF file not found: {pdf_path}")
    except Exception as e:
        print(f"  Error processing PDF '{pdf_path}': {e}")
    
    return {
        "page_sizes": page_dimensions,
        "links": links_found
    }

def generate_pdf_link_cache(pdf_root_directory, output_cache_file, limit_cache_writes=None):
    """
    Crawls a specified directory for PDF files, extracts embedded links and page dimensions,
    and writes them to a single JSON cache file in the desired format.

    Args:
        pdf_root_directory (str): The root directory to start crawling for PDFs.
        output_cache_file (str): The path to the JSON file where the cache will be written.
        limit_cache_writes (int, optional): If set, stops processing after this many PDFs
                                            that contain *links* have been written to the cache.
    """
    if not os.path.isdir(pdf_root_directory):
        print(f"Error: PDF root directory '{pdf_root_directory}' not found.")
        return

    combined_pdf_data_cache = {} # This will store the final structured data
    files_scanned_total = 0
    files_added_to_cache = 0 # This counter tracks how many PDFs with links are added

    print(f"--- Generating PDF Data Cache from: {os.path.abspath(pdf_root_directory)} ---")

    for root, _, files in os.walk(pdf_root_directory):
        for file in files:
            # Check if we've reached the limit *before* processing the file, for efficiency
            if limit_cache_writes is not None and files_added_to_cache >= limit_cache_writes:
                print(f"Limit of {limit_cache_writes} PDFs with links reached. Stopping scan.")
                # Break from the inner loop (files in current directory)
                break
            
            if file.lower().endswith('.pdf'):
                full_pdf_path = os.path.join(root, file)
                files_scanned_total += 1
                
                try:
                    # Determine a canonical key for the cache (e.g., relative path from 'src/pdf')
                    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
                    PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, os.pardir, os.pardir, os.pardir))
                    
                    relative_from_project_root = os.path.relpath(full_pdf_path, start=PROJECT_ROOT)
                    
                    pdf_relative_path_segment = os.path.join('src', 'pdf')
                    if relative_from_project_root.startswith(pdf_relative_path_segment + os.sep):
                        cache_key = relative_from_project_root[len(pdf_relative_path_segment + os.sep):]
                        cache_key = cache_key.replace(os.sep, '/')
                        # *** ADD THE LEADING '/pdf/' to align with the key source ***
                        cache_key = '/pdf/' + cache_key 
                    else:
                        relative_from_src_root = os.path.relpath(full_pdf_path, start=os.path.join(PROJECT_ROOT, 'src'))
                        cache_key = relative_from_src_root.replace(os.sep, '/')
                        print(f"Warning: PDF path '{full_pdf_path}' not under 'src/pdf'. Using key: '{cache_key}'")

                except Exception as e:
                    print(f"Error determining canonical key for {full_pdf_path}: {e}. Skipping.")
                    continue

                print(f"Scanning PDF {files_scanned_total}: {cache_key}")
                
                pdf_data = extract_pdf_data(full_pdf_path)
                
                # --- CORRECTED LOGIC: Only add to cache if embedded links are found ---
                if pdf_data.get('links') and len(pdf_data['links']) > 0:
                    combined_pdf_data_cache[cache_key] = pdf_data
                    files_added_to_cache += 1
                    print(f"  Added to cache (Total cached: {files_added_to_cache}/{limit_cache_writes if limit_cache_writes is not None else 'All'}). Links: {len(pdf_data.get('links', []))}, Pages: {len(pdf_data.get('page_sizes', []))}")
                else:
                    print(f"  No embedded links found. Not added to cache.")
        
        # Check limit again after inner loop, to potentially break from outer loop
        if limit_cache_writes is not None and files_added_to_cache >= limit_cache_writes:
            break

    # Ensure the output directory exists
    output_dir = os.path.dirname(output_cache_file)
    os.makedirs(output_dir, exist_ok=True)

    # Write the combined cache to disk
    try:
        with open(output_cache_file, 'w', encoding='utf-8') as f:
            json.dump(combined_pdf_data_cache, f, indent=2, ensure_ascii=False)
        print(f"\n--- PDF Data Cache Generated Successfully ---")
        print(f"Total PDFs scanned: {files_scanned_total}")
        print(f"PDFs with links added to cache: {files_added_to_cache}")
        print(f"Cache file created at: {os.path.abspath(output_cache_file)}")
        total_links_extracted = sum(len(v.get('links', [])) for v in combined_pdf_data_cache.values())
        print(f"Total links extracted: {total_links_extracted}")
    except Exception as e:
        print(f"Error writing cache file: {e}")

if __name__ == "__main__":
    # --- Configuration ---
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, os.pardir, os.pardir, os.pardir))

    PDF_ROOT_DIR = os.path.join(PROJECT_ROOT, 'src', 'pdf')
    OUTPUT_CACHE_DIR = os.path.join(PROJECT_ROOT, 'src/xml')
    OUTPUT_CACHE_FILE = os.path.join(OUTPUT_CACHE_DIR, 'pdf_links_cache.json')

    # --- IMPORTANT: Set the limit for testing with a subset of files ---
    # Set to an integer to limit the number of PDFs *with links* that are written to the cache.
    # Set to None to process ALL PDF files and cache all found links.
    CACHE_WRITE_LIMIT = 20 # Still set to 20, as per your previous requirement

    try:
        import fitz
    except ImportError:
        print("Error: PyMuPDF (fitz) library not found.")
        print("Please install it using: pip install PyMuPDF")
        exit(1)

    # Directly call the function to generate the cache
    generate_pdf_link_cache(PDF_ROOT_DIR, OUTPUT_CACHE_FILE, CACHE_WRITE_LIMIT)