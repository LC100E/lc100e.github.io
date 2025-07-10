import json
from xml.etree.ElementTree import Element, SubElement, tostring
import xml.etree.ElementTree as ET
from xml.dom import minidom # For pretty printing the XML

# def prettify(elem):
#     """Return a pretty-printed XML string for the Element."""
#     rough_string = tostring(elem, 'utf-8', short_empty_elements=False) # Ensure empty tags are <tag></tag> for clarity
#     reparsed_document = minidom.parseString(rough_string)
#     # return reparsed_document.toprettyxml(indent="  ", encoding="iso-8859-1").decode('iso-8859-1') # Match original encoding
#     return rough_string.decode('iso-8859-1')  # Return as a string in the original encoding


""" custom formatting of XML output   """
def format_xml_node(element, indent_level=0):
    """
    Recursively formats an XML element based on custom rules.

    Args:
        element (xml.etree.ElementTree.Element): The current XML element to format.
        indent_level (int): The current indentation level.

    Returns:
        str: The formatted XML string for the current element and its children.
    """
    indent_str = "  " * indent_level
    output_lines = []

    # Handle the root <pdf> element
    if element.tag == "pdf":
        output_lines.append(f"{indent_str}<{element.tag}>")
        for child in element:
            # Children of <pdf> (like <item> or <menu>) are indented one level
            output_lines.append(format_xml_node(child, indent_level + 1))
        output_lines.append(f"{indent_str}</{element.tag}>")
        return "\n".join(output_lines)

    # Handle <menu> elements
    elif element.tag == "menu":
        output_lines.append(f"{indent_str}<{element.tag}>")
        inner_indent_str = "  " * (indent_level + 1)

        # Extract specific children (<id>, <title>, <color>) for inline formatting
        # Iterate through a copy or filter, as we don't want to modify during iteration
        all_children = list(element) # Get all children
        inline_children_parts = []
        block_children = [] # For <item> or nested <menu>

        # Collect <id>, <title>, <color> for inline display
        id_elem = None
        title_elem = None
        color_elem = None

        for child in all_children:
            if child.tag == "id":
                id_elem = child
            elif child.tag == "title":
                title_elem = child
            elif child.tag == "color":
                color_elem = child
            else:
                block_children.append(child) # These will be formatted on new lines

        # Append inline elements: <id>, <title>, <color> if they exist
        if id_elem is not None:
            inline_children_parts.append(f"<id>{id_elem.text if id_elem.text is not None else ''}</id>")
        if title_elem is not None:
            inline_children_parts.append(f"<title>{title_elem.text if title_elem.text is not None else ''}</title>")
        if color_elem is not None:
            inline_children_parts.append(f"<color>{color_elem.text if color_elem.text is not None else ''}</color>")

        if inline_children_parts:
            # These are children of <menu>, so they are indented relative to <menu>
            output_lines.append(f"{inner_indent_str}{''.join(inline_children_parts)}")

        # Recursively process other children (typically <item> or nested <menu>)
        # Each of these will be on a new line, indented one more level
        for child in block_children:
            output_lines.append(format_xml_node(child, indent_level + 1))

        output_lines.append(f"{indent_str}</{element.tag}>")
        return "\n".join(output_lines)

    # Handle <item> elements - entire tag on one line
    elif element.tag == "item":
        item_content_parts = []
        item_content_parts.append(f"<{element.tag}>")
        for child in element:
            # All children of <item> are part of its single-line content
            text_content = child.text if child.text is not None else ''
            item_content_parts.append(f"<{child.tag}>{text_content}</{child.tag}>")
        item_content_parts.append(f"</{element.tag}>")
        # Item itself is indented relative to its parent's children (e.g., within <menu>)
        return f"{indent_str}{''.join(item_content_parts)}"

    # Default handling for any other unexpected tags (e.g., if <id> appears directly as a child of <pdf> etc.)
    # This part might need adjustment if your XML structure is more varied.
    else:
        text_content = element.text if element.text is not None else ''
        # Assume these are simple tags that can be on one line, indented
        return f"{indent_str}{'  '}<{element.tag}>{text_content}</{element.tag}>"



def json_to_xml(json_data, parent_element=None):
    """
    Recursively converts a JSON dictionary (representing a node in the tree)
    into an XML Element, using nested elements for all properties.
    """
    node_type = json_data.get("type")
    current_element = None

    # Determine XML tag name based on JSON 'type'
    if node_type == "root":
        # The root of your original XML was <pdf>
        current_element = Element("pdf")
    elif node_type == "menu":
        current_element = SubElement(parent_element, "menu")
        # Add properties as sub-elements
        # if "id" in json_data:
        #     SubElement(current_element, "id").text = str(json_data["id"])
        if "title" in json_data:
            SubElement(current_element, "title").text = json_data["title"]
        if "color" in json_data:
            SubElement(current_element, "color").text = str(json_data["color"]) # Color was an element in original XML
    elif node_type == "item":
        current_element = SubElement(parent_element, "item")
        # Add properties as sub-elements
        # if "id" in json_data:
        #     SubElement(current_element, "id").text = str(json_data["id"])
        if "title" in json_data:
            SubElement(current_element, "title").text = json_data["title"]
        # 'file' in JSON maps to 'url' in original XML
        if "file" in json_data:
            SubElement(current_element, "url").text = json_data["file"]

        # Include other new properties from JSON as elements to preserve data
        # These were not in your original XML but are in your JSON
        # if "cleanurlslug" in json_data:
        #     SubElement(current_element, "cleanurlslug").text = json_data["cleanurlslug"]
        # if "fulltitle" in json_data:
        #     SubElement(current_element, "fulltitle").text = json_data["fulltitle"]
        # if "description" in json_data:
        #     SubElement(current_element, "description").text = json_data["description"]
        if "servinghtml" in json_data:
            SubElement(current_element, "servinghtml").text = json_data["servinghtml"]
        if "datatype" in json_data:
            SubElement(current_element, "datatype").text = json_data["datatype"]
    else:
        print(f"Warning: Unknown node type '{node_type}'. Skipping.")
        return None

    # Recursively process children
    if "children" in json_data and isinstance(json_data["children"], list):
        for child_json in json_data["children"]:
            json_to_xml(child_json, current_element)

    return current_element


# open json file

JSON_FILE = 'xml/index.json'
# 1. Load the menu_data.json file
try:
  with open(JSON_FILE, 'r', encoding='utf-8') as f:
      json_data = json.load(f)
except FileNotFoundError:
    print(f"Error: The file '{JSON_FILE}' was not found. Please ensure it's in the same directory as the script.")
except json.JSONDecodeError:
    print(f"Error: Could not decode JSON from '{JSON_FILE}'. Please check if it's valid JSON.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

# 2. Generate the XML
root_element = json_to_xml(json_data)

# 3. Format the XML with custom rules
if root_element is not None:
    pretty_xml_string = format_xml_node(root_element, 0)

# 4. Save the formatted XML to a file
with open("output_menu_data_elements.xml", "w", encoding="utf-8") as f: # Specify encoding
    f.write(pretty_xml_string)
print("\nXML saved to output_menu_data_elements.xml")
