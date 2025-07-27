function updatePageDatafor404() {
  updateDynamicPdfArea("/");
  updateCanonicalLink("404.html");
  updatePageHeader("404 - page not found", "404 - page not found");
}


function updatePageData(path) {
  const menuItem = pathToItemMap.get(path);
  updateDynamicPdfArea(path);
  updateCanonicalLink(path);
  updatePageHeader(menuItem.fulltitle, menuItem.description);
}

function updateCanonicalLink(path) {
  var existingLink = document.querySelector("link[rel='canonical']");
  const baseDomain = window.location.origin; // e.g. https://lc100e.github.io
  let absoluteCanonicalUrl = new URL(path, baseDomain).href;

  if (existingLink) {
    existingLink.setAttribute('href', absoluteCanonicalUrl);
  } else {
    var newLink = document.createElement('link');
    newLink.setAttribute('rel', 'canonical');
    newLink.setAttribute('href', absoluteCanonicalUrl);
    document.head.appendChild(newLink);
  }
}

function updatePageHeader(title, description) {
  // Update the document title
  document.title = title; 

  // Update the meta description
  var metaDescription = document.querySelector("meta[name='description']");
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
}