// top.js loaded from top.html

function setbtnimage(status, PsBaseFile, PoObj){
  if (status==0) {
    document.images[PoObj].src='/images/' + PsBaseFile + '1.gif';
  }else if (status==1){
    document.images[PoObj].src='/images/' + PsBaseFile + '2.gif';
  }else{
    document.images[PoObj].src='/images/' + PsBaseFile + '3.gif';
  }
}


// issue#4 fix: adding button to open pdf in new tab on mobile devices

document.addEventListener('DOMContentLoaded', () => {
  const openPdfInNewTabButton = document.getElementById('openPdfInNewTabButton');
  let currentPdfPath = '';

  // --- Utility function for mobile device detection ---
  function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
    return isMobile;
  }

  // --- Function to update button state and handler (now uses currentPdfPath) ---
  function updateOpenPdfButtonState() {
    if (openPdfInNewTabButton) {
      if (isMobileDevice() && currentPdfPath) { // Only show if mobile AND we have a path
        openPdfInNewTabButton.style.display = 'inline-block'; // Or 'block'
        openPdfInNewTabButton.onclick = () => {
          window.open(currentPdfPath, '_blank'); // <<< USE THE RECEIVED currentPdfPath HERE! <<<
        };
        console.log('top.js: Button updated with path:', currentPdfPath);
      } else {
        openPdfInNewTabButton.style.display = 'none'; // Hide if not mobile or no path
        console.log('top.js: Button hidden (not mobile or no path).');
      }
    } else {
      console.warn("top.js: Button with ID 'openPdfInNewTabButton' not found in top.html.");
    }
  }

  window.addEventListener('message', (event) => {
    // 1. IMPORTANT: Always verify the origin of the message for security.
    // This should match the 'targetOrigin' you use in index.js's postMessage.
    const expectedOrigin = window.location.origin; // Best for same-origin communication
    if (event.origin !== expectedOrigin) {
      console.warn(`top.js: Rejected message from unexpected origin: ${event.origin}`, event);
      return; // Stop processing if the origin is not what we expect
    }

    // 2. Debug: Log ALL messages that pass the origin check
    console.log('top.js: Received message from expected origin:', event.data);

    // 3. Now, check if the data itself is the specific message we're looking for.
    // We expect a string that ends with '.pdf'
    if (typeof event.data === 'string' && event.data.endsWith('.pdf')) {
      currentPdfPath = event.data; // Store the received path
      console.log('top.js: Identified and stored PDF path:', currentPdfPath);
      updateOpenPdfButtonState(); // Update the button with the new path
    } else {
      // Log messages that *are* from the correct origin but are not your expected PDF path.
      console.log('top.js: Message from correct origin but not a recognized PDF path:', event.data);
    }
  });

  updateOpenPdfButtonState(); // Initial call
});
