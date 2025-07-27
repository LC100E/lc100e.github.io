console.warn("--> loadPageFromUrl.js: Script started loading.");

// Ensure getPdfData, loadAndDisplayPdfExtractedLinksList, and other common functions
// (updatePageData, highlightMenuItem, pathToItemMap, fileToItemMap, etc.) are globally accessible
// or imported/defined in a way that loadPageFromUrl.js can see them.
// Typically, menu.js and pdf-overlay.js would load before this script.

// Helper function to find a node and its parents for expansion
function findNodeAndParents(targetId, nodes = menuJsonData.children, parentNodes = []) {
    for (const node of nodes) {
        if (node.id == targetId) { // Use == for potential type coercion (string vs number)
            return { foundNode: node, parents: parentNodes };
        }
        if (node.children && node.children.length > 0) {
            const result = findNodeAndParents(targetId, node.children, [...parentNodes, node]);
            if (result.foundNode) {
                return result;
            }
        }
    }
    return { foundNode: null, parents: [] };
}

// Function to expand the menu path to a given node ID
// This function relies on global/accessible collapseAllMenus() and ViewTree()
function expandMenuPath(targetNodeId) {
    const { foundNode, parents } = findNodeAndParents(targetNodeId);
    if (!foundNode) {
        console.warn(`Node with ID ${targetNodeId} not found for menu expansion.`);
        return;
    }

    parents.forEach(parentNode => {
        const listItem = document.getElementById(`node-${parentNode.id}`);
        if (listItem && listItem.classList.contains('collapsed')) {
            ViewTree(parentNode.id); // Call ViewTree to expand if collapsed
        }
    });

    highlightMenuItem(targetNodeId);

    const targetListItem = document.getElementById(`node-${targetNodeId}`);
    if (targetListItem) {
        if (targetListItem.classList.contains('menu-node') && targetListItem.classList.contains('collapsed')) {
            ViewTree(targetNodeId);
        }
        targetListItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// --- Handles the intial page load for index and any pasted url ---
async function loadPageFromUrl() {
    console.warn("--> in function loadPageFromUrl");

    const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');
    const currentBrowserPath = window.location.pathname;
    const cleanedBrowserPath = currentBrowserPath.replace(/\/index\.html$/i, '/');
    let currentMenuItem = pathToItemMap.get(cleanedBrowserPath); // pathToItemMap from menu.js

    if (currentMenuItem) {
        if (pdfViewerIframe && pdfViewerIframe.contentWindow) {
            pdfViewerIframe.contentWindow.location.replace(currentMenuItem.iframesrc);
            pdfViewerIframe.dataset.menuItemId = String(currentMenuItem.id);
        }
        updatePageData(currentMenuItem.path); // Assuming updatePageData is global
        highlightMenuItem(currentMenuItem.id); // Assuming highlightMenuItem is global
        window.history.replaceState(currentMenuItem, currentMenuItem.fulltitle, currentMenuItem.path);
        
        // --- UPDATED LOGIC FOR PDF LINKS ---
        // itemData.file is the key for allPdfDataMap (e.g., "manuals/m_in_0001.pdf")
        if (currentMenuItem.file && currentMenuItem.file.endsWith('.pdf')) {    
            // getPdfData is from pdf-embedded-links.js (or pdf-data-utils.js)
            const pdfData = getPdfData(currentMenuItem.file); 
            console.debug("LOADPAGEFROMURL, current menu item file:", currentMenuItem.file);
            console.debug("LOADPAGEFROMURL, pdfData (links):", pdfData.links);
            
            // NEW: Populate the hamburger menu with extracted PDF links
            // populatePdfLinksMenu is from pdf-links-menu.js
            populatePdfLinksMenu(pdfData.links); 
            console.debug("LOADPAGEFROMURL, links passed to menu:", pdfData.links);

            // The calls to loadAndDisplayPdfExtractedLinksList and createPdfHotspotOverlays
            // are REMOVED entirely as they are no longer required.

        } else {
            console.warn(`No PDF file or valid data found for initial page ${currentMenuItem.path}. Clearing PDF links menu.`);
            // Clear the links menu for non-PDFs or missing data
            populatePdfLinksMenu([]); 
        }
        console.debug(`loadPageFromURL: Initial load for path "${cleanedBrowserPath}". Iframe content set to: "${currentMenuItem.iframesrc}"`);

        // Also expand the menu to the current item
        if (currentMenuItem.id) {
            expandMenuPath(currentMenuItem.id); // Expand the menu to the active item
        }

    } else {
        console.warn(`WARN: No matching menu item found for initial URL: "${cleanedBrowserPath}". Displaying 404 content.`);
        updatePageDatafor404(cleanedBrowserPath); // Assuming this is global
        highlightMenuItem(null); 
        window.history.replaceState(null, '404 - Page Not Found', cleanedBrowserPath);
        if (pdfViewerIframe && pdfViewerIframe.contentWindow) {
            pdfViewerIframe.contentWindow.location.replace('/404-iframe-content.html');
        }
        // Clear the links menu for 404 pages as well
        populatePdfLinksMenu([]); 
    }
}