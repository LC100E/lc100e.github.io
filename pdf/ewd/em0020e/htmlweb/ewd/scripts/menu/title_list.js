/*
   Copyright (c) 2002 SHINTEC HOZUMI Co.,LTD.
   All Rights Reserved. 
*/



function call_onClickItemProc( evt, code, map )
{
	var url = "../../../" + map + "/main/" + code + ".html";
	showList( url );
	
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
	window.open(url, "winMain");
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
