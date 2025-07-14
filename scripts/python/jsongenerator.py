import xml.etree.ElementTree as ET
import re
import json

# Global counter for unique IDs, mimicking client-side `linkid`
_global_node_id_counter = 0

def get_next_node_id():
    """Increments and returns a unique ID for each node."""
    global _global_node_id_counter
    _global_node_id_counter += 1
    return _global_node_id_counter

def sanitize_for_slug(text):
    """Converts text to a URL-friendly slug."""
    text = str(text).lower()
    text = re.sub(r'\s+', '-', text) # Replace spaces with single hyphen
    text = re.sub(r'[^a-z0-9-]', '', text) # Remove non-alphanumeric chars except hyphens
    text = re.sub(r'-+', '-', text) # Replace multiple hyphens with single
    text = text.strip('-') # Remove leading/trailing hyphens
    return text

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
        pageType =  "generic"

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

def generate_seo_attributes(item_title, parent_titles):
    """Generates cleanurlslug, fulltitle, and description for an item."""

    # 1. Generate cleanurlslug
    title_slug = sanitize_for_slug(item_title)
    parent_title_slug = sanitize_for_slug(parent_titles[-1]) if parent_titles else ""
    # clean_url_slug = f"{pdf_slug_base}-{title_slug}.html" if title_slug else pdf_slug_base
    clean_url_slug = f"{_global_node_id_counter}-{parent_title_slug}-{title_slug}" if title_slug else ""
    if not clean_url_slug:
        clean_url_slug = "untitled-page"

    if item_title == "HOME" :
        clean_url_slug = "index.html"

    # 2. Generate fulltitle
    full_title_parts = [item_title] + parent_titles + ["LC100 Factory Service Manual"]
    full_title = " | ".join(filter(None, full_title_parts))
    if len(full_title) > 70:
        full_title = full_title[:67] + "..."

    # 3. Generate description
    context = f"in the {' '.join(parent_titles)} section" if parent_titles else "in the manual"
    description = f"Comprehensive information on {item_title} {context} for the LC100 service manual."
    if len(description) > 160:
        description = description[:157] + "..."

    # 4. Generate H1 title for SEO
    h1_parts = []
    
    if parent_titles: # Check if there are any menu parents for this item
        if len(parent_titles) >= 2:
            # If there are at least two parent levels (immediate and higher)
            # parent_titles is ordered [immediate_parent, grandparent, ...]
            h1_parts.append(parent_titles[-1]) # This is the highest-level menu parent (e.g., "New Car Features")
            h1_parts.append(parent_titles[0])  # This is the immediate parent (e.g., "INTRODUCTION" or "DESIGN")
        elif len(parent_titles) == 1:
            # If there's only one menu parent, it serves as both 'top' and 'immediate'
            h1_parts.append(parent_titles[0]) # The single parent (e.g., "ABBREVIATIONS" if direct child of root)
        # If parent_titles is empty (item is a direct child of the <pdf> root, like "HOME"),
        # then no parent context is added to h1_parts for the H1, matching "HOME" example.

    h1_parts.append(item_title) # Always add the item's own title at the end

    h1_text = " / ".join(filter(None, h1_parts))
    
    # Ensure h1_text is not excessively long, as per Bing's advice (~150 chars)
    if len(h1_text) > 150:
        h1_text = h1_text[:147] + "..." # Truncate and add ellipsis for very long paths

    if (h1_text == "HOME"):
        h1_text = "LC100 FACTORY SERVICE MANUAL"

    return {
        "cleanurlslug": clean_url_slug,
        "fulltitle": full_title,
        "description": description,
        "h1_text": h1_text, # Add the new H1 text field
    }
    

def build_nested_json(element, parent_titles=None):
    """
    Recursively builds a nested JSON structure mirroring the XML,
    adding SEO attributes and a unique 'id' to each node.
    """
    if parent_titles is None:
        parent_titles = []

    node = {}

    if element.tag == 'item':
        node['type'] = 'item'
        node['id'] = get_next_node_id() # Assign unique ID here
        
        title_elem = element.find('title')
        url_elem = element.find('url')
        
        if title_elem is not None:
            node['title'] = title_elem.text
        if url_elem is not None:
            # node['url'] = url_elem.text
            node['file'] = strip_url(url_elem.text)
            node['iframesrc'] = url_elem.text

        if 'title' in node and 'file' in node:
            seo_attrs = generate_seo_attributes(node['title'], parent_titles)
            node.update(seo_attrs)
        
        node['pagetype'] = set_page_type(url_elem.text)
        
        datatype_elem = element.find('datatype')
        if datatype_elem is not None:
            node['datatype'] = datatype_elem.text
        else:
            node['datatype'] = ""

    elif element.tag == 'menu':
        node['type'] = 'menu'
        node['id'] = get_next_node_id() # Assign unique ID here as well
        
        title_elem = element.find('title')
        color_elem = element.find('color')
        
        if title_elem is not None:
            node['title'] = title_elem.text
        if color_elem is not None:
            node['color'] = color_elem.text

        current_child_parents = list(parent_titles)
        if 'title' in node:
            current_child_parents.insert(0, node['title'])

        node['children'] = []
        for child_elem in element:
            child_node = build_nested_json(child_elem, current_child_parents)
            if child_node:
                node['children'].append(child_node)
    
    elif element.tag == 'pdf': # This is the root element
        node['type'] = 'root'
        node['id'] = get_next_node_id() # Assign ID to the root too, if needed
        node['children'] = []
        for child_elem in element:
            child_node = build_nested_json(child_elem, parent_titles)
            if child_node:
                node['children'].append(child_node)

    return node

# --- Main Script Execution ---
xml_file_path = 'xml/pdf.xml' 
output_json_path = 'xml/index.json'

try:
    tree = ET.parse(xml_file_path)
    root_element = tree.getroot() 

    # Reset counter for each run
    _global_node_id_counter = 0 
    nested_json_data = build_nested_json(root_element)

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(nested_json_data, f, indent=2, ensure_ascii=False)

    def count_nodes(node):
        count = 0
        if node.get('type') in ['item', 'menu', 'root']: # Count all types of nodes
            count += 1
        if 'children' in node:
            for child in node['children']:
                count += count_nodes(child)
        return count
    
    total_nodes = count_nodes(nested_json_data)
    print(f"Successfully processed {total_nodes} nodes (items and menus) and saved to {output_json_path}")

except FileNotFoundError:
    print(f"Error: The file '{xml_file_path}' was not found. Please ensure it's in the same directory as the script.")
except ET.ParseError as e:
    print(f"Error parsing XML file: {e}. Please check if '{xml_file_path}' is valid XML.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")