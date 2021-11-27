function showText(){
	var fileName = getCurrentDspFile();
	if( fileName != null )	openSubWnd( "text/" + fileName, "ewd_sub" );
}

function showConnector(){
	var fileName = getCurrentDspFile();
	if( fileName == null ){
		alert( "system code error" );
		return;
	}
	var code = cutExtension(fileName);
	openSubWnd( "./conn.html?code=" + code, "ewd_sub" );
}

function showRelayLocation(){
	confirm("show Relay Location");
}

function showWiringRouting(){
	confirm( "show Wiring Routing" );
}

function showLocation(){
	var fileName = getCurrentDspFile();
	if( fileName == null ){
		alert( "system code error" );
		return;
	}
	var code = cutExtension(fileName);
	const path = getFilePath(getCurrentPDFName(), 3); // levels up from m_overall/overall/
	openSubWnd( path + "location.html?code=" + code, "ewd_sub" );
	// openSubWnd( "../location.html?code=" + code, "ewd_sub" );
}

function showLocationList(){
	const path = getFilePath(getCurrentPDFName(), 3); // levels up from m_overall/overall/
	openSubWnd( "./components/ewd_loclist.html?path=" + path, "ewd_sub" );
}

function showConnectorList(){
	const path = getFilePath(getCurrentPDFName(), 3); // levels up from m_overall/overall/
	openSubWnd( "./components/ewd_connlist.html?path=" + path, "ewd_sub" );
}


function printPDF(){
	var fileName = getCurrentDspFile();
	const path = getFilePath(getCurrentPDFName(), 2); // levels up from m_overall/overall/
	if( fileName != null )	openSubWnd( path + "print/" + fileName, "ewd_print" );
}

function getCurrentDspFile()
{
	if( parent == null ){
		alert( "parent not found" );
		return null;
	}
	
	var fileName = getFileName( getCurrentPDFName() );
	if( fileName.indexOf(".pdf") == -1 ){
		alert( "destination flie not found" );
		return null;
	}
	return fileName;
}

function openSubWnd(urlStr, wndName)
{
	w = window.open( urlStr, wndName,
		"left = 0, top = 0, width=715, height=570, toolbar=no, menubar=no, location=no, status=no, resizable=yes, scrollbars=yes" );
	return w;
}

function mouseDown_btn(id)
{
	document.all(id).className = "buttonDown";
}

function mouseUp_btn(id)
{
	document.all(id).className = "button";
}

function mouseOut_btn(id)
{
	document.all(id).className = "button";
}
