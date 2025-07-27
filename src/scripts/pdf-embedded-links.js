// File: /scripts/pdf-embedded-links.js
// This file handles loading the global PDF data cache and provides utility functions for link handling,
// including populating and toggling the new hamburger menu for document links.

let allPdfDataMap = {}; // This will store the content of pdf_links_cache.json as a map

/**
 * Fetches the combined PDF links and page data from the server.
 * This runs once when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch the single combined PDF links and page data file.
        // Ensure your web server serves this path correctly.
        const response = await fetch('/xml/pdf_links_cache.json'); 
        
        if (!response.ok) {
            // Corrected path for consistency, based on typical setup.
            throw new Error(`HTTP error! status: ${response.status} fetching /xml/pdf_links_cache.json`);
        }
        
        // This line automatically parses the JSON into a JavaScript object (map)
        allPdfDataMap = await response.json();
        console.log("All PDF data (links & page sizes) loaded:", allPdfDataMap);
        
    } catch (e) {
        console.error("Could not load all PDF data (pdf_links_cache.json):", e);
    }
});

/**
 * Retrieves the page sizes and links data for a specific PDF filename.
 * This function relies on `allPdfDataMap` being loaded.
 * @param {string} pdfFilename The relative path of the PDF (e.g., "manuals/m_in_0001.pdf").
 * @returns {object} An object containing 'page_sizes' and 'links' arrays, or empty arrays if not found.
 */
function getPdfData(pdfFilename) {
  // The pdfFilename (e.g., "manuals/m_in_0001.pdf") directly acts as the key in the map
  console.debug("Retrieving PDF data for:", pdfFilename, "from map:", allPdfDataMap);
  return allPdfDataMap[pdfFilename] || { page_sizes: [], links: [] };
}

/**
 * Populates the document links menu (the hamburger menu panel) with extracted PDF links.
 * This function will be called from `loadPageFromUrl` or `updatePageData`.
 * @param {Array<Object>} links - Array of link objects extracted from the PDF data.
 */
function populatePdfLinksMenu(links) {
    const linksList = document.getElementById('pdf-links-list'); // The <ul> inside your hamburger menu panel

    if (!linksList) {
        console.warn("PDF links list element (#pdf-links-list) not found. Cannot populate menu.");
        return; 
    }

    // Clear previous list items
    linksList.innerHTML = ''; 

    if (!links || links.length === 0) {
        const noLinksMessage = document.createElement('li');
        noLinksMessage.classList.add('no-links-message');
        noLinksMessage.textContent = 'No links found for this document.';
        linksList.appendChild(noLinksMessage);
        return;
    }

    links.forEach(link => {
        const listItem = document.createElement('li');
        const linkAnchor = document.createElement('a');
        
        // Determine the text to display for the link
        const displayText = link.text_covered || link.destination || `Link on page ${link.page_number}`;
        linkAnchor.textContent = displayText;
        
        // Add a title attribute for hover information
        linkAnchor.title = `Type: ${link.type}` + 
                          (link.text_covered ? `\nText: "${link.text_covered}"` : '') + 
                          `\nDestination: ${link.destination}` + 
                          (link.page_number ? ` (Page ${link.page_number})` : '');

        // Attach the click handler
        linkAnchor.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default browser navigation for the <a> tag
            handleEmbeddedLinkClick(link); // Call the shared handler
        });
        
        listItem.appendChild(linkAnchor);
        linksList.appendChild(listItem);
    });
}

/**
 * Handles clicks on embedded PDF links (now typically originating from the hamburger menu).
 * This function consolidates the logic for different link types.
 * @param {object} link - The link object containing type, destination, text_covered, target_page, etc.
 */
function handleEmbeddedLinkClick(link) {
    console.log("Embedded link clicked:", link);

    if (link.type === "URI") {
        window.open(link.destination, '_blank'); // Open external links in a new tab
    } else if (link.type === "Internal Page" && link.target_page) {
        // For internal page links, attempt to jump within the iframe.
        // This assumes native viewers support #page=N fragment identifiers (e.g., 'document.pdf#page=5').
        // Note: This will cause a full iframe reload, which might involve a flicker.
        const iframe = document.getElementById('pdf-viewer-iframe');
        if (iframe && link.target_page) {
            // Get the base URL of the PDF (remove any existing hash fragment)
            const currentSrc = iframe.src.split('#')[0]; 
            // Update the iframe's source to include the new page hash
            iframe.src = `${currentSrc}#page=${link.target_page}`;
            console.log(`Attempting to jump to internal page: ${link.target_page} by reloading iframe.`);
        } else {
            alert(`Internal page link to Page ${link.target_page}. Browser might not support direct jump or PDF viewer iframe element not found.`);
        }
    } else if (link.type === "Remote GoTo" && link.target_file) {
        // get the menu item
        const menuItem = fileToItemMap.get(link.target_file);
        console.debug("menuItem search and menuitem", link.target_file, menuItem);
        linkClick(menuItem.path);
        // Logic for handling links to other PDF documents within your system.
        // This would typically involve navigating your main application's routing
        // to load the new PDF associated with link.target_file.
        alert(`Remote file link clicked: ${link.target_file}` + (link.target_page ? ` (Page: ${link.target_page})` : '') + `.\n\nImplement your cross-PDF navigation here by loading the new PDF.`);
    } else {
        console.warn(`Unhandled link type: ${link.type}`, link);
        alert(`Link type "${link.type}" not yet implemented.`);
    }
}

// --- NEW: Toggle functionality for the PDF links panel ---
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('pdf-links-menu-toggle');
    const linksPanel = document.getElementById('pdf-links-panel');

    if (toggleButton && linksPanel) {
        toggleButton.addEventListener('click', () => {
            const isExpanded = linksPanel.classList.toggle('expanded'); // Toggles the 'expanded' class
            toggleButton.setAttribute('aria-expanded', isExpanded); // Update ARIA attribute for accessibility
            
            // Optional: Close panel if clicking outside (complex, consider later if needed)
            // Or if you only want it to close on second click of the button, this is enough.
        });

        // Set initial ARIA state for accessibility
        toggleButton.setAttribute('aria-expanded', false); // Panel is initially collapsed
    } else {
        console.warn("PDF links menu toggle button or panel not found. Hamburger menu won't be interactive.");
    }
});