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

function findNodeByPdfIframeSrc(targetHash, nodes = menuJsonData.children) {
    if (!nodes || !Array.isArray(nodes)) return null;

    for (const node of nodes) {
      const nodeHash = node.iframesrc; // node.url is already a hash fragment in menuJsonData
      if (nodeHash === targetHash) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const foundChild = findNodeByPdfIframeSrc(targetHash, node.children ); // Pass original targetHash
        if (foundChild) return foundChild;
      }
    }
    return null;
  }

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
        // Attempt to access contentWindow.location.href for the iFrame
        if (pdfViewerIframe.contentWindow && pdfViewerIframe.contentWindow.location.href) {
            actualLoadedPdfUrl = pdfViewerIframe.contentWindow.location.href;
            console.debug('obtained iFrame src from contentWindow.location.href');
        } else {
            // Fallback: Check for embed/object tags within the iframe's document
            const embedElement = pdfViewerIframe.contentDocument?.querySelector('embed, object');
            if (embedElement && embedElement.src) {
                actualLoadedPdfUrl = embedElement.src;
                console.debug('obtained iFrame src from embedd/object tags within iFrame');
            } else {
                // Final fallback: Use the iframe's own src attribute
                actualLoadedPdfUrl = pdfViewerIframe.src;
                console.debug('obtained iFrame src from src attribute');
            }
        }
    } catch (e) {
        console.error(`Error accessing iframe content (cross-origin or timing issue): ${e.message}. Falling back to iframe.src.`, 'error');
        actualLoadedPdfUrl = pdfViewerIframe.src;
        console.warn('fallback iFrame src using src attribute');
    }
  
    const urlObject = new URL(actualLoadedPdfUrl, window.location.href);
    const targetIframeHash = urlObject.pathname + urlObject.search;
    console.debug('searching for menu Item using iFrame src of: ', targetIframeHash);
    // currentMenuItem = findNodeByPdfIframeSrc(targetIframeHash);
    currentMenuItem = iFrameSrcToItemMap.get(targetIframeHash);

    if (currentMenuItem) {
  
        // Critical.  each change in iFrame content pushes an implicit event to the browser history stack.
        // but does not change the URL, so we need to replace the URL manually
        // This ensures that every distinct PDF load creates a unique, navigable history entry.
        // The browser's implicit entry for the iframe load will be followed by our explicit push.
        let newUrlForState = '';
       
        newUrlForState =  window.location.origin + "/index.html?slug=" + currentMenuItem.cleanurlslug;
        console.debug(`new url: ${newUrlForState}, pathname: ${window.location.pathname}, search: ${window.location.search}`);

        if (window.location.search !== newUrlForState) { // Only push if the URL will actually change
            window.history.replaceState(currentMenuItem, currentMenuItem.title, newUrlForState);
            updatePageData(currentMenuItem.cleanurlslug); // Update page data, Connical URL and SE data  with the current menu item
            expandMenuPath(currentMenuItem.id);
        }
    } else {
        console.warn(`WARN: No matching menu item found for loaded PDF src: ${actualLoadedPdfUrl}. History not updated.`);
    }
}
  

async function handlePageLoadFromUrl() {
    // 1. Get the slug from the URL query parameter (e.g., yourpage.html?slug=example-item)
    console.debug('window href: ', window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    const slugFromQuery = urlParams.get('slug'); // This will be the value of the 'slug' parameter
    console.debug('urlParams: ', urlParams);
    console.debug('slugFromQuery: ', slugFromQuery);
        
    let targetNode = null;
    // Only attempt map lookup if a 'slug' query parameter exists and has a value
    if (slugFromQuery) {
        targetNode = slugToItemMap.get(slugFromQuery);
    }

    if (targetNode) {
        // Node found based on the slug from the URL query parameter
        collapseAllMenus();
        linkClick(targetNode.cleanurlslug);
    } else {
        // No valid slug found in query, or slug not found in map. Load default content.
        console.warn(`No menu node found for slug "${slugFromQuery || 'none'}" from URL query. Loading default content.`);

        // Assume the first item in the top-level children is the default home page
        const defaultMenuItem = slugToItemMap.get("home");

        // Construct the correct URL for the default item, using its cleanurlslug as a query parameter
        // This ensures the URL in the address bar is clean if an invalid slug was present.
        // const defaultSlug = defaultMenuItem.cleanurlslug;
        const defaultSlugWithQuery = 'index.html?slug=' + defaultMenuItem.cleanurlslug;
        console.debug('default Slug with Query: ', defaultSlugWithQuery);
      
        
        // Update the URL in the address bar using replaceState for this initial fallback scenario.
        // This prevents bad URLs from staying in the history on page load.
        const currentFullUrl = window.location.pathname + window.location.search;
        if (currentFullUrl !== defaultSlugWithQuery) {
            window.history.replaceState(defaultMenuItem, defaultMenuItem.fulltitle, defaultSlugWithQuery);
        }
        
        // Now, load the content for the default item.
        collapseAllMenus();
        linkClick(defaultMenuItem.cleanurlslug); 
    }
}

