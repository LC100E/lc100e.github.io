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

    // Ensure essential DOM elements exist before proceeding
    if (!pdfViewerIframe || !pageTitleElement || !appHeaderTitle || !pdfSeoHeading || !pdfFilenameHeading) {
        console.error("Critical DOM elements for page loading not found! Aborting loadPageFromUrl.");
        return;
    }

    const currentBrowserPath = window.location.pathname;
    const cleanedBrowserPath = currentBrowserPath.replace(/\/index\.html$/i, '/');
    
    // Ensure pathToItemMap is defined. It should be initialized by menu.js.
    if (typeof pathToItemMap === 'undefined') {
        console.error("pathToItemMap is not defined. Menu data likely not loaded. Cannot proceed with navigation.");
        // If essential map is missing, force a redirect to 404 as we can't navigate correctly.
        window.location.replace('/404.html');
        return;
    }

    // Attempt to find a matching menu item for the current browser path
    let currentMenuItem = pathToItemMap.get(cleanedBrowserPath); // pathToItemMap from menu.js

    // --- CRITICAL FIX FOR 404 RECURSION / STABLE 404 DISPLAY ---
    // If the browser's current URL is explicitly '/404.html',
    // we assume the 404 page is intentionally loaded and prevent further navigation logic.
    if (cleanedBrowserPath === '/404.html') {  
        // Ensure iframe content is correctly set for 404 (it should be in 404.html already)
        // if (pdfViewerIframe && pdfViewerIframe.contentWindow) {
        //     pdfViewerIframe.contentWindow.location.replace('/components/404-content.html');
        //     pdfViewerIframe.dataset.menuItemId = ''; // No specific menu item for 404
        // }
        
        collapseAllMenus();
        updatePageDatafor404();
        // Update page titles/headings for 404 context
        // pageTitleElement.textContent = "404 - Page Not Found";
        // appHeaderTitle.textContent = "Page Not Found";
        pdfSeoHeading.textContent = "404: Page Not Found"; // set the H1 heading back to 404.
        // pdfFilenameHeading.textContent = "The requested page does not exist.";
        // document.getElementById('open-pdf-new-tab').href = "#"; // Disable for 404

        // Clear the links menu for 404 pages (no embedded links on a 404 page)
        if (typeof populatePdfLinksMenu === 'function') {
            populatePdfLinksMenu({ file: null, path: '/404.html', title: 'Page Not Found' });
        }
        
        // Ensure no menu item is highlighted/active in the sidebar
        if (typeof highlightMenuItem === 'function') {
            highlightMenuItem(null);
        }

        // Update history for SEO and consistency (optional, but good practice for 404)
        // This makes sure if the user types a bad URL and lands on 404.html, their history reflects /404.html
        window.history.replaceState(null, '404 - Page Not Found', '/404.html');

        return; // EXIT HERE to prevent any further processing and potential loop
    }
    // --- END CRITICAL FIX ---


    // --- Normal navigation for valid menu items ---
    if (currentMenuItem) {
        console.debug("LOADPAGEFROMURL: Valid menu item found:", currentMenuItem);

        if (pdfViewerIframe && pdfViewerIframe.contentWindow) {
            // Use replace to avoid polluting iframe history for PDF content
            pdfViewerIframe.contentWindow.location.replace(currentMenuItem.iframesrc);
            pdfViewerIframe.dataset.menuItemId = String(currentMenuItem.id);
        }
        
        // Collapse all menus before expanding the relevant one
        if (typeof collapseAllMenus === 'function') {
            collapseAllMenus();
        }
        
        // Update main page data, typically SEO titles and content headings
        if (typeof updatePageData === 'function') {
            updatePageData(currentMenuItem.path);
        }
        // } else {
        //     // Fallback: manually update elements if updatePageData is not available
        //     pageTitleElement.textContent = currentMenuItem.fulltitle;
        //     appHeaderTitle.textContent = currentMenuItem.fulltitle;
        //     pdfSeoHeading.textContent = currentMenuItem.h1_text || currentMenuItem.title;
        //     pdfFilenameHeading.textContent = currentMenuItem.title;
        //     document.getElementById('open-pdf-new-tab').href = currentMenuItem.iframesrc || "#"; // Link for new tab
        // }

        // Highlight the current menu item in the sidebar
        if (typeof highlightMenuItem === 'function') {
            highlightMenuItem(currentMenuItem.id);
        }

        // Update browser history (important for direct URL access and back/forward buttons)
        window.history.replaceState(currentMenuItem, currentMenuItem.fulltitle, currentMenuItem.path);
        
        // --- Logic for PDF Links Menu ---
        if (currentMenuItem.file && currentMenuItem.file.endsWith('.pdf')) {    
            if (typeof populatePdfLinksMenu === 'function') {
                populatePdfLinksMenu(currentMenuItem); // Populate with valid menu item data
            } else {
                console.warn("populatePdfLinksMenu function not available.");
            }
        } else {
            console.warn(`No PDF file or valid data found for page ${currentMenuItem.path}. Clearing PDF links menu.`);
            // Clear the links menu for non-PDFs or missing data
            if (typeof populatePdfLinksMenu === 'function') {
                populatePdfLinksMenu({ file: null }); // Pass object with null file for clearing
            } else {
                console.warn("populatePdfLinksMenu function not available.");
            }
        }

        // Also expand the menu to the current item
        if (currentMenuItem.id && typeof expandMenuPath === 'function') {
            expandMenuPath(currentMenuItem.id); // Expand the menu to the active item
        } else if (currentMenuItem.id) {
            console.warn("expandMenuPath function not available.");
        }

    } else { // --- Handling for invalid URLs that are NOT already /404.html ---
        console.warn(`WARN: No matching menu item found for URL: "${cleanedBrowserPath}". Redirecting to 404 page.`);
        
        // This is the crucial step: force a full browser navigation to 404.html.
        // This will trigger a new page load, and the first 'if' block will then handle it.
        window.location.replace('/404.html');
        // The script execution will effectively stop here as the browser navigates to the new URL.
    }
}