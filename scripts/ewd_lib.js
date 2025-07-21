var pageParam = -1;
var arrayPage;

function goToHomePage() {
	// This will navigate the browser to your index.html page
	window.top.location.href = "/index.html";
}



async function document_onload(){		
	if( window.location.search != "" ){
		pageParam = getParam(window.location.search, "page");
		path = getParam(window.location.search, "path");
		await menuFrame.loadXML(path + "pages.xml")
		setPDF( path + pageParam );
		menuFrame.setPageInfo( pageParam, path );
	}
}

function document_onload_overall() {
	if( window.location.search != "" ){
		code = getParam(window.location.search, "code");
		path = getParam(window.location.search, "path");
		setPDF( path + "overall/" + code );
	}
}
  
function document_onload_inner() {
	if( window.location.search != "" ){
	  path = getParam(window.location.search, "path");
	  document.getElementById('menuFrame').src = path + "connector_list.html";
	}
}

function document_onload_inner2() {
	if( window.location.search != "" ){
		pageParam = getParam(window.location.search, "page");
		path = getParam(window.location.search, "path");

		arrayPage = pageParam.split("+");
		if( arrayPage == null )	return;
		
		setPDF( path + arrayPage[0] );
		i_menuFrame.initPageInfo( arrayPage );
	} else {
		console.log("search is blank");
	}

}
  
function document_onload_connlist() {
	if( window.location.search != "" ){
	  path = getParam(window.location.search, "path");
	  document.getElementById('menuFrame').src = path + "seepage_list.html";
	}
}

function getCurrentPDFName() {
	if( parent != null ){
		return (parent.getPDFName());
	}
	else{
		alert( "error occured" );
	}
}

function getFileName(strURL) {
	var regExp = /\/|\\/;
	var str = strURL.split( regExp );
	return(str[str.length-1]);
}

function getFilePath(strURL, levelsUp=1) {
	var regExp = /\/|\\/;
	var str = strURL.split( regExp );
	var path = str.slice( 0, -levelsUp )
	return(path.join("/") + "/");
}

function cutExtension( fileName ) {
	var pos = fileName.lastIndexOf(".");
	if( pos < 0 )	return fileName;

	return fileName.slice( 0, pos );
}

function devideParam(str) {
    var regExp=/&|=/;

    str = str.substr(1);
    return str.split(regExp);
}

function getParam( query, param ) {
    var val = "";
    var ss=devideParam(query);

    for( var i = 0; i < ss.length; i++ ){
        if( ss[i] == param ){
            if( i < ss.length - 1){
                val = ss[i + 1];
                break;
            }
        }
    }
    return val;
}

function getPageParam() { 
    return { pageParam, path };
}

function getPDFName() {
    return document.getElementById("pdfFrame").src;
}

function setPDF(url) {
    document.getElementById("pdfFrame").src = ( url + ".pdf" );	
}

function getPageArray() {
	return arrayPage; 
}