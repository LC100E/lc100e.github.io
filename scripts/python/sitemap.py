import xml.etree.ElementTree as ET
from urllib.parse import quote
from datetime import datetime

# Base URL for your GitHub Pages site
BASE_URL = "https://lc100e.github.io/index.html"

# Current date for lastmod (ISO 8601 format)
CURRENT_DATE = datetime.now().strftime('%Y-%m-%d')

# Parse pdf.xml
tree = ET.parse('xml/pdf.xml')  # Adjust path if needed
root = tree.getroot()

# Start sitemap XML
sitemap = ['<?xml version="1.0" encoding="UTF-8"?>']
sitemap.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

# Add the homepage
sitemap.append('  <url>')
sitemap.append(f'    <loc>{BASE_URL}</loc>')
sitemap.append(f'    <lastmod>{CURRENT_DATE}</lastmod>')
sitemap.append('    <changefreq>monthly</changefreq>')
sitemap.append('    <priority>1.0</priority>')
sitemap.append('  </url>')

# Process each <url> in pdf.xml
for item in root.findall('.//item'):
    url_elem = item.find('url')
    if url_elem is not None:
        url_value = url_elem.text
        # Encode the full URL value as the page parameter
        encoded_page = quote(url_value, safe='')  # quote is equivalent to encodeURIComponent
        page_url = f"{BASE_URL}?page={encoded_page}"

        sitemap.append('  <url>')
        sitemap.append(f'    <loc>{page_url}</loc>')
        sitemap.append(f'    <lastmod>{CURRENT_DATE}</lastmod>')
        sitemap.append('    <changefreq>monthly</changefreq>')
        sitemap.append('    <priority>0.8</priority>')
        sitemap.append('  </url>')

# Close sitemap XML
sitemap.append('</urlset>')

# Write to sitemap.xml
with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sitemap))

print("sitemap.xml has been generated successfully.")