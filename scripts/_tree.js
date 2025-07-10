window.menuData = null; // Will store your parsed JSON data
window.sBefore = ""; // Global variable to track the previously selected link
var jsonFile = "/xml/menu_data.json"; // Path to your generated JSON file


// --- Helper Functions (Ensure these are defined in index.js or globally) ---

// Helper to find an item by its unique 'id' property
// Assumes menuData is a global variable or passed appropriately
function findItemById(node, targetId) {
  if (node.type === 'item' && node.id === targetId) {
      return node;
  }
  if (node.children && node.children.length > 0) {
      for (let child of node.children) {
          let found = findItemById(child, targetId);
          if (found) {
              return found;
          }
      }
  }
  return null;
}


function handleInitialPageLoad() {
  // IMPORTANT: Ensure window.menuData is populated by your init() function
  // before this lookup code runs. If init() is asynchronous, you might need
  // to call this logic *from within* init()'s `fetch().then()` block,
  // or use a mechanism that ensures menuData is ready (e.g., a Promise).
  if (!window.menuData) {
    console.warn("menuData is not yet available when DOMContentLoaded fired. Assuming init() will handle the URL parsing after data load.");
    // If init() *will* call this parsing logic (e.g., via a helper function like handleInitialPageLoad()),
    // then it's fine to just return here. Otherwise, you'd need a more robust waiting mechanism.
    return;
  } 

  const params = new URLSearchParams(window.top.location.search);
  console.log("Current URL parameters:", params.toString());
  const pageParamValue = params.get('page'); // This gets the "id-title_slug" string

  let targetItem = null;

  if (pageParamValue) {
    // Extract the numerical ID from the "id-title_slug" string
    // Assumes the ID is the first part before the first hyphen
    const itemId = pageParamValue.split('-')[0];
    const numericItemtId = parseInt(itemId, 10)
    console.log("Extracted item ID from URL parameter:", itemId);
      
    targetItem = findItemById(window.menuData, numericItemtId); // Search in the loaded menuData
    console.log("Found target item:", targetItem ? targetItem.fulltitle : "not found");
  } else {
    // No 'page' parameter found, load the default home page
    console.log("No 'page' parameter found in URL, loading default home page.");
    // Assuming your home page item has a specific ID like 'home' in menu_data.json
    targetItem = findItemById(window.menuData, 'home');
  }

  if (targetItem) {

    console.log("Initial page load: Found item:", targetItem.fulltitle);

    // 1. Load PDF into the iframe
    const pdfIframe = document.getElementsByName('pdf')[0] || document.getElementById('pdf');
    if (pdfIframe) {
      pdfIframe.href = targetItem.url;
    }
    linkclick(targetItem, pastedUrl = true);

  } else {
    console.warn(`Item not found for URL parameter '${pageParamValue || 'none'}'. Loading fallback.`);
  }
}



async function init() {
  openFlag=new Array;
  ColorFlag=new Array;
  gNoArray=new Array;
  pImg=new Array("/images/plas1.gif","/images/plas2.gif");
  mImg=new Array("/images/minas1.gif","/images/minas2.gif");

  fImg=new Array("/images/close_g.gif","/images/open_g.gif",
                 "/images/close_y.gif","/images/open_y.gif",
                 "/images/close_r.gif","/images/open_r.gif",
                 "/images/close_p.gif","/images/open_p.gif",
                 "/images/close_b.gif","/images/open_b.gif",
                 "/images/close_lb.gif","/images/open_lb.gif");

  dImg=new Array("/images/tg3.gif","/images/tg4.gif");
  rImg=new Array("/images/tg1.gif","/images/tg2.gif");
  
  document.write("<span class='TopItem' onclick='AllClose()'><font style='font-size:11pt;'>");
  document.write("<p id='Ttree'></p><br>");
  document.write("</font></span><br>"); 
  
  document.write("<p id='Ttree2'></p>");

  GetModelName("Ttree");

  try {
    const response = await fetch(jsonFile);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    menuData = await response.json(); // Parse the JSON data
    console.log("Menu data loaded:", menuData); // For debugging
    
    document.getElementById("Ttree2").innerHTML = ParseTree(menuData, "");
    
    // initial URL handling logic
    handleInitialPageLoad();
    return;

  } catch (err) {
    console.error("Error loading or parsing menu data:", err);
    // Display a user-friendly error message if the menu can't load
    document.getElementById("Ttree2").innerHTML = "Error loading manual menu. Please try again later.";
  }
}


// --- Adapted ParseTree function ---
function ParseTree(node, PsTree) {
  // `node` is now a JavaScript object representing a node from your JSON structure
  // (e.g., { type: 'menu', id: 5, title: 'Introduction', children: [...] })

  var gNo;
  var Len = 0;
  // Determine length based on node type for correct traversal
  if (node.type === 'root' || node.type === 'menu') {
    if (node.children) { // Ensure children array exists
      Len = node.children.length;
    }
  }

  var Buf = "";
  var CenterBuf = "";
  var BeforeBuf = "<div id=" + node.id; // Use node.id for the div

  if (node.id > 1) BeforeBuf += " style='display:none'"; 
  BeforeBuf += ">";

  for (var i = 0; i < Len; i++) {
    var child = node.children[i]; // Get the child node (which is now a JS object)
    var childType = child.type; // Access type directly

    // Skip 'title', 'color' etc. as they are now direct properties of parent node, not separate child nodes
    if (childType === 'item' || childType === 'menu') {
      // id is now directly from the JSON child node
      var currentId = child.id; 
      gNo = (i == Len - 1) ? 0 : 1; // 0 if last child, 1 otherwise
      gNoArray[currentId] = gNo; // Use currentId for array indexing

      var sTree = PsTree + "<img src='" + dImg[gNo] + "' class='treeimg' align='top'>";

      // Determine ColorFlag directly from JSON
      if (child.color !== undefined) { // Check if 'color' property exists on the JSON node
        ColorFlag[currentId] = child.color;
      } else {
        ColorFlag[currentId] = -1;
      }

      if (childType === "menu") {
        var title = child.title; // Access title directly from JSON node
        openFlag[currentId] = true; // Use currentId for array indexing

        // if (ColorFlag[currentId] == -1) {
          Buf = PsTree + "<span class='fd' onclick='ViewTree(" + currentId + "," + gNo + ")' title='" + title + "'><font class='treedata'><img id='Node" + currentId + "' src='" + pImg[gNo] + "' class='treeimg' align='top'>" + title + "</font></span><br>";
        // } else {
        //   Buf = PsTree + "<span class='fd' onclick='ViewTree(" + currentId + "," + gNo + ")' title='" + title + "'><font class='treedata'><img id='Node" + currentId + "' src='" + pImg[gNo] + "' class='treeimg' align='top'><img id='FD" + currentId + "' src='" + fImg[ColorFlag[currentId] * 2] + "' class='treeimg'  align='top'>" + title + "</font></span><br>";
        // }

        // Check if the menu has children to recurse
        if (child.children && child.children.length > 0) {
          var ChildBuf = ParseTree(child, sTree); // Recursive call with the JSON child node
          if (ChildBuf != "") {
            CenterBuf += Buf + ChildBuf;
          }
        } else {
          CenterBuf += Buf; // If menu has no children, just display its title
        }

      } else if (childType === "item") {
        // All item attributes are direct properties in the JSON node.
        var title = child.title;
        var url = child.url; // Original PDF URL
        var cleanUrlSlug = child.cleanurlslug; // The new SEO-friendly slug
        var fullTitle = child.fulltitle; // The new full title for document.title
        var description = child.description; // The new meta description
        var sDatatype = child.datatype || ""; // Access datatype, default to empty string

        var itemObjectString = JSON.stringify(child).replace(/"/g, '&quot;'); // Escape double quotes for HTML attribute

        if (sDatatype == "sb" || sDatatype == "sup") { // Assuming "sb" and "sup" share similar styling
          CenterBuf += PsTree + "<font class='treedata'><img src='" + rImg[gNo] + "' class='treeimg' align='top'>";
          CenterBuf += "<a id='link" + currentId + "' onclick=\"event.preventDefault(); linkclick(" + itemObjectString + ");\" ";
          CenterBuf += "title='" + title + "' class='" + sDatatype + "' href='" + url + "' target='pdf' class='pdf'>" + title + "</a></font><br>";
        } else {
          CenterBuf += PsTree + "<font class='treedata'><img src='" + rImg[gNo] + "' class='treeimg' align='top'>";
          CenterBuf += "<a id='link" + currentId + "' onclick=\"event.preventDefault(); linkclick(" + itemObjectString + ");\" ";
          CenterBuf += "title='" + title + "' href='" + url + "' target='pdf' class='pdf'>" + title + "</a></font><br>";
        }
      }
    }
  }

  if (CenterBuf != "") {
    sRet = BeforeBuf + CenterBuf + "</div>";
    return (sRet);
  } else {
    return ("");
  }
}

function setPageURL(menuItemObject, useReplaceState = false) {
  const vanityUrl = menuItemObject.cleanurlslug;

  // Update browser history
  if (useReplaceState) {
    // window.top.history.replaceState({ path: vanityUrl }, menuItemObject.fulltitle, vanityUrl);
  } else {
      window.top.history.pushState({ path: vanityUrl }, menuItemObject.fulltitle, vanityUrl);
  }
}

function linkclick(menuItemObject, pastedUrl = false) {
  // Update menu styling
  const linkId = "link" + String(menuItemObject.id);
  if (sBefore != linkId && sBefore != "") document.getElementById(sBefore).style.fontWeight = "normal";
  document.getElementById(linkId).style.fontWeight = "bold";
  sBefore = linkId;


  // The iframe content updates automatically via target="pdf", so we just need to update the URL
  window.top.document.getElementById('pdf').src = menuItemObject.url;
  // Update iFrame html document title.  not realy required as this is an embedded iFrame.
  document.title = menuItemObject.title; 

  //  update the parent window details
  window.top.document.getElementById('pdf').src = menuItemObject.url;
  setPageURL(menuItemObject, pastedUrl);
  updateCanonicalLink(menuItemObject.cleanurlslug);
  updatePageHeader(menuItemObject.title, menuItemObject.description);
}

function updateCanonicalLink(vanityUrl) {
  var parentDocument = window.top.document;
  var existingLink = parentDocument.querySelector("link[rel='canonical']");

  console.log("Updating canonical link to: ", vanityUrl);

  if (existingLink) {
    existingLink.setAttribute('href', vanityUrl);
  } else {
    var newLink = parentDocument.createElement('link');
    newLink.setAttribute('rel', 'canonical');
    newLink.setAttribute('href', vanityUrl);
    parentDocument.head.appendChild(newLink);
  }
}

function updatePageHeader(title, description) {
  // Update the document title
  window.top.document.title = title; 

  // Update the meta description
  var metaDescription = window.top.document.querySelector("meta[name='description']");
  console.log("metaDescription: ", metaDescription);
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
}

function ViewTree(id,n) {
  if(document.getElementById(id)){
    if (window.getComputedStyle(document.getElementById(id)).display === "none"){
      document.getElementById(id).style="display:block";
      document.getElementById("Node"+id).src=mImg[n];
      openFlag[id]=true;
    } else {
      document.getElementById(id).style.display="none";
      document.getElementById("Node"+id).src=pImg[n]
      openFlag[id]=false;
    }
  } else {
    console.log("menu id not found in ViewTree");
  }
}
  
function AllClose(){
  var i = 0;

  for (i = 0; i < openFlag.length; i++) {
    if (openFlag[i] == true) {
      document.getElementById("Node"+i).src=pImg[gNoArray[i]];
      // if (ColorFlag[i]!=-1) {
      //   document.getElementById("FD"+i).src=fImg[ColorFlag[i] * 2];
      // }
      document.getElementById(i).style="display:none";
      openFlag[i]=false;
    }
  }
}

    
function getParamValue(sGetString, sParamName) {
  var sValue = "";
  
  if (sGetString.indexOf(sParamName) >= 0) {
    sValue = sGetString.substring(sGetString.indexOf(sParamName) + sParamName.length);
    if (sValue.indexOf("&") > 0) {
      sValue = sValue.substring(0, sValue.indexOf("&"));
    }
  }
  return unescape(sValue);
}

