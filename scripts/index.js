// Load PDF from URL parameter on page load
window.onload = function() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page'); // Changed from 'pdf' to 'page'
  if (page && document.getElementsByName('pdf')[0]) {
    // Set the iframe src to the PDF from the URL parameter
    document.getElementsByName('pdf')[0].src = page;
    // Highlight the corresponding menu item
    const links = document.getElementsByTagName('a');
    for (let link of links) {
      if (link.getAttribute('href') === page) {
        if (sBefore && sBefore !== link.id) document.all(sBefore).style.fontWeight = "normal";
        document.all(link.id).style.fontWeight = "bold";
        sBefore = link.id;
        break;
      }
    }
  }
};
