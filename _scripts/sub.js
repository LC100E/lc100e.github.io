async function GetTitleName(id) {
  title = await L_GetModelName(id);
  document.getElementById(id).innerHTML = title;
  return;
}

async function L_GetModelName() {
  var xmlFile="/_xml/model.xml";
  try {
    let xmlRoot = await loadXML(xmlFile);
    model = xmlRoot.getElementsByTagName("modelname")[0].textContent;
    return(model);
  }
  catch(err) {
    console.log("error: ",err);
    return;
  }
}

var xmlList = null;

function loadXML(xmlFile) {
  var xhttp = new XMLHttpRequest();
  return new Promise(function(resolve, reject) {
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (xhttp.status >= 300) {
          reject("Error, status code = " + xhttp.status)
        } else {
          xmlList =  xhttp.responseXML;
          resolve (xmlList);
        }
      }
    };
    xhttp.open("GET", xmlFile, true);
    xhttp.send();
    return;
  }); 
}

function getPageList() {
	return xmlList; 
}

async function GetModelName(id) {
  let model =  await L_GetModelName();
  document.getElementById(id).innerHTML = model
  return;
}

async function GetModelCodes(id) {
  var xmlFile="/_xml/model.xml";
  try {
    let XMLroot = await loadXML(xmlFile);
    codes = getCodes(XMLroot);
    document.getElementById(id).innerHTML = codes;
    return;
  } catch (err) {
    console.log("error: ",err)
  }

  function getCodes(xmlDoc) {
    var i, j, len, xmlDoc;
    var sRet ="";
    
    var codes = xmlDoc.getElementsByTagName("item");
    len = codes.length;
    for(var i=0;i<len;i++) {
      if (sRet!="") sRet += "<BR>";
      sRet += codes[i].textContent;
    }
    return(sRet)
  }
}


async function GetCopyrightYear(id) {
  var xmlFile="/_xml/model.xml";
  try {
    let XMLroot = await loadXML(xmlFile);
    document.getElementById(id).innerHTML = getCopyright(XMLroot);
    return;
  } catch (err) {
    console.log("error: ",err)
  }

  function getCopyright(xmlDoc) {
    var copyright = xmlDoc.getElementsByTagName("copyrightyear")[0].textContent;
    return copyright;
  }
}

