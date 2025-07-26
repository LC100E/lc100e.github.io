let allPdfDataMap = {}; // This will store the content of pdf_links_cache.json as a map

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch the single combined PDF links and page data file
        // Ensure your web server serves this path correctly.
        const response = await fetch('/xml/pdf_links_cache.json'); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} fetching /build_cache/pdf_links_cache.json`);
        }
        
        // This line automatically parses the JSON into a JavaScript object (map)
        allPdfDataMap = await response.json();
        console.log("All PDF data (links & page sizes) loaded:", allPdfDataMap);
        
        // No need to call handlePageLoad() here directly; 
        // menu.js's DOMContentLoaded will handle initial page load
        
    } catch (e) {
        console.error("Could not load all PDF data (pdf_links_cache.json):", e);
    }
});

/**
 * Retrieves the page sizes and links data for a specific PDF.
 * @param {string} pdfFilename The relative path of the PDF (e.g., "manuals/m_in_0001.pdf").
 * @returns {object} An object containing 'page_sizes' and 'links' arrays, or empty arrays if not found.
 */
function getPdfData(pdfFilename) {
    // The pdfFilename (e.g., "manuals/m_in_0001.pdf") directly acts as the key
    return allPdfDataMap[pdfFilename] || { page_sizes: [], links: [] };
}


// --- Functions for Displaying Extracted PDF Links (as a list) ---
// CONSOLIDATED function: This will now be the ONLY loadAndDisplayPdfExtractedLinksList
// It accepts the 'links' array directly from the getPdfData call.
function loadAndDisplayPdfExtractedLinksList(links) { // Accepts links as an argument
    const linksContainer = document.getElementById('extracted-pdf-links-container');
    const linksList = document.getElementById('pdf-links-list');

    if (!linksContainer || !linksList) {
        // console.warn removed; no need for warning if elements aren't always present
        return; 
    }

    // Clear previous list items
    linksList.innerHTML = ''; 

    if (links && links.length > 0) {
        links.forEach(link => {
            const listItem = document.createElement('li');
            const anchor = document.createElement('a');
            
            anchor.classList.add('extracted-pdf-link');

            let linkText = link.text_covered || `Link on page ${link.page_number}`;
            if (link.type === "URI") {
                linkText = link.text_covered || link.destination;
            } else if (link.type === "Internal Page" && link.target_page) {
                 linkText = link.text_covered || `Go to Page ${link.target_page}`;
            } else if (link.type === "Remote GoTo" && link.target_file) {
                linkText = link.text_covered || `Go to ${link.target_file} Page ${link.target_page || ''}`;
            }
            anchor.textContent = linkText;

            // Basic list item link handling (separate from overlay click)
            if (link.type === "URI") {
                anchor.href = link.destination;
                anchor.target = "_blank";
                anchor.rel = "noopener noreferrer";
                anchor.title = `External link: ${link.destination}`;
            } else {
                anchor.href = "javascript:void(0)"; // Make it non-navigable by default if no clear path
                anchor.title = `Embedded PDF Link: ${link.destination}`;
                anchor.onclick = function() {
                    // Assuming handleOverlayLinkClick is defined elsewhere or in this file
                    handleOverlayLinkClick(link); 
                };
            }
            
            listItem.appendChild(anchor);
            linksList.appendChild(listItem);
        });
        linksContainer.style.display = 'block'; 
    } else {
        linksContainer.style.display = 'none'; 
    }
}


// --- Functions for Transparent Clickable Overlays (Hotspots) ---
// UPDATED to accept 'links' AND 'pageSizes' arrays
function createPdfHotspotOverlays(links, pageSizes) { // Now accepts both links and pageSizes
    const iframe = document.getElementById('pdf-viewer-iframe');
    const overlayContainer = document.getElementById('pdf-hotspot-overlay');

    if (!iframe || !overlayContainer) {
        console.warn("Required elements for PDF hotspots not found (pdf-viewer-iframe or pdf-hotspot-overlay). Skipping overlay creation.");
        return; 
    }

    overlayContainer.innerHTML = ''; // Clear existing hotspots
    overlayContainer.style.display = 'none';

    if (!links || links.length === 0 || !pageSizes || pageSizes.length === 0) {
        console.log("No extracted PDF links or page size data provided for overlays. No hotspots will be created.");
        return;
    }

    const iframeWidth = iframe.clientWidth;
    const iframeHeight = iframe.clientHeight;
    // console.log(`Debug: Iframe dimensions: ${iframeWidth}x${iframeHeight}`); // Keep for debugging if needed

    // Retrieve the native dimensions of the *first* page as a general reference for scaling.
    // Assuming uniform page sizes or scaling based on the first page, if PDF viewer scales consistently.
    // For more advanced scenarios, you might need to determine the *current* page in the iframe
    // and use its specific dimensions.
    const pdfNativeWidth = pageSizes[0].width;
    const pdfNativeHeight = pageSizes[0].height;

    // Calculate scaling factor based on iframe dimensions and PDF's native dimensions
    const actualScale = Math.min(iframeWidth / pdfNativeWidth, iframeHeight / pdfNativeHeight);
    const renderedPdfWidth = pdfNativeWidth * actualScale;
    const renderedPdfHeight = pdfNativeHeight * actualScale;

    // Calculate offsets to center the PDF within the iframe
    const offsetX = (iframeWidth - renderedPdfWidth) / 2;
    const offsetY = (iframeHeight - renderedPdfHeight) / 2;

    links.forEach(link => {
        // Ensure link has text_area coordinates
        if (!link.text_area || link.text_area.length !== 4) {
            console.warn("Skipping link due to missing or invalid text_area:", link);
            return;
        }

        const [x0, y0, x1, y1] = link.text_area;
        
        // PDF coordinates usually have (0,0) at bottom-left, CSS at top-left.
        // Convert PDF Y-coordinate to CSS Y-coordinate
        const cssY0 = pdfNativeHeight - y1; // Top-left Y for CSS

        // Apply scaling and offset
        const hotspotLeft = (x0 * actualScale) + offsetX;
        const hotspotTop = (cssY0 * actualScale) + offsetY;
        const hotspotWidth = (x1 - x0) * actualScale;
        const hotspotHeight = (y1 - y0) * actualScale; // Height remains same after Y-inversion

        if (hotspotWidth <= 0 || hotspotHeight <= 0 || isNaN(hotspotLeft) || isNaN(hotspotTop)) {
            console.warn(`Warning: Skipping hotspot creation for link due to invalid calculated dimensions or position:`, {link, hotspotWidth, hotspotHeight, hotspotLeft, hotspotTop});
            return;
        }

        const hotspot = document.createElement('div');
        hotspot.classList.add('pdf-hotspot');
        hotspot.style.left = `${hotspotLeft}px`;
        hotspot.style.top = `${hotspotTop}px`;
        hotspot.style.width = `${hotspotWidth}px`;
        hotspot.style.height = `${hotspotHeight}px`;

        hotspot.onclick = (event) => {
            event.stopPropagation();
            event.preventDefault();
            // Assuming handleOverlayLinkClick is defined elsewhere or in this file
            handleOverlayLinkClick(link); 
        };
        hotspot.title = `Type: ${link.type}` + (link.text_covered ? `\nText: "${link.text_covered}"` : '') + `\nDestination: ${link.destination}` + (link.page_number ? ` (Page ${link.page_number})` : '');

        overlayContainer.appendChild(hotspot);
    });

    overlayContainer.style.display = 'block';
    console.log(`Debug: Created ${links.length} PDF hotspots.`);
}

// Ensure handleOverlayLinkClick is defined if it's used by your list/hotspots
// Placeholder if it's not defined elsewhere:
function handleOverlayLinkClick(link) {
    console.log("Overlay link clicked:", link);
    // Add your logic here to navigate based on link.type and link.destination/target_page/target_file
    if (link.type === "URI") {
        window.open(link.destination, '_blank');
    } else if (link.type === "Internal Page" && link.target_page) {
        // Logic to navigate PDF viewer to specific page
        alert(`Maps PDF viewer to internal page: ${link.target_page}`);
        // You'll need to interact with the iframe's contentWindow
        // For example: document.getElementById('pdf-viewer-iframe').contentWindow.location.hash = `#page=${link.target_page}`;
    } else if (link.type === "Remote GoTo" && link.target_file && link.target_page) {
        // Logic to navigate to another PDF in your system
        alert(`Maps to remote PDF: ${link.target_file} page: ${link.target_page}`);
        // This might involve calling your main menu.js's linkClick function
        // You'd need a way to map 'link.target_file' back to an 'item.path' from index.json
    }
}