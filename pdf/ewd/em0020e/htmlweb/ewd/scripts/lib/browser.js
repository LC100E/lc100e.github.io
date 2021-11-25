/*
   Copyright (c) 2002 SHINTEC HOZUMI Co.,LTD.
   All Rights Reserved. 
*/



function isNetscape4()
{
	if( document.layers ){
		return true;
	}
	else{
		return false;
	}
}



function getElementByEvent( evt )
{
	var elm = evt.srcElement;
	if( elm == null ){
		elm = evt.target;
		if( elm.nodeName == "#text" ){
			elm = elm.parentNode;
		}
	}
	
	return elm;
}
