


var g_flgPopup = false;


function call_runOnClickTop()
{
	window.open("../../../htmlweb/index.html", "_top");
	
	hidePopup();
}


function call_runOnClickBack()
{

	parent.winMain.history.back();
	
	hidePopup();
}


function call_runOnClickNew()
{
	window.open("../../../htmlweb/index.html", "_blank");
	
	hidePopup();
}

function call_runOnClickPrint()
{
	var path = "";
	

	if( parent.winMain.getPrintPath != null ){
		path = parent.winMain.getPrintPath("./");
	}
	

	if( path != "" ){
		var winPrint = window.open(path, "PrintWindow", "width=600,height=480");

	}
	

	hidePopup();
}




function call_runOnClickLocation()
{
	showMenu("location");
	
	hidePopup();
}

function call_runOnClickDiagram()
{
	if( g_flgPopup ){
		hidePopup();
	}
	else{
		showPopupDiagram();
	}
}

function call_runOnClickList()
{
	showListConn();
	
	hidePopup();
}

function call_runOnClickIntro()
{
	showMenu("intro");
	
	hidePopup();
}

function call_runOnClickPopupItem(code)
{
	switch( code )
	{
		case "diag_overall_category":
			showMenu("overall_category");
			break;
			
		case "diag_overall_location":
			showMenu("overall_location");
			break;
			
	}
	
	hidePopup();
}


function showPopupDiagram()
{
	var objForm = window.document.forms[0];
	
	var objPopup;
	if( isNetscape4() ){
		objPopup = document.layers["d_layPopupDiagram"];
		objPopup.top  = 5;
		objPopup.left = (window.innerWidth / 3) + parseInt(objForm.elements["submenu-loc-lay"].value);
		objPopup.visibility = "show";
	}
	else{
		objPopup = document.getElementById("d_divPopupDiagram");
		objPopup.style.position = "absolute";
		objPopup.style.top  = 5;
		objPopup.style.left = objForm.elements["submenu-loc-div"].value;
		objPopup.style.visibility = "visible";
	}
	
	g_flgPopup = true;
}



function hidePopup()
{
	var objPopup;
	if( isNetscape4() ){
		objPopup = document.layers["d_layPopupDiagram"];
		objPopup.visibility = "hidden";
		
		
	}
	else{
		objPopup = document.getElementById("d_divPopupDiagram");
		objPopup.style.visibility = "hidden";
		
		
	}
	
	g_flgPopup = false;
}





function showMenu( strMenuID )
{
	switch( strMenuID )
	{
		case "location":
			window.open("./menu/location/title/title.html", "winMain");
			break;
		
		case "system":
			window.open("./menu/system/index.html", "winMain");
			break;
		
		case "overall_category":
			window.open("./menu/system/index.html", "winMain");
			break;
		
		case "overall_location":
			window.open("./menu/system/location/title.html", "winMain");
			break;
		
		case "intro":
			window.open("../intro/top.html", "winMain");
			break;
		
	}
}

function showMap( code, map )
{
	var url = "./" + map + "/main/" + code + ".html";
	window.open(url, "winMain");
}

function showListConn()
{
	window.open("./connector/index.html", "winMain");
}
