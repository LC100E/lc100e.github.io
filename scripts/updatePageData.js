function updatePageData(slug) {
  const menuItem = slugToItemMap.get(slug);
  console.debug('update page data for slug: ', slug);

  updateDynamicPdfArea(slug);
  updateCanonicalLink(slug);
  updatePageHeader(menuItem.fulltitle, menuItem.description);
}

function updateCanonicalLink(slug) {
  var existingLink = document.querySelector("link[rel='canonical']");
  const baseDomain = window.location.origin; // e.g. https://lc100e.github.io
  const pathWithSearch = 'index.html?slug=' + slug;
  let absoluteCanonicalUrl = new URL(pathWithSearch, baseDomain).href;
  console.debug('update to connical url: ', absoluteCanonicalUrl);

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