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
            throw new Error(`HTTP error! status: ${response.status} fetching /xml/pdf_links_cache.json`);
        }
        
        // This line automatically parses the JSON into a JavaScript object (map)
        allPdfDataMap = await response.json();
        
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
  return allPdfDataMap[pdfFilename] || { page_sizes: [], links: [] };
}

/**
 * Populates the document links menu (the hamburger menu panel) with extracted PDF links.
 * This function will be called from `loadPageFromUrl` or `updatePageData`.
 * @param {object} menuItem - The menu item object for the current document.
 */
// File: /scripts/pdf-embedded-links.js

// ... (existing global variables, DOMContentLoaded for data fetch, getPdfData) ...
// ... (handleEmbeddedLinkClick function) ...

/**
 * Populates the document links menu (the hamburger menu panel) with extracted PDF links.
 * This function will be called from `loadPageFromUrl` or `updatePageData`.
 * @param {object} menuItem - The menu item object for the current document.
 */
function populatePdfLinksMenu(menuItem) {
    const srcPage = menuItem.file;
    const pdfData = getPdfData(srcPage); 
    const allLinks = pdfData.links; // Holds all links from PDF data

    const linksList = document.getElementById('pdf-links-list'); // The <ul> inside your hamburger menu panel
    const toggleButton = document.getElementById('pdf-links-menu-toggle'); // Get hamburger toggle button
    const linksPanel = document.getElementById('pdf-links-panel');       // Get hamburger panel

    if (!linksList || !toggleButton || !linksPanel) {
        console.warn("PDF links menu elements (list, toggle, or panel) not found. Cannot populate or control menu.");
        return; 
    }

    // --- RESTORED: No filtering for link types here. All types will be processed. ---
    const linksToDisplay = allLinks || []; // Use allLinks directly, ensuring it's an array

    // Clear previous list items
    linksList.innerHTML = ''; 

    // --- Hamburger visibility logic (now based on ANY links) ---
    if (linksToDisplay.length === 0) {
        // Hide the hamburger button if no links are found
        toggleButton.style.display = 'none';
        // Ensure panel is closed and aria-expanded is false
        linksPanel.classList.remove('expanded');
        toggleButton.setAttribute('aria-expanded', false);

        const noLinksMessage = document.createElement('li');
        noLinksMessage.classList.add('no-links-message');
        noLinksMessage.textContent = 'No embedded links found for this document.'; // General message
        linksList.appendChild(noLinksMessage);
        return; // Exit if no links to display, keeping button hidden
    } else if (!isMobileScreen) {
        // Show the hamburger button if any links exist
        toggleButton.style.display = 'block'; // Or 'inline-block', 'flex' based on your layout needs
    }

    // --- Add "Back to Original Page" link (if still desired and using sessionStorage) ---
    const lastNonPdfPage = sessionStorage.getItem('lastNonPdfPageUrl');
    const currentPath = window.location.pathname.replace(/\/index\.html$/i, '/');
    const currentMenuItem = typeof pathToItemMap !== 'undefined' ? pathToItemMap.get(currentPath) : null;
    const isCurrentPagePdf = currentMenuItem && currentMenuItem.file && currentMenuItem.file.endsWith('.pdf');

    if (lastNonPdfPage && lastNonPdfPage !== currentPath && isCurrentPagePdf) {
        const backListItem = document.createElement('li');
        const backLinkAnchor = document.createElement('a');
        backLinkAnchor.textContent = '« Back to Original Page';
        backLinkAnchor.href = lastNonPdfPage; 
        backLinkAnchor.addEventListener('click', (event) => {
            event.preventDefault(); 
            window.location.href = lastNonPdfPage; 
            // Close hamburger on menu item click (for "Back" link too)
            linksPanel.classList.remove('expanded');
            toggleButton.setAttribute('aria-expanded', false);
        });
        backListItem.appendChild(backLinkAnchor);
        linksList.appendChild(backListItem); 
        
        const separator = document.createElement('li');
        separator.classList.add('separator'); 
        linksList.appendChild(separator);
    }


    // Now loop through ALL link types to populate the menu
    linksToDisplay.forEach(link => { // Using linksToDisplay (which is all links)
        const listItem = document.createElement('li');
        const linkAnchor = document.createElement('a');
        
        // Determine the text to display for the link, now including link type for understanding
        const displayText = link.text_covered || link.destination || `Link on page ${link.page_number}`;
        linkAnchor.textContent = `[${link.type}] ${displayText}`; // Prepend link type for debugging
        
        // Add a title attribute for hover information
        linkAnchor.title = `Type: ${link.type}` + 
                          (link.text_covered ? `\nText: "${link.text_covered}"` : '') + 
                          `\nDestination: ${link.destination}` + 
                          (link.page_number ? ` (Page ${link.page_number})` : '');

        // Attach the click handler
        linkAnchor.addEventListener('click', (event) => {
            event.preventDefault(); 
            handleEmbeddedLinkClick(link); 
            // Close hamburger on menu item click
            linksPanel.classList.remove('expanded');
            toggleButton.setAttribute('aria-expanded', false);
        });
        
        listItem.appendChild(linkAnchor);
        linksList.appendChild(listItem);
    });
}

// ... (rest of pdf-embedded-links.js including handleEmbeddedLinkClick and DOMContentLoaded listener) ...

/**
 * Handles clicks on embedded PDF links (now typically originating from the hamburger menu).
 * This function consolidates the logic for different link types.
 * @param {object} link - The link object containing type, destination, text_covered, target_page, etc.
 */
function handleEmbeddedLinkClick(link) {

    if (link.type === "URI") {
        window.open(link.destination, '_blank'); // Open external links in a new tab
    } else if (link.type === "Internal Page" && link.target_page) {
        // For internal page links, attempt to jump within the iframe.
        const iframe = document.getElementById('pdf-viewer-iframe');
        if (iframe && link.target_page) {
            const currentSrc = iframe.src.split('#')[0];
            iframe.src = `${currentSrc}#page=${link.target_page}`;
            console.warn(`Attempting to jump to internal page: ${link.target_page} by reloading iframe.`);
        } else {
            alert(`Internal page link to Page ${link.target_page}. Browser might not support direct jump or PDF viewer iframe element not found.`);
        }
    } else if (link.type === "Remote GoTo" && link.target_file) {
        // get the menu item
        // Ensure fileToItemMap is globally accessible (e.g., from menu.js)
        if (typeof fileToItemMap !== 'undefined') {
            const menuItem = fileToItemMap.get(link.target_file);
            if (menuItem && typeof linkClick === 'function') { // Check if linkClick exists
                linkClick(menuItem.path); // Use the linkClick function (from menu.js) to navigate
            } else {
                console.warn(`Could not find menu item for remote file: ${link.target_file} or linkClick function is not available.`);
                alert(`Remote file link clicked: ${link.target_file}. Could not navigate to the target document.`);
            }
        } else {
            console.warn("fileToItemMap is not defined. Cannot handle Remote GoTo link.");
            alert(`Remote file link clicked: ${link.target_file}. fileToItemMap is not defined, cannot navigate.`);
        }
    } else if (link.type === "Named Destination") {
        alert(`Link type "${link.type}" is not fully implemented.  Try clicking on the embedded link and it make take you to the page`);
    } else {
        console.warn(`Unhandled link type: ${link.type}`, link);
        alert(`Link type "${link.type}" not yet implemented.`);
    }
}

// --- Toggle functionality for the PDF links panel ---
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('pdf-links-menu-toggle');
    const linksPanel = document.getElementById('pdf-links-panel');

    if (toggleButton && linksPanel) {
        toggleButton.addEventListener('click', () => {
            const isExpanded = linksPanel.classList.toggle('expanded'); // Toggles the 'expanded' class
            toggleButton.setAttribute('aria-expanded', isExpanded); // Update ARIA attribute for accessibility
        });

        // Set initial ARIA state for accessibility (panel is initially collapsed)
        toggleButton.setAttribute('aria-expanded', false); 
        // Initial visibility (display: none) should be handled by CSS.
        // populatePdfLinksMenu will control display: block/none based on links found.
    } else {
        console.warn("PDF links menu toggle button or panel not found. Hamburger menu won't be interactive.");
    }
});