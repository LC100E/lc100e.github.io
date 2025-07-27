


function call_onLoadProc()
{
	if( !isNetscape4() ){
		var strTableID = "rl_" + getMapCode();
		var elmTable = document.getElementById(strTableID);
		
		if( elmTable != null ){
			var elmTD = elmTable.getElementsByTagName("td")[0];
			var elmA  = elmTable.getElementsByTagName("a")[0];
			
			setActiveStyle(elmTD);
			setActiveStyle(elmA);
			
			if( elmTable.scrollIntoView ){
				elmTable.scrollIntoView(true);
			}
		}
	}
}



function call_onClickItemProc( evt, code )
{
	var url = "../../relay/main/" + code + ".html";
	showMap( url );
	
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



function showMap( url )
{
	window.open(url, "winMain");
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




function getMapCode()
{
	var objForm = window.self.document.forms[0];
	return objForm.elements["code"].value;
}

function getMapType()
{
	var objForm = window.self.document.forms[0];
	return objForm.elements["type"].value;
}

function getMapFig()
{
	var objForm = window.self.document.forms[0];
	return objForm.elements["fig"].value;
}
