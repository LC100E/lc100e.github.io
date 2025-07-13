// Helper function to find a node by its vanity URL slug
function findNodeByVanityUrl(nodes, vanitySlug) {
  for (const node of nodes) {
      if (node.cleanurlslug && node.cleanurlslug === vanitySlug) {
          return node;
      }
      if (node.children && node.children.length > 0) {
          const foundChild = findNodeByVanityUrl(node.children, vanitySlug);
          if (foundChild) {
              return foundChild;
          }
      }
  }
  return null;
}

function findNodeByPdfIframeSrc(nodes, targetHash) {
    if (!nodes || !Array.isArray(nodes)) return null;

    for (const node of nodes) {
      const nodeHash = node.iframesrc; // node.url is already a hash fragment in menuJsonData
      if (nodeHash === targetHash) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const foundChild = findNodeByPdfIframeSrc(node.children, targetHash); // Pass original targetHash
        if (foundChild) return foundChild;
      }
    }
    return null;
  }

// Helper function to find a node and its parents for expansion
function findNodeAndParents(nodes, targetId, parentNodes = []) {
  for (const node of nodes) {
      if (node.id == targetId) { // Use == for potential type coercion (string vs number)
          return { foundNode: node, parents: parentNodes };
      }
      if (node.children && node.children.length > 0) {
          const result = findNodeAndParents(node.children, targetId, [...parentNodes, node]);
          if (result.foundNode) {
              return result;
          }
      }
  }
  return { foundNode: null, parents: [] };
}

// Function to expand the menu path to a given node ID
// This function relies on global/accessible collapseAllMenus() and ViewTree()
function expandMenuPath(targetNodeId, menuData) {
    if (!menuData || menuData.length === 0) {
        console.warn("menuData not loaded for expandMenuPath.");
        return;
    }

    const { foundNode, parents } = findNodeAndParents(menuData, targetNodeId);
    if (!foundNode) {
        console.warn(`Node with ID ${targetNodeId} not found for menu expansion.`);
        return;
    }

    // Now expand all parent nodes leading to the target
    parents.forEach(parentNode => {
        const listItem = document.getElementById(`node-${parentNode.id}`);
        if (listItem && listItem.classList.contains('collapsed')) {
            ViewTree(parentNode.id); // Call ViewTree to expand if collapsed
        }
    });

    // Activate/highlight the menu item
    highlightMenuItem(targetNodeId);

    // Optionally, ensure the target node itself is visible/expanded if it's a folder
    const targetListItem = document.getElementById(`node-${targetNodeId}`);
    if (targetListItem) {
        // If it's a folder and collapsed, expand it.
        if (targetListItem.classList.contains('menu-node') && targetListItem.classList.contains('collapsed')) {
            ViewTree(targetNodeId);
        }
        // Scroll the selected item into view for better UX
        targetListItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function handlePdfViewerLoad() {
    const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');
    let currentMenuItem = null;

    // CRITICAL: Get the *actual* loaded PDF URL from inside the iframe's content
    let actualLoadedPdfUrl = '';
    try {
        // Attempt to access contentWindow.location.href first (most direct for iframes)
        if (pdfViewerIframe.contentWindow && pdfViewerIframe.contentWindow.location.href) {
            actualLoadedPdfUrl = pdfViewerIframe.contentWindow.location.href;
        } else {
            // Fallback: Check for embed/object tags within the iframe's document
            const embedElement = pdfViewerIframe.contentDocument?.querySelector('embed, object');
            if (embedElement && embedElement.src) {
                actualLoadedPdfUrl = embedElement.src;
            } else {
                // Final fallback: Use the iframe's own src attribute
                actualLoadedPdfUrl = pdfViewerIframe.src;
            }
        }
    } catch (e) {
        console.error(`Error accessing iframe content (cross-origin or timing issue): ${e.message}. Falling back to iframe.src.`, 'error');
        actualLoadedPdfUrl = pdfViewerIframe.src;
    }
  
    const urlObject = new URL(actualLoadedPdfUrl, window.location.href);
    const targetIframeHash = urlObject.pathname + urlObject.search;
    currentMenuItem = findNodeByPdfIframeSrc(menuJsonData.children, targetIframeHash);

    if (currentMenuItem) {
  
        // Critical.  each change in iFrame content pushes an implicit event to the browser history stack.
        // but does not change the URL, so we need to replace the URL manually
        // This ensures that every distinct PDF load creates a unique, navigable history entry.
        // The browser's implicit entry for the iframe load will be followed by our explicit push.
        if (window.location.hash !== currentMenuItem.cleanurlslug) { // Only push if the URL will actually change
            window.history.replaceState(currentMenuItem, currentMenuItem.title, currentMenuItem.cleanurlslug);
            updatePageData(currentMenuItem); // Update page data, Connical URL and SE data  with the current menu item
            expandMenuPath(currentMenuItem.id, menuJsonData.children);
        } 
    } else {
        console.warn(`WARN: No matching menu item found for loaded PDF src: ${actualLoadedPdfUrl}. History not updated.`);
    }
}
  

async function handlePageLoadFromUrl(loadedMenuData) {
    const currentPathname = window.location.pathname;
    const vanitySlug = currentPathname.substring(1)
    const targetNode = findNodeByVanityUrl(loadedMenuData, vanitySlug);

    if (targetNode) {
        // Call the shared linkClick function to load content, update URL/title/description/canonical/GA
        linkClick(targetNode);
        collapseAllMenus();
        expandMenuPath(targetNode.id, loadedMenuData);
    } else {
        console.warn(`No menu node found for vanity URL: "${vanitySlug}". Loading default content.`);
        linkClick(menuJsonData.children[0], false); // Fallback to first item in menu
    }
}

