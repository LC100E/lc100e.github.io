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
	return(str[str.length-1]);
}

function getFilePath(strURL, levelsUp=1)
{
	var regExp = /\/|\\/;
	var str = strURL.split( regExp );
	var path = str.slice( 0, -levelsUp )
	return(path.join("/") + "/");
}

function cutExtension( fileName )
{
	var pos = fileName.lastIndexOf(".");
	if( pos < 0 )	return fileName;

	return fileName.slice( 0, pos );
}
