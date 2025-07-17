import xml.etree.ElementTree as ET
import json
import re
import textwrap # Import the textwrap module

# Global counter for unique IDs, mimicking client-client-side `linkid`
_global_node_id_counter = 0

def get_next_node_id():
    """Increments and returns a unique ID for each node."""
    global _global_node_id_counter
    _global_node_id_counter += 1
    return _global_node_id_counter


def sanitize_for_slug(text):
    """Converts text to a URL-friendly slug. Restored to original logic."""
    if not text: # Added check for None or empty string input
        return ""
    text = str(text).lower()
    text = re.sub(r'-+', '', text) # remove hyphens
    text = re.sub(r'\s+', '-', text) # Replace spaces with single hyphen
    text = re.sub(r'[^a-z0-9-]', '', text) # Remove non-alphanumeric chars except hyphens
    # text = re.sub(r'-+', '-', text) # Replace multiple hyphens with single
    text = text.strip('-') # Remove leading/trailing hyphens
    return text

def generate_seo_attributes(item_title, parent_titles):
    """
    Generates cleanurlslug, fulltitle, description, and h1_text for an item.
    Cleanurlslug format: ID-ParentSlug-TitleSlug, ensuring uniqueness.
    """

    # 1. Generate cleanurlslug (Restored to original logic)
    title_slug = sanitize_for_slug(item_title)
    
    # Ensure parent_titles has at least one element before trying to access [-1]
    # If parent_titles is empty, parent_title_slug will be an empty string
    parent_title_slug = sanitize_for_slug(parent_titles[-1]) if parent_titles else ""

    # The cleanurlslug now includes the global node ID for uniqueness.
    # It directly uses the _global_node_id_counter's value at the time this item is processed.
    clean_url_slug = f"{parent_title_slug}-{title_slug}-{_global_node_id_counter}"
    
    # Handle cases where title_slug or parent_title_slug might make it empty initially
    if not title_slug and not parent_title_slug: # If both are empty, default it
        clean_url_slug = "untitled-page"

    # Specific handling for HOME
    if item_title == "HOME" :
        clean_url_slug = "home"

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
    
    if parent_titles:
        if len(parent_titles) >= 2:
            h1_parts.append(parent_titles[-1])
            h1_parts.append(parent_titles[0])
        elif len(parent_titles) == 1:
            h1_parts.append(parent_titles[0])

    h1_parts.append(item_title)

    h1_text = " / ".join(filter(None, h1_parts))
    
    if len(h1_text) > 150:
        h1_text = h1_text[:147] + "..."

    if (h1_text == "HOME"):
        h1_text = "LC100 FACTORY SERVICE MANUAL"

    return {
        "cleanurlslug": clean_url_slug,
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
            node['file'] = strip_url(url_elem.text)
            node['iframesrc'] = url_elem.text

        if 'title' in node and 'file' in node:
            seo_attrs = generate_seo_attributes(node['title'], parent_titles)
            node.update(seo_attrs)
        
        # Ensure cleanurlslug is correctly generated and assigned here based on node's final title/id
        # The cleanurlslug needs to be unique and consistent with what JS expects for lookup.
        # If SEO attributes are generated per item, cleanurlslug is set there.
        
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

        current_child_parents = list(parent_titles)
        if 'title' in node:
            current_child_parents.insert(0, node['title']) # Add current menu's title to parent path

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

def _escape_js_string_for_html_attr(js_string):
    """Escapes a string so it can be safely embedded as a JavaScript string literal in an HTML attribute."""
    # json.dumps handles basic escaping (like quotes), then replace ' for HTML attribute safety
    return json.dumps(js_string, ensure_ascii=False).replace("'", "&#39;").replace('"', '&quot;')


# Note: The _escape_js_string_for_html_attr function has been removed entirely
# from the script, as it's no longer needed for the simplified onclick.

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
        
        # Get the cleanurlslug directly. It's assumed to be clean and safe for direct insertion.
        cleanurlslug_value = node.get("cleanurlslug", "")
        
        item_link_classes = f"item-link {node.get('datatype', '')}".strip()

        # Add id="link-{node_id}" to the <a> tag
        # onclick uses single quotes for the attribute, and double quotes for the JS string literal.
        # This is safe because cleanurlslug_value is already sanitized and won't contain " or '.
        html_parts.append(f'{indent}    <a id="link-{node_id}" onclick=\'linkClick("{cleanurlslug_value}"); return false;\' title="{node_title}" class="{item_link_classes}">')
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


# --- Main Script Execution ---
xml_file_path = 'xml/pdf.xml'
output_json_path = 'xml/index.json'
output_menu_html_path = 'menu.html'

if __name__ == "__main__":
    print(f"Script started: Attempting to parse XML and generate data.")
    
    # 1. Generate JSON from XML
    print(f"Generating JSON from {xml_file_path}...")
    
    # Reset global ID counter for a clean run each time the script is executed
    _global_node_id_counter = 0 
    
    try:
        tree = ET.parse(xml_file_path)
        root_element = tree.getroot()
        nested_json_data = build_nested_json(root_element)

        print("XML parsed and nested JSON data built.")

        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(nested_json_data, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved JSON data to {output_json_path}")

    except FileNotFoundError:
        print(f"Error: XML input file not found at {xml_file_path}. Please ensure it exists.")
        nested_json_data = None # Prevent subsequent steps if XML failed
    except ET.ParseError as e:
        print(f"Error parsing XML file {xml_file_path}: {e}. Please check if it's valid XML.")
        nested_json_data = None
    except Exception as e:
        print(f"An unexpected error occurred during JSON generation: {e}")
        nested_json_data = None

    # 2. Generate HTML from JSON (if JSON was successfully generated)
    if nested_json_data:
        print(f"Generating HTML from JSON data to {output_menu_html_path}...")
        generated_html_body = generate_html_from_json(nested_json_data)
        
        comment_block = textwrap.dedent("""\
            <!--
                this file is generated by python along with index.json
            -->
        \n\n""") # Added extra newline for separation

        final_menu_html_content = comment_block + generated_html_body

        # print("\n--- First 300 characters of HTML content to be written: ---")
        # print(final_menu_html_content[:300]) # Uncomment for debugging
        # print("----------------------------------------------------------\n")

        try:
            with open(output_menu_html_path, 'w', encoding='utf-8') as f:
                f.write(final_menu_html_content)
            print(f"Successfully generated menu HTML: {output_menu_html_path}")
        except IOError as e:
            print(f"Error writing HTML to {output_menu_html_path}: {e}")
    else:
        print("HTML generation skipped due to previous JSON generation failure.")

    print("Menu generation process completed.")