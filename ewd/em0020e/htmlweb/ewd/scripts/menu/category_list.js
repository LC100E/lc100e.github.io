



function call_onClickReadMe()
{
	var path = "../../../intro/readme.html";
	var name = "_blank";
	var styles = "width=800,height=620,menubar=yes,toolbar=yes";
	
	var winPrint = window.open(path, name, styles);
}

function call_onClickItemProc( evt, code )
{

	var url = "./title/" + code + ".html";
	showList( url );
	
	if( !isNetscape4() ){
		var divElmList = document.getElementsByTagName("div");
		if( divElmList.length != 0 ){

			var divElm = divElmList.item(0);
			
			resetStyle( divElm.getElementsByTagName("a") );
			resetStyle( divElm.getElementsByTagName("td") );
			
			var elm = getElementByEvent(evt);
			setActiveStyle( getElmA( elm ) );
			setActiveStyle( getElmTD( elm ) );
		}
	}
	
	evt.cancelBubble = true;
}

function call_onMouseOverItemProc( evt )
{
	var elm = getElementByEvent(evt);
	setHoverStyle( getElmA( elm ) );
	setHoverStyle( getElmTD( elm ) );
	
	evt.cancelBubble = true;
}

function call_onMouseOutItemProc( evt )
{
	var elm = getElementByEvent(evt);
	setNomalStyle( getElmA( elm ) );
	setNomalStyle( getElmTD( elm ) );
	
	evt.cancelBubble = true;
}



function showList( url )
{
	window.open(url, "winListMain");
}


function resetStyle( elms )
{
	for( var i=0; i < elms.length; i++ ){
		setNomalStyle(elms[i], true);
	}
}

function setActiveStyle( elm )
{
	elm.className = "list-item-active";
}

function setHoverStyle( elm, blnForce )
{
	if( elm.className != "list-item-active" || blnForce )
		elm.className = "list-item-hover";
}

function setNomalStyle( elm, blnForce )
{
	if( elm.className != "list-item-active" || blnForce )
		elm.className = "list-item";
}



function getElmA( elm )
{
	if( elm.tagName == "A" ){
		return elm;
	}
	else if( elm.tagName == "TD" ){
		return elm.getElementsByTagName("a")[0];
	}
}

function getElmTD( elm )
{
	if( elm.tagName == "A" ){
		return elm.parentNode;
	}
	else if( elm.tagName == "TD" ){
		return elm;
	}
}
