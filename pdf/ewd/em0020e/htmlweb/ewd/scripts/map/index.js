


function getPrintPath(relativePath)
{
	var path = "";
	

	if( window.winDiagConnList == null ){
		path = window.winFig.location.href;
	}
	else{
		var code = window.winDiagConnList.getMapFig();
		var map  = window.winDiagConnList.getMapType();
		
		var dirName;
		if( map == "system" || map == "overall" ){
			dirName = "print";
		}
		else{
			dirName = "pdf";
		}
		
		path = relativePath + map + "/" + dirName + "/" + code + ".pdf";
	}
	
	return path;
}


function getOutlinePath(relativePath)
{
	var code = window.winDiagConnList.getMapFig();
	var map  = window.winDiagConnList.getMapType();
	
	return relativePath + map + "/outline/" + code + ".html";
}
