


function call_onClickItemProc( evt, code )
{
	showList( code );
	
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



function showList( code )
{
	if( code != "help" ){
		var url = "./" + code + ".html";
		window.open(url, "_self");
	}
	else{

		var url = "../howto/index.html";
		window.open(url, "_self");
	}
}


function setHoverStyle( elm, blnForce )
{
	if( elm.className != "titlelist-item-active" || blnForce )
		elm.className = "titlelist-item-hover";
}

function setNomalStyle( elm, blnForce )
{
	if( elm.className != "titlelist-item-active" || blnForce )
		elm.className = "titlelist-item";
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
