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

// --- REMOVED: handlePdfViewerLoad() is no longer needed.
// Its responsibilities are now handled directly by the pdfViewerIframe.onload handler in menu.js.


// --- Modified Initial Page Load Handling (loadPageFromURL) ---
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
        
        // --- UPDATED: Get PDF data from allPdfDataMap ---
        // itemData.file is the key for allPdfDataMap (e.g., "manuals/m_in_0001.pdf")
        if (currentMenuItem.file && currentMenuItem.file.endsWith('.pdf')) {
            // getPdfData is from pdf-overlay.js and assumes allPdfDataMap is loaded
            const pdfData = getPdfData(currentMenuItem.file); 
            // Update the text list of links
            loadAndDisplayPdfExtractedLinksList(pdfData.links); 
            // Overlays will be created by pdfViewerIframe.onload in menu.js once iframe content fully loads
        } else {
            console.warn(`No PDF file or valid data found in allPdfDataMap for initial page ${currentMenuItem.path}.`);
            // Clear any old link list data for non-PDFs or missing data
            loadAndDisplayPdfExtractedLinksList([]); 
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
        loadAndDisplayPdfExtractedLinksList([]); // Clear any old link list for 404
        // Also clear overlays for 404
        createPdfHotspotOverlays([], []); // Assuming createPdfHotspotOverlays is global
    }
}