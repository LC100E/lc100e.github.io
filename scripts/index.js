window.onload = function() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  const iframe = document.getElementsByName('pdf')[0];

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
};