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

function cutExtension( fileName )
{
	var pos = fileName.lastIndexOf(".");
	if( pos < 0 )	return fileName;

	return fileName.slice( 0, pos );
}
