document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  const iframe = document.getElementsByName('pdf')[0];

  // if the page is loaded with a page specific URL.
  if (page && iframe) {
    // Decode the page parameter since it’s encoded
    const decodedPage = decodeURIComponent(page);

    if (decodedPage.includes('.html?')) {
      const [baseUrl, query] = decodedPage.split('?', 2);
      const subParams = new URLSearchParams(query);
      const subPath = subParams.get('path');
      const subPage = subParams.get('page') || subParams.get('code');

      console.log('page:', page);
      console.log('decodedPage:', decodedPage);
      console.log('baseUrl:', baseUrl);
      console.log('query:', query);
      console.log('subPath:', subPath);
      console.log('subPage:', subPage);

      if (baseUrl.includes('ewd_main.html') && subPath && subPage) {
        iframe.src = `${subPath}${subPage}.pdf`;
      } else if (baseUrl.includes('ewd_overall.html') && subPath && subPage) {
        iframe.src = `${subPath}overall/${subPage}.pdf`;
      } else if (baseUrl.includes('inner2.html') && subPath && subPage) {
        const firstPage = subPage.split('+')[0];
        iframe.src = `${subPath}${firstPage}.pdf`;
      } else if (baseUrl.includes('inner.html') || baseUrl.includes('connlist.html')) {
        iframe.src = decodedPage;
      } else {
        iframe.src = decodedPage;
      }
    } else {
      iframe.src = decodedPage;
    }

    // Highlight menu item
    const links = document.getElementsByTagName('a');
    for (let link of links) {
      if (link.getAttribute('href') === decodedPage) { // Compare with decoded value
        if (sBefore && sBefore !== link.id) document.all(sBefore).style.fontWeight = "normal";
        document.all(link.id).style.fontWeight = "bold";
        sBefore = link.id;
        break;
      }
    }
  }
});

// issue#4 fix: adding button to open pdf in new tab on mobile devices
document.addEventListener('DOMContentLoaded', () => {
  // Get the PDF iframe element and the button element from the main document (index.html)
  const pdfIframe = document.getElementById('pdf');

  if (pdfIframe) {
    pdfIframe.addEventListener('load', () => {
      console.log('index.js: --- Main PDF iframe content has finished loading! ---');
      const currentPdfSrc = pdfIframe.src; // Get the src from the parent's iframe
      console.log('index.js: Currently loaded PDF path:', currentPdfSrc);

      // Get a reference to the contentWindow of the top.html iframe
      const pdfTopIframe = document.getElementById('pdfTopIframe'); // Assuming this ID for top.html's iframe

      if (pdfTopIframe && pdfTopIframe.contentWindow) {
        // Send the currentPdfSrc to the top.html iframe
        // IMPORTANT: Replace 'window.location.origin' with your exact origin if deployed
        // For local development (e.g., Live Server), window.location.origin should work,
        // or you can temporarily use '*' for broad testing (but not recommended for production).
        pdfTopIframe.contentWindow.postMessage(currentPdfSrc, window.location.origin);
        console.log('index.js: Sent PDF path to top.html iframe.');
      } else {
        console.warn("index.js: Could not send message to top.html iframe (not found or contentWindow not ready).");
      }

      // ... (rest of your pdfIframe load logic, if any)
    });
  }
  else {
    console.log('no pdfIframe found');
  }
}); // end document listener
