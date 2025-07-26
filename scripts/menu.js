// --- Global Data for Menu items and clean url paths ---
jsonFile = '/xml/index.json';
let pathToItemMap = new Map(); // a flat key value pair to quickly look up data using the url path as key
// let iframeSrcToItemMap = new Map(); // a flat key value pair to quickly look up data using iFrame src as key
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
  const fileOpenedIsPdf = fileOpened.endsWith('pdf');

  // Crucial: Clear any previous inline styles first for all elements
  // This allows your CSS media queries to then take control.
  if (dynamicPdfArea) dynamicPdfArea.style.display = '';
  if (openPdfNewTabButton) openPdfNewTabButton.style.display = '';
  if (pdfFilenameHeading) pdfFilenameHeading.style.display = '';
  if (pdfSeoHeading) pdfSeoHeading.style.display = '';

  dynamicPdfArea.style.display = 'flex';
  pdfFilenameHeading.style.display = 'none';
  pdfFilenameHeading.textContent = `file: ${itemData.file}`;
  pdfSeoHeading.style.display = 'inline-block';
  pdfSeoHeading.textContent = `${itemData.h1_text}`;
  
  if (isMobileScreen) {
    pdfFilenameHeading.style.display = 'none';
    if (fileOpenedIsPdf) {
      openPdfNewTabButton.style.display = 'inline-block';
      openPdfNewTabButton.onclick = () => {
        window.open(itemData.file, '_blank');
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

/**
 * Handles the click event for an item link (PDF).
 * @param {object} itemData - The full JSON object for the clicked item.
 */
function linkClick(path) {
  const itemData = pathToItemMap.get(path);
  console.info("LINK CLICK: ", itemData);

  // 1. update browser history, connical url and SEO data.
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
 

  // 3. highlight the menu item
  highlightMenuItem(itemData.id);

  // 4. close sidebar menu if mobile
  closeSidebarMenu();

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
  // Get all elements that represent a menu node (<li> with class 'menu-node')
  const menuNodes = document.querySelectorAll('.menu-node');

  if (menuNodes.length === 0) {
    return;
  }

  // Iterate over each menu node
  menuNodes.forEach(nodeElement => {
    // Check if the node is currently expanded
    if (nodeElement.classList.contains('expanded')) {
      // Extract the node ID from the element's ID (e.g., "node-4042" -> "4042")
      const nodeIdString = nodeElement.id.replace('node-', '');
      const nodeId = parseInt(nodeIdString, 10);

      // Call ViewTree to collapse this specific node.
      // ViewTree is designed to toggle, so calling it on an 'expanded' node will collapse it.
      if (!isNaN(nodeId)) { // Ensure nodeId is a valid number
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
  menuJsonData = await response.json(); // Assigns the root object (e.g., {type: 'root', children: [...]})
    
  // Clear map in case of re-loading (though usually not an issue on initial DOMContentLoaded)
  pathToItemMap = new Map();
  // iframeSrcToItemMap = new Map();
  // idToItemMap = new Map();

  // --- RECURSIVE FUNCTION TO POPULATE THE PATH MAP ---
  // This will traverse the entire menu tree, regardless of nesting depth
  function populatePathMapRecursively(node) {
      if (node.path) {
        pathToItemMap.set(node.path, node);
      }
    
      // if (node.iframesrc) {
      //   iframeSrcToItemMap.set(node.iframesrc, node);  
      // }
    
    // if (node.id) {
    //   idToItemMap.set(node.id, node);
    // }
    
      if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
              populatePathMapRecursively(child); // Recursively call for children
          }
      }
  }
  // Start populating the map from the root of your menu data
  populatePathMapRecursively(menuJsonData); 
  // --- END RECURSIVE POPULATION ---

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


// generate and insert the menu once the page loads
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Build menu data map and LOAD THE MENU
  try {
    await loadJsonData(); // Populates global menuJsonData and pathToItemMap
    await loadMenuHtml(); // Loads and injects menu.html
  } catch (err) {
    console.error("Critical error during page initialization:", err);
    document.body.innerHTML = "<p style='color: red; text-align: center; margin-top: 50px;'>Error loading page content. Please try again later.</p>";
    return; // Stop further execution if critical setup fails
  }

    // 2. HANDLE INITIAL PAGE LOAD FROM URL (AFTER MENU DATA IS READY) ---
  if (typeof handlePageLoadFromUrl === 'function') {
    await handlePageLoadFromUrl();
  } else {
    console.error("handlePageLoadFromUrl function not found. Ensure loadPageFromUrl.js is loaded.");
  }
 
  // 3. HANDLE INITIAL MOBILE MENU AND GRID STATE
  handleInitialMobileMenuSetup();

  // 4. ADD EVENT LISTENERS TO MENU ITEMS for grid resize
  enableUserGridResize();

  // 5. ADD EVENT LISTENER FOR BROSER BACK BUTTON
  window.onpopstate = function (event) {
    console.warn("POPEVENT fired");
    const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');
    if (!pdfViewerIframe) {
        console.error("Error: pdfViewerIframe element not found in onpopstate.");
        // Critical error, perhaps redirect to a general error page
        window.location.replace('/404.html'); 
        return;
    }

    // The event.state contains the object we pushed/replaced with pushState/replaceState
    const currentMenuItem = event.state; 

    if (currentMenuItem) {
        // Update iframe's src and data-menu-item-id based on history state
        // pdfViewerIframe.src = currentMenuItem.iframesrc; 
        pdfViewerIframe.contentWindow.location.replace(currentMenuItem.iframesrc); // change the content directly to avoid implicit entry on history stack  
        pdfViewerIframe.dataset.menuItemId = String(currentMenuItem.id); 

        // Update main page's UI elements
        updatePageData(currentMenuItem.path); 
        highlightMenuItem(currentMenuItem.id);

        console.debug(`onpopstate: Navigated back/forward to path "${currentMenuItem.path}" (ID: ${currentMenuItem.id}). Iframe src set to: "${currentMenuItem.iframesrc}"`);

    } else {
        // This can happen if the initial history state was null (e.g., direct access to an old static page before JS loaded)
        // In this case, re-evaluate based on the current URL
        console.warn("onpopstate: event.state was null. Re-evaluating page based on current URL.");
        // loadPageFromURL(); // Fallback: Use loadPageFromURL to parse the current browser URL
    }
  };

  // 5. ADD EVENT LISTENER FOR PDF VIEWER IFRAME
  // const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');
  // if (pdfViewerIframe) {
  //   pdfViewerIframe.onload = handlePdfViewerLoad;
  // } else {
  //   console.error("No iframe with id 'pdf-viewer-iframe' found.");
  // }

});


  
function handleInitialMobileMenuSetup() {
  const isMobileView = window.innerWidth < desktopBreakpoint;
  const mainContentArea = document.getElementById('main-content-area'); // Reference to the main grid container
  const navSidebar = document.getElementById('nav-sidebar');
  const appWrapper = document.getElementById('app-wrapper');

  if (isMobileView) {
      // On mobile view:
      // Ensure desktop-specific class is removed
      mainContentArea.classList.remove('sidebar-closed');
      // Ensure mobile overlay is hidden by default (CSS handles this, but remove 'menu-open' if present)
      navSidebar.classList.remove('menu-open');
      appWrapper.classList.remove('mobile-menu-active'); // Remove global mobile overlay class
  } else {
      // On desktop view:
      // Ensure mobile-specific overlay classes are removed
      navSidebar.classList.remove('menu-open');
      appWrapper.classList.remove('mobile-menu-active');
      // Ensure desktop sidebar is open by default (add 'sidebar-closed' to toggle OFF)
      // It starts open, so we DON'T add 'sidebar-closed' here initially.
      // mainContentArea.classList.add('sidebar-open'); // You could use an 'open' class if preferred
  }
}

function handleMobileMenuClick() {
  const isMobileView = window.innerWidth < desktopBreakpoint;
  const navSidebar = document.getElementById('nav-sidebar');
  const appWrapper = document.getElementById('app-wrapper');
  const mainContentArea = document.getElementById('main-content-area'); // Reference to the main grid container
  

  if (isMobileView) {
    // Mobile behavior: Toggle the overlay class on nav-sidebar
    navSidebar.classList.toggle('menu-open');
    appWrapper.classList.toggle('mobile-menu-active'); // For global effects like overflow: hidden
  } else {
    // Desktop behavior: Toggle the 'sidebar-closed' class on the main grid container
    mainContentArea.classList.toggle('sidebar-closed');
  }
}

function closeSidebarMenu() {
    const navSidebar = document.getElementById('nav-sidebar');
    const appWrapper = document.getElementById('app-wrapper');
    const desktopBreakpoint = 1025; // Ensure this matches your CSS breakpoint and other JS uses
    const isMobileView = window.innerWidth < desktopBreakpoint;

    // Only attempt to close if it's a mobile view AND the menu is currently open
    if (isMobileView && navSidebar && navSidebar.classList.contains('menu-open')) {
        navSidebar.classList.remove('menu-open');
        appWrapper.classList.remove('mobile-menu-active');
    }
}
