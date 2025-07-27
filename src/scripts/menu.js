// --- Global Data for Menu items and clean url paths ---
jsonFile = '/xml/index.json';
let pathToItemMap = new Map(); // a flat key value pair to quickly look up data using the url path as key
let fileToItemMap = new Map(); // a flat key value pair to quickly look up data using the filename as key
let menuJsonData = null;       // menu hiearchy use to tree expansions and like functions

// --- Global Variables and Image Paths (Adjust these paths as needed) ---
// These arrays store paths to the different tree line and icon images.
// The indices (0 or 1) typically correspond to whether a node is the LAST_CHILD (0) or NOT_LAST_CHILD (1)
// in its sibling list, influencing the connecting line image.
const TREE_IMAGES = {
  FOLDER_PLUS: "/images/plas1.gif",      // Plus icon for collapsed folder
  FOLDER_MINUS: "/images/minas1.gif",     // Minus icon for expanded folder
};

// Global object to store the state of menu toggles.
// Key: node ID, Value: true (expanded) or false (collapsed)
const menuToggleState = {};
const desktopBreakpoint = 1025; // Match your CSS @media (min-width)
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');



/**
 * Handles the click event for expanding/collapsing a menu node.
 * This function updates the UI (changes '+' to '-' icon, shows/hides children).
 * @param {number} nodeId - The ID of the menu node to toggle.
 */
function ViewTree(nodeId) {
  const listItem = document.getElementById(`node-${nodeId}`);
  const toggleIcon = document.getElementById(`toggle-icon-${nodeId}`);
  const childrenContainer = document.getElementById(`children-of-${nodeId}`);

  if (!listItem || !toggleIcon || !childrenContainer) {
    console.warn(`ViewTree: Elements not found for node ID: ${nodeId}`);
    return;
  }

  // Toggle the 'collapsed'/'expanded' class
  if (listItem.classList.contains('collapsed')) {
    listItem.classList.remove('collapsed');
    listItem.classList.add('expanded');
    childrenContainer.style.display = 'block'; // Or 'flex', depending on desired layout
    toggleIcon.src = TREE_IMAGES.FOLDER_MINUS;
    toggleIcon.alt = "-";
    menuToggleState[nodeId] = true; // Update state
  } else {
    listItem.classList.remove('expanded');
    listItem.classList.add('collapsed');
    childrenContainer.style.display = 'none';
    toggleIcon.src = TREE_IMAGES.FOLDER_PLUS;
    toggleIcon.alt = "+";
    menuToggleState[nodeId] = false; // Update state
  }
}

function updateDynamicPdfArea(path) {
  const itemData = pathToItemMap.get(path);
  const dynamicPdfArea = document.getElementById('dynamic-pdf-area');
  const openPdfNewTabButton = document.getElementById('open-pdf-new-tab');
  const pdfFilenameHeading = document.getElementById('pdf-filename-heading');
  const pdfSeoHeading = document.getElementById('pdf-seo-heading');
  const fileOpened = itemData.file;
  const isMobileScreen = window.innerWidth <= 1024;
  const fileOpenedIsPdf = fileOpened && fileOpened.endsWith('pdf'); // Check if fileOpened is defined

  // Crucial: Clear any previous inline styles first for all elements
  // This allows your CSS media queries to then take control.
  if (dynamicPdfArea) dynamicPdfArea.style.display = '';
  if (openPdfNewTabButton) openPdfNewTabButton.style.display = '';
  if (pdfFilenameHeading) pdfFilenameHeading.style.display = '';
  if (pdfSeoHeading) pdfSeoHeading.style.display = '';

  dynamicPdfArea.style.display = 'flex'; // This seems to be setting initial display, adjust if needed
  
  if (pdfFilenameHeading) { // Ensure element exists before accessing
      pdfFilenameHeading.style.display = 'none';
      pdfFilenameHeading.textContent = `file: ${itemData.file}`;
  }
  if (pdfSeoHeading) { // Ensure element exists before accessing
      pdfSeoHeading.style.display = 'inline-block';
      pdfSeoHeading.textContent = `${itemData.h1_text}`;
  }
  
  if (isMobileScreen) {
    if (pdfFilenameHeading) pdfFilenameHeading.style.display = 'none';
    if (fileOpenedIsPdf) {
      if (openPdfNewTabButton) { // Ensure button exists
          openPdfNewTabButton.style.display = 'inline-block';
          openPdfNewTabButton.onclick = () => {
            window.open(itemData.iframesrc, '_blank'); // Open the iframe source directly
          }
      }
    }
  }
}

function highlightMenuItem(menuItemId) {
  // first remove any current active states
  const currentActiveLinkInDOM = document.querySelector('.item-link.active');
  if (currentActiveLinkInDOM) {
      currentActiveLinkInDOM.classList.remove('active');
  }
  
  // now add the new active state
  let newActiveLink = null;
  newActiveLink = document.querySelector(`a.item-link[id="link-${menuItemId}"]`);
  if (newActiveLink) {
      newActiveLink.classList.add('active');
  } else {
      console.warn(`WARN: Could not find menu item DOM element for ID: "${menuItemId}" to set active state.`);
  }
}

// --- Removed fetchAndDisplayPdfLinks function ---
// It's no longer needed because allPdfDataMap is loaded globally
// and getPdfData handles the lookup.

/**
 * Handles the click event for an item link (PDF).
 * @param {object} path - The path of the clicked item.
 */
function linkClick(path) {
  const itemData = pathToItemMap.get(path);
  console.info("LINK CLICK: ", itemData);

  // 1. update browser history, canonical url and SEO data.
  updatePageData(path);
  window.history.pushState(itemData, itemData.title, itemData.path);

  // 2. display the clicked menu item
  const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');
  if (!pdfViewerIframe) {
      console.error("No iframe with id 'pdf-viewer-iframe' found.");
      return;
  }
  pdfViewerIframe.contentWindow.location.replace(itemData.iframesrc); // change the content directly to avoid implicit entry on history stack
  pdfViewerIframe.dataset.menuItemId = itemData.id; // This is a unique identify for all iFrame content
 

  // 3. update Menu
  highlightMenuItem(itemData.id);
  closeSidebarMenu();

  // 4. --- UPDATED: No more itemData.link_data_path ---
  // We now get the data directly from the global allPdfDataMap using itemData.file
  const pdfFilename = itemData.file; // e.g., "manuals/m_in_0001.pdf"
  const currentPdfData = getPdfData(pdfFilename); // From pdf-overlay.js

  // Update the text list of links in pdf-overlay.js
  // Ensure loadAndDisplayPdfExtractedLinksList is accessible (it is, if pdf-overlay.js loads first)
  loadAndDisplayPdfExtractedLinksList(currentPdfData.links);


  // 5. end Google Analytics pageview hit (desirable for both menu clicks and URL loads)
  if (typeof gtag === 'function') {
    const newPath = `/${itemData.path}`; 
    gtag('event', 'page_view', {
        'page_path': newPath,
        'page_title': itemData.fulltitle
    });
  }
}


function collapseAllMenus() {
  const menuNodes = document.querySelectorAll('.menu-node');
  if (menuNodes.length === 0) {
    return;
  }
  menuNodes.forEach(nodeElement => {
    if (nodeElement.classList.contains('expanded')) {
      const nodeIdString = nodeElement.id.replace('node-', '');
      const nodeId = parseInt(nodeIdString, 10);
      if (!isNaN(nodeId)) { 
        ViewTree(nodeId);
      } else {
        console.warn(`Could not parse node ID from element: ${nodeElement.id}`);
      }
    }
  });
}

async function loadJsonData() {
  const response = await fetch(jsonFile);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} when fetching ${jsonFile}`);
  }
  menuJsonData = await response.json(); 
    
  pathToItemMap = new Map();
  fileToItemMap = new Map();

  function populatePathMapRecursively(node) {
      if (node.path) {
        pathToItemMap.set(node.path, node);
      }
      if (node.file) {
        // IMPORTANT: Ensure this 'file' key matches the keys in your pdf_links_cache.json
        // e.g., "manuals/m_in_0001.pdf"
        const filename = node.file.split('/').pop();
        fileToItemMap.set(filename, node); 
      }
      if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
              populatePathMapRecursively(child);
          }
      }
  }
  populatePathMapRecursively(menuJsonData); 
  console.log(`Path lookup map created with ${pathToItemMap.size} items.`);
}


// asynchronous function to fetch and inject menu.html
async function loadMenuHtml() {
  const menuContainer = document.getElementById('menu-tree');
  if (!menuContainer) {
    throw new Error("Menu container element with ID 'menu-tree' not found in the DOM. Cannot inject menu HTML.");
  }

  const response = await fetch('/menu.html');
  if (!response.ok) {
    throw new Error(`Failed to load menu.html: HTTP status ${response.status}`);
  }

  const menuHtml = await response.text();
  menuContainer.innerHTML = menuHtml;
  console.log("menu.html successfully loaded and injected.");
}


// MAIN ONLOAD FUNCTION TO SET EVERYTHING UP
document.addEventListener('DOMContentLoaded', async () => {

  // 1. LOAD THE MENU AND CORE DATA (THIS IS DONE IN menu.js)
  try {
    await loadJsonData(); // Populates global menuJsonData, pathToItemMap, and fileToItemMap
    await loadMenuHtml(); // Loads and injects menu.html
    // pdf-overlay.js's DOMContentLoaded runs concurrently to load allPdfDataMap
  } catch (err) {
    console.error("Critical error during page initialization:", err);
    document.body.innerHTML = "<p style='color: red; text-align: center; margin-top: 50px;'>Error loading page content. Please try again later.</p>";
    return; // Stop further execution if critical setup fails
  }

  // 2. HANDLE INITIAL PAGE LOAD FROM URL (AFTER MENU DATA IS READY)
  if (typeof loadPageFromUrl === 'function') {
    await loadPageFromUrl();
  } else {
    console.error("loadPageFromUrl function not found. Ensure loadPageFromUrl.js is loaded.");
  }
  
  // 4. HANDLE INITIAL MOBILE MENU AND GRID STATE
  handleInitialMobileMenuSetup();

  // 5. ADD EVENT LISTENERS TO MENU ITEMS for grid resize
  enableUserGridResize(); // Assuming this function is defined elsewhere

  // 6. ADD EVENT LISTENER FOR BROWSER BACK BUTTON
  window.onpopstate = function (event) {
    console.warn("POPEVENT fired");
    const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');
    if (!pdfViewerIframe) {
        console.error("Error: pdfViewerIframe element not found in onpopstate.");
        window.location.replace('/404.html'); 
        return;
    }

    const currentMenuItem = event.state; 

    if (currentMenuItem) {
        pdfViewerIframe.contentWindow.location.replace(currentMenuItem.iframesrc);
        pdfViewerIframe.dataset.menuItemId = String(currentMenuItem.id); 

        updatePageData(currentMenuItem.path); 
        highlightMenuItem(currentMenuItem.id);

        // --- UPDATED: Load PDF data for history state ---
        const pdfFilename = currentMenuItem.file;
        // const currentPdfData = getPdfData(pdfFilename); // From pdf-overlay.js
        // iframe.onload will call createPdfHotspotOverlays with the correct data
        // when the iframe content (the PDF) finishes loading.

        console.debug(`onpopstate: Navigated back/forward to path "${currentMenuItem.path}" (ID: ${currentMenuItem.id}). Iframe src set to: "${currentMenuItem.iframesrc}"`);

    } else {
        console.warn("onpopstate: event.state was null. Re-evaluating page based on current URL.");
        // If your loadPageFromURL function is robust enough to handle the current browser URL, call it here:
        // loadPageFromURL(); 
    }
  };

  // 7. ADD EVENT LISTENER FOR PDF VIEWER IFRAME to create overlays on load
//   const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');
//   if (pdfViewerIframe) {
//     // UPDATED: Now, when the iframe loads, it will retrieve the specific PDF's data
//     // from the globally loaded allPdfDataMap and pass it to createPdfHotspotOverlays.
//     pdfViewerIframe.onload = () => {
//         const currentItem = pathToItemMap.get(pdfViewerIframe.contentWindow.location.pathname); // Or derive from dataset.menuItemId
//         if (currentItem && currentItem.file && currentItem.file.endsWith('.pdf')) {
//           const pdfData = getPdfData(currentItem.file);
//           console.debug("PDFVIEWER ONLOAD, links: ", pdfData.links);
//             createPdfHotspotOverlays(pdfData.links, pdfData.page_sizes);
//         } else {
//             // Clear overlays if it's not a PDF or no data is found
//             createPdfHotspotOverlays([], []); 
//         }
//     };
    
//     // Also trigger if already loaded (e.g., from browser cache)
//     if (pdfViewerIframe.contentDocument && pdfViewerIframe.contentDocument.readyState === 'complete') {
//       const currentItem = pathToItemMap.get(pdfViewerIframe.contentWindow.location.pathname);
//       console.debug("DEBUG: currentItem: ", currentItem);
//         if (currentItem && currentItem.file && currentItem.file.endsWith('.pdf')) {
//             const pdfData = getPdfData(currentItem.file);
//           console.debug("2PDFVIEWER ONLOAD, links: ", pdfData.links);
//           createPdfHotspotOverlays(pdfData.links, pdfData.page_sizes);
          
//         } else {
//             console.debug("3PDFVIEWER ONLOAD, no links: ");
//             createPdfHotspotOverlays([], []); 
//         }
//     }
//   } else {
//     console.error("No iframe with id 'pdf-viewer-iframe' found for hotspot overlay setup.");
//   }
});

function handleInitialMobileMenuSetup() {
  const isMobileView = window.innerWidth < desktopBreakpoint;
  const mainContentArea = document.getElementById('main-content-area'); // Reference to the main grid container
  const navSidebar = document.getElementById('nav-sidebar');
  const appWrapper = document.getElementById('app-wrapper');

  if (isMobileView) {
      mainContentArea.classList.remove('sidebar-closed');
      navSidebar.classList.remove('menu-open');
      appWrapper.classList.remove('mobile-menu-active');
  } else {
      navSidebar.classList.remove('menu-open');
      appWrapper.classList.remove('mobile-menu-active');
  }
}

function handleMobileMenuClick() {
  const isMobileView = window.innerWidth < desktopBreakpoint;
  const navSidebar = document.getElementById('nav-sidebar');
  const appWrapper = document.getElementById('app-wrapper');
  const mainContentArea = document.getElementById('main-content-area');
  
  if (isMobileView) {
    navSidebar.classList.toggle('menu-open');
    appWrapper.classList.toggle('mobile-menu-active');
  } else {
    mainContentArea.classList.toggle('sidebar-closed');
  }
}

function closeSidebarMenu() {
    const navSidebar = document.getElementById('nav-sidebar');
    const appWrapper = document.getElementById('app-wrapper');
    const desktopBreakpoint = 1025; 
    const isMobileView = window.innerWidth < desktopBreakpoint;

    if (isMobileView && navSidebar && navSidebar.classList.contains('menu-open')) {
        navSidebar.classList.remove('menu-open');
        appWrapper.classList.remove('mobile-menu-active');
    }
}