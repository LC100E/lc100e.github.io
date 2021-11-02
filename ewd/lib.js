function getCurrentPDFName()
{
	if( parent != null ){
		return (parent.getPDFName());
	}
	else{
		alert( "error occured" );
	}
}

function getFileName(strURL)
{
	var regExp = /\/|\\/;
	var str = strURL.split( regExp );
	console.debug("file input " + strURL + " output " + str[str.length-1]);
	return(str[str.length-1]);
}

function getFilePath(strURL, levelsUp=1)
{
	console.debug("strURL: " + strURL + " levelsUp: " + levelsUp);
	var regExp = /\/|\\/;
	var str = strURL.split( regExp );
	var path = str.slice( 0, -levelsUp )
	console.debug("file path " + path.join("/") + "/");
	return(path.join("/") + "/");
}

function cutExtension( fileName )
{
	var pos = fileName.lastIndexOf(".");
	if( pos < 0 )	return fileName;

	return fileName.slice( 0, pos );
}
