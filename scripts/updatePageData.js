function updatePageData(menuItem) {

  updateDynamicPdfArea(menuItem);
  updateCanonicalLink(menuItem.cleanurlslug);
  updatePageHeader(menuItem.fulltitle, menuItem.description);
}

function updateCanonicalLink(vanityUrl) {
  var existingLink = document.querySelector("link[rel='canonical']");
  const baseDomain = window.location.origin; // e.g. https://lc100e.github.io
  let absoluteCanonicalUrl = new URL(vanityUrl, baseDomain).href;

  if (existingLink) {
    existingLink.setAttribute('href', absoluteCanonicalUrl);
  } else {
    var newLink = parentDocument.createElement('link');
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