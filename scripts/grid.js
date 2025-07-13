function enableUserGridResize() {
  // This function enables the user to resize the grid layout
  // between the menu sidebar and the main content area.
  // It uses mouse events to dynamically adjust the width of the sidebar.
  
  // 2. ENABLE USER GRID RESIZE.
  const mainLayout = document.getElementById('main-content-area');
  const menuSidebar = document.getElementById('nav-sidebar');
  const splitter = document.getElementById('splitter-bar');

  let isDragging = false;
  let initialMouseX; // Stores the mouse X position when drag starts
  let initialMenuWidth; // Stores the menu's width when drag starts

  // Define min/max widths for the menu panel
  const MIN_MENU_WIDTH = 150; // Minimum width in pixels
  const MAX_MENU_WIDTH_PERCENTAGE = 0.7; // Maximum menu width as a percentage of the main layout width

  // --- MOUSE DOWN event on the splitter ---
  splitter.addEventListener('mousedown', (e) => {
    isDragging = true; // Set flag to indicate dragging has started
    initialMouseX = e.clientX; // Record initial mouse X position
    initialMenuWidth = menuSidebar.offsetWidth; // Record initial menu width
    
    // Create and append a transparet overlay div to cover the PDF iFrame to allow mouse action
    overlayDiv = document.createElement('div');
    overlayDiv.classList.add('drag-overlay');
    document.body.appendChild(overlayDiv); // Append to body to cover everything
    

    // Add event listeners to the entire document.
    // This is crucial so that the resizing continues even if the mouse
    // moves off the splitter element during the drag.
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Add a class to the body to prevent text selection on the page
    // while dragging, and to ensure the resize cursor is consistent.
    document.body.classList.add('resizing');

    // Prevent default browser behavior (like text selection or image dragging)
    e.preventDefault();
  });

  // --- MOUSE MOVE event handler ---
  function handleMouseMove(e) {
    if (!isDragging) return; // Only execute if dragging is active

    const deltaX = e.clientX - initialMouseX; // Calculate how much the mouse has moved horizontally
    let newWidth = initialMenuWidth + deltaX; // Calculate the new potential width for the menu

    // Get the current total width of the .main-layout container
    const maxAllowedWidth = mainLayout.offsetWidth * MAX_MENU_WIDTH_PERCENTAGE;

    // Apply constraints:
    newWidth = Math.max(MIN_MENU_WIDTH, newWidth); // Ensure width is not less than MIN_MENU_WIDTH
    newWidth = Math.min(maxAllowedWidth, newWidth); // Ensure width is not more than MAX_MENU_WIDTH_PERCENTAGE

    // Update the grid-template-columns CSS property of the main-layout.
    // This dynamically resizes the columns.
    // 8px is the fixed width of the splitter, 1fr takes the rest.
    mainLayout.style.gridTemplateColumns = `${newWidth}px 8px 1fr`;
  }

  // --- MOUSE UP event handler ---
  function handleMouseUp() {
    isDragging = false; // Reset dragging flag
    
    // --- NEW: Remove the overlay div ---
    if (overlayDiv) {
      document.body.removeChild(overlayDiv);
      overlayDiv = null; // Clear the reference
    }

    // Remove the event listeners from the document to clean up
    // and prevent unnecessary calls after dragging has stopped.
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Remove the body class added during dragging
    document.body.classList.remove('resizing');
  }

  // Optional: Add touch event listeners for mobile compatibility
  // This is a simplified version; for full robust touch, you might need more complex logic.
  splitter.addEventListener('touchstart', (e) => {
    // Prevent default touch behavior (e.g., scrolling)
    e.preventDefault();
    const touch = e.touches[0];
    splitter.dispatchEvent(new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true
    }));
  });

  document.addEventListener('touchmove', (e) => {
    if (isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging
      const touch = e.touches[0];
      splitter.dispatchEvent(new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true
      }));
    }
  });

  document.addEventListener('touchend', () => {
    if (isDragging) {
      splitter.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    }
  });
}