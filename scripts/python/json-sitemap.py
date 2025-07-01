import json
from datetime import datetime
from urllib.parse import urljoin # For safely joining base URL with relative cleanUrlSlug

# --- Configuration ---
# Base URL for your GitHub Pages site.
# This should be the root of your site (e.g., "https://lc100e.github.io/"),
# as cleanUrlSlug is expected to be a relative path (e.g., "/some/path/doc.html").
BASE_URL = "https://lc100e.github.io/"

# Path to your generated menu_data.json file
MENU_DATA_PATH = 'xml/menu_data.json'
# Output sitemap file name
SITEMAP_OUTPUT_PATH = 'sitemap.xml'

# Current date for lastmod (ISO 8601 format)
CURRENT_DATE = datetime.now().strftime('%Y-%m-%d')

# --- Helper Function (No longer directly used for sitemap URL construction,
#                      but kept in case cleanUrlSlug is generated using it elsewhere) ---


# --- Function to collect URLs from nested JSON ---
def collect_urls_from_menu_data(node, urls_list):
    """
    Recursively collects URL information from the nested menu_data JSON structure.
    It now uses the 'cleanurlslug' property directly to form the sitemap entry URL.
    """
    if node.get('type') == 'item':
        clean_url_slug = node.get('cleanurlslug')
        
        if clean_url_slug:
            # Use urljoin to safely combine the BASE_URL with the relative clean_url_slug.
            # This handles cases where clean_url_slug might start with '/' or not,
            # and ensures correct slashes between BASE_URL and the path.
            full_item_url = urljoin(BASE_URL, clean_url_slug)
            urls_list.append(full_item_url)
            
    # Recursively process children if they exist
    if 'children' in node:
        for child in node['children']:
            collect_urls_from_menu_data(child, urls_list)

# --- Main Script Logic ---
if __name__ == "__main__":
    try:
        # 1. Load the menu_data.json file
        with open(MENU_DATA_PATH, 'r', encoding='utf-8') as f:
            menu_data = json.load(f)

        # 2. Collect all item URLs by traversing the nested JSON
        all_item_urls = []
        # Assuming menu_data is the root object (e.g., {'type': 'root', 'id': 1, 'children': [...]})
        collect_urls_from_menu_data(menu_data, all_item_urls)

        # 3. Start sitemap XML generation
        sitemap_content = []
        sitemap_content.append('<?xml version="1.0" encoding="UTF-8"?>')
        sitemap_content.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

        # Add the homepage explicitly
        # This is the base URL without any specific path or parameters.
        sitemap_content.append('  <url>')
        sitemap_content.append(f'    <loc>{BASE_URL}</loc>') # Links to the site root (e.g., https://lc100e.github.io/)
        sitemap_content.append(f'    <lastmod>{CURRENT_DATE}</lastmod>')
        sitemap_content.append('    <changefreq>daily</changefreq>') # Homepage might be updated more often
        sitemap_content.append('    <priority>1.0</priority>')
        sitemap_content.append('  </url>')

        # Add all collected item URLs from cleanurlslug
        for url in all_item_urls:
            sitemap_content.append('  <url>')
            sitemap_content.append(f'    <loc>{url}</loc>')
            sitemap_content.append(f'    <lastmod>{CURRENT_DATE}</lastmod>')
            sitemap_content.append('    <changefreq>weekly</changefreq>') # Individual pages might change less often
            sitemap_content.append('    <priority>0.8</priority>')
            sitemap_content.append('  </url>')

        # 4. Close sitemap XML
        sitemap_content.append('</urlset>')

        # 5. Write to sitemap.xml
        with open(SITEMAP_OUTPUT_PATH, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sitemap_content))

        print(f"sitemap.xml has been generated successfully with {len(all_item_urls) + 1} URLs (including homepage).")

    except FileNotFoundError:
        print(f"Error: The file '{MENU_DATA_PATH}' was not found. Please ensure it's in the same directory as the script.")
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{MENU_DATA_PATH}'. Please check if it's valid JSON.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")