import xml.etree.ElementTree as ET
import json
import re
import textwrap
import os
import shutil
import argparse
import sys

# Global counter for unique IDs, mimicking client-client-side `linkid`
_global_node_id_counter = 0

# List to store all 'item' nodes for static page generation (populated by XML parsing)
_all_item_nodes = []

# --- Main Script Constants (relative to your project root) ---
XML_FILE_PATH = 'src/xml/pdf.xml'

# Output paths for generated content
OUTPUT_JSON_PATH = 'src/xml/index.json'
OUTPUT_MENU_HTML_PATH = 'src/components/menu.html'

# Directory for all prerendered static pages (and the root of your deployment)
DIST_DIR = 'dist' 

# Source paths for static assets that need to be copied to dist/
SOURCE_PUBLIC_DIR = 'src/public'
SOURCE_COMPONENTS_DIR = 'src/components'
SOURCE_IMAGES_DIR = 'src/images'
SOURCE_SCRIPTS_DIR = 'src/scripts'
SOURCE_STYLES_DIR = 'src/styles'
SOURCE_PDF_DIR = 'src/pdf'
SOURCE_XML_DIR = 'src/xml'

# HTML template for static pages
TEMPLATE_FILE_PATH = 'src/components/static-page-template.html'


def get_next_node_id():
    """Increments and returns a unique ID for each node."""
    global _global_node_id_counter
    _global_node_id_counter += 1
    return _global_node_id_counter


def sanitize_for_slug(text):
    """
    Converts text to a URL-friendly slug, using hyphens for spaces.
    NOTE: Modified to produce standard hyphenated slugs, as opposed to removing hyphens entirely.
    """
    if not text:
        return ""
    text = str(text).lower()
    # Replace non-alphanumeric (and not hyphen/space) chars with nothing
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text) # Replace spaces with single hyphen
    text = re.sub(r'-+', '-', text) # Replace multiple hyphens with single
    text = text.strip('-') # Remove leading/trailing hyphens
    return text

def generate_seo_attributes(item_title, parent_titles):
    """
    Generates path, fulltitle, description, and h1_text for an item.
    Path format: /parent1-slug/parent2-slug/item-title-slug/
    """

    # 1. Generate 'path'
    path_segments = []
    
    # Add slugified parent titles to the path segments
    for p_title in parent_titles:
        slugified_p_title = sanitize_for_slug(p_title)
        if slugified_p_title: # Only add non-empty slugs
            path_segments.append(slugified_p_title)
    
    # Add slugified item title to the path segments
    item_title_slug = sanitize_for_slug(item_title)
    if item_title_slug: # Only add non-empty slug
        path_segments.append(item_title_slug)
    
    # Construct the final path string
    if item_title.upper() == "HOME":
        generated_path = "/" # Special case for homepage
    elif path_segments:
        generated_path = "/" + "/".join(path_segments) + "/"
    else: # Fallback for cases where no title or parent titles result in empty segments
        generated_path = "/untitled-page/" # Or another suitable default/error path

    # 2. Generate fulltitle (existing logic)
    full_title_parts = [item_title] + parent_titles + ["LC100 Factory Service Manual"]
    full_title = " | ".join(filter(None, full_title_parts))
    if len(full_title) > 70:
        full_title = full_title[:67] + "..."

    # 3. Generate description (existing logic)
    context = f"in the {' '.join(parent_titles)} section" if parent_titles else "in the manual"
    description = f"Comprehensive information on {item_title} {context} for the LC100 service manual."
    if len(description) > 160:
        description = description[:157] + "..."

    # 4. Generate H1 title for SEO (existing logic)
    h1_parts = []
    
    if parent_titles:
        # Appends immediate parent, then top-level parent if there are at least two
        if len(parent_titles) >= 2:
            h1_parts.append(parent_titles[-1]) # Immediate parent
            h1_parts.append(parent_titles[0])  # Top-level parent
        elif len(parent_titles) == 1:
            h1_parts.append(parent_titles[0]) # Only one parent

    h1_parts.append(item_title)

    h1_text = " / ".join(filter(None, h1_parts))
    
    if len(h1_text) > 150:
        h1_text = h1_text[:147] + "..."

    if (h1_text == "HOME"):
        h1_text = "LC100 FACTORY SERVICE MANUAL"

    return {
        "path": generated_path, # Renamed key from 'cleanurlslug' to 'path'
        "fulltitle": full_title,
        "description": description,
        "h1_text": h1_text,
    }

def set_page_type(text):
    """Extracts the serving HTML from the text, if available."""
    if '?' in text:
        text = text.split('?', 1)[0]
        if text.startswith('/ewd_main'):
            pageType = "ewd_main"
        elif text.startswith('/ewd_overall'):
            pageType = "ewd_overall"
        else:
            pageType = "unknown"
    else:
        pageType =  "pdf"

    return pageType
    
def strip_url(url):
    """Removes the serving html and query parameters"""
    if '=' in url:
        url = str(url.split('=', 1)[1])

    if '&code='in url:
        url = url.replace('&code=','overall/')
        url = url + '.pdf'
    if '&page=' in url:
        url = url.replace('&page=','')
        url = url + '.pdf'
    return url

    

def build_nested_json(element, parent_titles=None):
    """
    Recursively builds a nested JSON structure mirroring the XML,
    adding SEO attributes and a unique 'id' to each node.
    Also collects 'item' nodes into _all_item_nodes for prerendering.
    """
    if parent_titles is None:
        parent_titles = []

    node = {}

    if element.tag == 'item':
        node['type'] = 'item'
        node['id'] = get_next_node_id() # Assign ID here
        
        title_elem = element.find('title')
        url_elem = element.find('url')
        
        if title_elem is not None:
            node['title'] = title_elem.text
        if url_elem is not None:
            node['file'] = strip_url(url_elem.text) # This is the PDF path for iframe src
            node['iframesrc'] = url_elem.text # The original URL with params

        if 'title' in node and 'file' in node:
            # Pass item_title and parent_titles to generate_seo_attributes
            seo_attrs = generate_seo_attributes(node['title'], parent_titles)
            node.update(seo_attrs)
            # Add this item node to the global list for prerendering
            _all_item_nodes.append(node)
        
        node['pagetype'] = set_page_type(url_elem.text)

        datatype_elem = element.find('datatype')
        if datatype_elem is not None:
            node['datatype'] = datatype_elem.text
        else:
            node['datatype'] = ""

    elif element.tag == 'menu':
        node['type'] = 'menu'
        node['id'] = get_next_node_id() # Assign ID here
        
        title_elem = element.find('title')
        color_elem = element.find('color')
        
        if title_elem is not None:
            node['title'] = title_elem.text
        if color_elem is not None:
            node['color'] = color_elem.text

        current_child_parents = list(parent_titles) # Make a copy for this branch
        if 'title' in node and node['title'] is not None: # Add current menu's title to parent path
            current_child_parents.append(node['title']) # Append, as it's a parent for children

        node['children'] = []
        for child_elem in element:
            child_node = build_nested_json(child_elem, current_child_parents)
            if child_node:
                node['children'].append(child_node)
    
    elif element.tag == 'pdf': # This is the root element
        node['type'] = 'root'
        node['id'] = "root" # Assign a static ID for the root
        node['children'] = []
        for child_elem in element:
            child_node = build_nested_json(child_elem, parent_titles)
            if child_node:
                node['children'].append(child_node)

    return node


# --- Functions for HTML menu generation ---

def _render_node_to_html(node, depth=0, is_last_sibling=False):
    """
    Recursively generates HTML for a menu tree branch from a JSON node.
    Mirrors the JavaScript buildMenuBranchHtml function, including IDs and classes.
    """
    html_parts = []
    indent = "  " * depth 

    node_id = str(node.get('id', ''))
    node_title = node.get('title', 'Untitled')
    node_type = node.get('type')

    node_class = f"tree-node {node_type}-node"
    if is_last_sibling:
        node_class += " last-sibling"

    is_menu = node_type == 'menu'
    has_children = is_menu and node.get('children') and len(node['children']) > 0

    is_initially_expanded = (depth == 1) # Top-level menus (depth 1) are expanded by default
    initial_collapse_class = "expanded" if is_initially_expanded else "collapsed"

    if node_type == 'root':
        html_parts.append(f'{indent}<ul id="menu-root" class="tree-menu-container">')
        if node.get('children'):
            for i, child in enumerate(node['children']):
                child_is_last_sibling = (i == len(node['children']) - 1)
                html_parts.append(_render_node_to_html(child, depth + 1, child_is_last_sibling))
        html_parts.append(f'{indent}</ul>')

    elif is_menu: # type === 'menu'
        html_parts.append(f'{indent}<li id="node-{node_id}" class="{node_class} {initial_collapse_class}">')
        
        # Node header div with onclick for ViewTree
        html_parts.append(f'{indent}  <div class="node-header menu-toggle-area" onclick="ViewTree({node_id})">')
        
        # Toggle icon (using placeholder paths for images)
        # YOU WILL NEED TO REPLACE THESE PLACEHOLDER PATHS WITH YOUR ACTUAL IMAGE PATHS
        toggle_icon_src = "/images/minas1.gif" if is_initially_expanded else "/images/plas1.gif"
        toggle_icon_alt = "-" if is_initially_expanded else "+"
        html_parts.append(f'{indent}    <img id="toggle-icon-{node_id}" src="{toggle_icon_src}" class="toggle-icon" alt="{toggle_icon_alt}">')
        
        # Menu title span
        html_parts.append(f'{indent}    <span class="menu-title">{node_title}</span>')
        html_parts.append(f'{indent}  </div>')
        
        if has_children:
            # Nested <ul> for children, with display style based on initial expansion
            display_style = "block" if is_initially_expanded else "none"
            html_parts.append(f'{indent}  <ul id="children-of-{node_id}" class="menu-children" style="display: {display_style};">')
            for i, child in enumerate(node['children']):
                child_is_last_sibling = (i == len(node['children']) - 1)
                html_parts.append(_render_node_to_html(child, depth + 1, child_is_last_sibling))
            html_parts.append(f'{indent}  </ul>')
        html_parts.append(f'{indent}</li>')

    elif node_type == 'item': # type === 'item'
        html_parts.append(f'{indent}<li id="node-{node_id}" class="{node_class}">')
        html_parts.append(f'{indent}  <div class="node-content">')
        
        # Get the new 'path' directly.
        node_path_value = node.get("path", "/") # Default to root if path is missing
        
        item_link_classes = f"item-link {node.get('datatype', '')}".strip()

        # Updated: href now points directly to the pretty path,
        # onclick passes the pretty path
        html_parts.append(f'{indent}    <a id="link-{node_id}" href="{node_path_value}" onclick=\'linkClick("{node_path_value}"); return false;\' title="{node_title}" class="{item_link_classes}">')
        html_parts.append(f'{indent}      {node_title}')
        html_parts.append(f'{indent}    </a>')
        html_parts.append(f'{indent}  </div>')
        html_parts.append(f'{indent}</li>')

    return "\n".join(html_parts)


def generate_html_from_json(menu_data_json):
    """
    Generates the HTML for the menu tree from the given JSON menu data.
    Assumes menu_data_json is the root JSON object.
    """
    return _render_node_to_html(menu_data_json)

def load_template_file(template_path):
    """Reads content from a specified template file."""
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: Template file not found at {template_path}. Please create it.")
        exit(1) # Exit if the template is not found as it's critical
    except Exception as e:
        print(f"Error reading template file {template_path}: {e}")
        exit(1)

def generate_static_html_pages(all_item_nodes, output_dir, html_template):
    """
    Generates a static index.html file for each item node in the provided list.
    """
    print(f"Generating static HTML pages in {output_dir}...")
    
    # Ensure the root output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Path to the 404 iframe content (adjust if your 404-iframe-content.html is not at root)
    four_o_four_iframe_path = "/components/404-content.html" 

    for item in all_item_nodes:
        # Get data for template
        path = item.get("path", "/")
        fulltitle = item.get("fulltitle", "Untitled Page")
        description = item.get("description", "Information on this page.")
        h1_text = item.get("h1_text", fulltitle)
        # Using item's original title as the h2 for static pages
        h2_text = item.get("title", "") 
        iframe_src = item.get("file", four_o_four_iframe_path) # Default to 404 if file is missing
        item_id = item.get("id", "") # Assuming 'id' is always present and unique for items


        # Construct the full file system path for the new index.html
        # Remove leading/trailing slashes from path to create directories cleanly
        relative_path_for_dir = path.strip('/')
        
        # If it's the root path "/", the relative_path_for_dir will be empty.
        # In that case, the file should be written directly to output_dir/index.html
        if not relative_path_for_dir:
            file_dir = output_dir
        else:
            file_dir = os.path.join(output_dir, relative_path_for_dir)
        
        # Ensure the directory structure exists
        os.makedirs(file_dir, exist_ok=True)
        
        file_path = os.path.join(file_dir, 'index.html')

        # Populate the template with item-specific data
        page_content = html_template.replace("{{ fulltitle }}", fulltitle)
        page_content = page_content.replace("{{ description }}", description)
        page_content = page_content.replace("{{ canonical_url }}", f"https://lc100e.github.io{path}") # Absolute URL for canonical
        page_content = page_content.replace("{{ h1_text }}", h1_text)
        page_content = page_content.replace("{{ h2_text }}", h2_text) 
        page_content = page_content.replace("{{ iframe_src }}", iframe_src)
        # page_content = page_content.replace("{{ menu_html_content }}", menu_html_content)
        page_content = page_content.replace("{{ item_id }}", str(item_id)) # Ensure it's a string


        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(page_content)
            print(f"  Generated: {file_path}")
        except IOError as e:
            print(f"Error writing static page to {file_path}: {e}")

    print(f"Finished generating {len(all_item_nodes)} static HTML pages.")
    
# --- NEW FUNCTION FOR 404 PAGE GENERATION ---
def generate_404_page(output_dir, html_template):
    """
    Generates a dynamic 404.html page using the main template.
    """
    print(f"Generating 404.html...")
    
    # Define the 404 page content based on the template
    fulltitle = "404 Not Found | LC100 Factory Service Manual"
    description = "The requested page could not be found."
    h1_text = "404 Not Found"
    h2_text = "" # No h2 for this page
    iframe_src = "/components/404-content.html" # A static page shown in the iframe
    item_id = "404page" # A unique ID for the 404 page

    page_content = html_template.replace("{{ fulltitle }}", fulltitle)
    page_content = page_content.replace("{{ description }}", description)
    page_content = page_content.replace("{{ canonical_url }}", f"https://lc100e.github.io/404.html")
    page_content = page_content.replace("{{ h1_text }}", h1_text)
    page_content = page_content.replace("{{ h2_text }}", h2_text)
    page_content = page_content.replace("{{ iframe_src }}", iframe_src)
    page_content = page_content.replace("{{ item_id }}", str(item_id))
    
    # The output path for the 404 page
    output_path = os.path.join(output_dir, '404.html')

    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(page_content)
        print(f"  Generated: {output_path}")
    except IOError as e:
        print(f"Error writing 404.html: {e}")
        
    print(f"Finished generating 404.html.")


def clean_dist_directory(dist_path):
    """Removes the entire dist directory if it exists, for a clean build."""
    if os.path.exists(dist_path):
        print(f"Cleaning existing '{dist_path}' directory...")
        shutil.rmtree(dist_path)
    os.makedirs(dist_path, exist_ok=True) # Recreate the dist directory
    print(f"'{dist_path}' directory ready.")

def copy_file(source_path, dest_path):
    """Copies a single file, ensuring its destination directory exists."""
    if not os.path.exists(source_path):
        print(f"Warning: Source file not found - '{source_path}'. Skipping copy.")
        return

    dest_dir = os.path.dirname(dest_path)
    os.makedirs(dest_dir, exist_ok=True)
    try:
        shutil.copy2(source_path, dest_path)
        print(f"  Copied file: '{source_path}' to '{dest_path}'")
    except Exception as e:
        print(f"Error copying file '{source_path}' to '{dest_path}': {e}")

def copy_directory_contents(source_dir, dest_dir):
    """Copies all files and subdirectories from source_dir to dest_dir."""
    if not os.path.exists(source_dir):
        print(f"Warning: Source directory not found - '{source_dir}'. Skipping copy.")
        return

    os.makedirs(dest_dir, exist_ok=True)
    for item in os.listdir(source_dir):
        s = os.path.join(source_dir, item)
        d = os.path.join(dest_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True) # Use dirs_exist_ok for Python 3.8+
            print(f"  Copied directory: '{s}' to '{d}'")
        else:
            shutil.copy2(s, d)
            print(f"  Copied file: '{s}' to '{d}'")


# --- Asset copying functions split again for exclusion ---

def copy_non_pdf_assets_to_dist():
    """Copies all static assets EXCEPT the PDF directory from source to dist."""
    print("\n--- Step: Copying Non-PDF Static Assets ---")

    copy_directory_contents(SOURCE_PUBLIC_DIR, DIST_DIR)
    copy_directory_contents(SOURCE_COMPONENTS_DIR, os.path.join(DIST_DIR, 'components'))
    copy_directory_contents(SOURCE_IMAGES_DIR, os.path.join(DIST_DIR, 'images'))
    # SOURCE_PDF_DIR is intentionally EXCLUDED from this function
    copy_directory_contents(SOURCE_SCRIPTS_DIR, os.path.join(DIST_DIR, 'scripts'))
    copy_directory_contents(SOURCE_STYLES_DIR, os.path.join(DIST_DIR, 'styles'))
    copy_directory_contents(SOURCE_XML_DIR, os.path.join(DIST_DIR, 'xml'))
           
    print("Non-PDF static asset copying completed.")

def copy_pdf_assets_to_dist():
    """Copies ONLY the PDF directory from source to dist."""
    print("\n--- Step: Copying PDF Assets ---")
    # Ensure destination exists before copying
    os.makedirs(os.path.join(DIST_DIR, 'pdf'), exist_ok=True)
    copy_directory_contents(SOURCE_PDF_DIR, os.path.join(DIST_DIR, 'pdf'))
    print("PDF asset copying completed.")


# --- Modularized Content Generation Step ---

def generate_all_static_content():
    """Generates JSON, menu HTML, and all static HTML pages."""
    global _all_item_nodes # Declare intent to modify global variable

    print(f"--- Step: Generating JSON from {XML_FILE_PATH}, Menu HTML, and Static Pages ---")
    
    # Reset global ID counter and item nodes list for a clean run for this step
    global _global_node_id_counter 
    _global_node_id_counter = 0 
    _all_item_nodes.clear() # Clear the list for a fresh run

    try:
        tree = ET.parse(XML_FILE_PATH)
        root_element = tree.getroot()
        # This function call populates the global _all_item_nodes list
        nested_json_data = build_nested_json(root_element) 

        print("XML parsed and nested JSON data built.")

        # Write JSON to its source location (it will be copied to dist later)
        os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
        with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(nested_json_data, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved JSON data to {OUTPUT_JSON_PATH}")

        # Generate and write Menu HTML to its source location
        generated_menu_html_body = generate_html_from_json(nested_json_data)
        comment_block = textwrap.dedent("""\
            """)
        final_menu_html_content = comment_block + generated_menu_html_body

        os.makedirs(os.path.dirname(OUTPUT_MENU_HTML_PATH), exist_ok=True)
        with open(OUTPUT_MENU_HTML_PATH, 'w', encoding='utf-8') as f:
            f.write(final_menu_html_content)
        print(f"Successfully generated menu HTML: {OUTPUT_MENU_HTML_PATH}")

        # Now, generate all static HTML pages using the populated _all_item_nodes
        static_page_template = load_template_file(TEMPLATE_FILE_PATH)
        if _all_item_nodes and static_page_template:
            generate_static_html_pages(_all_item_nodes, DIST_DIR, static_page_template)
        elif not _all_item_nodes:
            print("No item nodes found for static page generation.")
        else:
            print("Static page generation skipped due to missing template content.")

        # --- RESTORED: Generate the 404 page after all other pages ---
        if static_page_template:
            generate_404_page(DIST_DIR, static_page_template)
        # --- END RESTORED ---
        
        return True # Indicate success
    except FileNotFoundError:
        print(f"Error: XML input file not found at {XML_FILE_PATH}. Please ensure it exists.")
    except ET.ParseError as e:
        print(f"Error parsing XML file {XML_FILE_PATH}: {e}. Please check if it's valid XML.")
    except Exception as e:
        print(f"An unexpected error occurred during content generation: {e}")
    return False # Indicate failure


def main():
    parser = argparse.ArgumentParser(description="Build script for LC100 Factory Service Manual website.")
    
    parser.add_argument('--generate-static', action='store_true', 
                        help='Generate all static HTML pages, menu, and JSON data. Runs XML parsing and page generation.')
    parser.add_argument('--copy-src', action='store_true', 
                        help='Copy all source assets (excluding the PDF directory) to dist/.')
    parser.add_argument('--all', action='store_true', 
                        help='Perform a full clean build (implies cleaning, --generate-static, and copying all assets including PDFs).')

    args = parser.parse_args()

    # If no command-line arguments are provided (only the script name is in sys.argv),
    # print the help message and exit.
    if len(sys.argv) == 1:
        parser.print_help(sys.stderr)
        sys.exit(1) # Exit with a non-zero status code to indicate an error/missing arguments
    
    # If --all is specified, it implies cleaning, generate-static, and copying both types of assets
    if args.all:
        clean_dist_directory(DIST_DIR) # Clean is now directly called here for --all
        args.generate_static = True
    
    # Content generation (XML parsing, JSON, Menu HTML, all Static Pages)
    if args.generate_static: 
        if not generate_all_static_content():
            print("Build process aborted due to content generation failure.")
            return # Exit if content generation failed

    # Asset Copying Logic
    if args.copy_src or args.all: # Changed logic to handle --all correctly
        copy_non_pdf_assets_to_dist()
    
    if args.all:
        copy_pdf_assets_to_dist()

    print("\n--- Build process completed successfully! ---")

if __name__ == "__main__":
    main()