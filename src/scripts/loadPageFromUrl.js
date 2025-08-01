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
    const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');
    const pageTitleElement = document.getElementById('pageTitle');
    const appHeaderTitle = document.getElementById('app-header-title');
    const pdfSeoHeading = document.getElementById('pdf-seo-heading');
    const pdfFilenameHeading = document.getElementById('pdf-filename-heading');

    const currentBrowserPath = window.location.pathname;
    const cleanedBrowserPath = currentBrowserPath.replace(/\/index\.html$/i, '/');

    let currentMenuItem = pathToItemMap.get(cleanedBrowserPath); // look for menuItem for the url
 
    if (cleanedBrowserPath === '/404.html') {  
        collapseAllMenus();
        updatePageDatafor404();
        pdfSeoHeading.textContent = "404: Page Not Found"; // set the H1 heading back to 404.
        populatePdfLinksMenu({ file: null }); // Pass object with null file for clearing
        highlightMenuItem(null); // no menu item to highlight
        window.history.replaceState(null, '404 - Page Not Found', '/404.html');
        return; // EXIT HERE to prevent any further processing and potential loop
    } else if (currentMenuItem) {
        pdfViewerIframe.contentWindow.location.replace(currentMenuItem.iframesrc);
        pdfViewerIframe.dataset.menuItemId = String(currentMenuItem.id);
        updatePageData(currentMenuItem.path);
        collapseAllMenus();
        highlightMenuItem(currentMenuItem.id);
        expandMenuPath(currentMenuItem.id); // Expand the menu to the active item
        window.history.replaceState(currentMenuItem, currentMenuItem.fulltitle, currentMenuItem.path);
        
        if (currentMenuItem.file && currentMenuItem.file.endsWith('.pdf')) {    
            populatePdfLinksMenu(currentMenuItem); // Populate with valid menu item data
        } else {
            populatePdfLinksMenu({ file: null }); // Pass object with null file for clearing
        }
    } else { // --- catach all handling for invalid URLs that are NOT already /404.html ---
        console.warn(`WARN: No matching menu item found for URL: "${cleanedBrowserPath}". Redirecting to 404 page.`);
        window.location.replace('/404.html');
    }
}