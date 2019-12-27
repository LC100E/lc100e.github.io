var initPage = 0;
var prevPages = 0;
var nextPages = 0;


function getPageString( fileName )
{
	var fName = getFileName(fileName);
	return cutExtension(fName);

}

function getCurrentPage()
{

	// get page number from current pdf file
	var pdfName = getCurrentPDFName();
	if( pdfName == null )	return -1;

	return getPageString(pdfName);

/*
	// get page number from menu frame
	var pageStr = document.all.n_page.innerHTML;
	if( pageStr.length < 5 )	return -1;
	return pageStr.substr(5);
*/
}


function gotoPage( nPage )
{
	dspPage(nPage);
	setBtnState();
	parent.setPDF( nPage );

}

function page(n)
{
	var nPage = parseInt(getCurrentPage());
	if( nPage < 0 ){
		alert( "page error" );
		return;
	}
	nPage = parseInt(nPage) + parseInt(n);
	prevPages = parseInt(prevPages) + parseInt(n);
	nextPages = parseInt(nextPages) - parseInt(n);

	gotoPage( nPage );

}

function setBtnState()
{
	setPrevBtnState( prevPages > 0 );
	setNextBtnState( nextPages > 0 );

}

function setPrevBtnState( bState ){
	if( bState ){
		document.all.prevBtn.innerHTML = "<input type='button' name='prev_page' value=' &lt; ' onclick='page(-1)'>";
	}
	else{
		document.all.prevBtn.innerHTML = "<input type='button' disabled name='prev_page' value=' &lt; '>";
	}
}

function setNextBtnState( bState ){
	if( bState ){
		document.all.nextBtn.innerHTML = "<input type='button' name='next_page' value=' &gt; ' onclick='page(1)'>";
	}
	else{
		document.all.nextBtn.innerHTML = "<input type='button' disabled name='next_page' value=' &gt; '>";
	}
}


function dspPage( nPage )
{
	document.all.n_page.innerHTML = "page " + (parseInt(nPage) - parseInt(initPage) + 1);
}


function onload_page()
{
	if( initPage != 0 )	return;

	if( parent == null ){
		alert("Parent window not found");
		return;
	}
	setPageInfo( parent.getPageParam() );
}

// setup initial page information from xml
function setPageInfo(nPage)
{
	resetPageInfo();

	var list = getPageList();
	if( list == null ){
		alert("page info not found");
		return;
	}

	pageNodeList = list.getElementsByTagName("PageList/page");
	if( pageNodeList == null ){
		alert("page info not found");
		return;
	}

	for( var i = 0; i < pageNodeList.length; i++ ){
		var pageNo = pageNodeList[i].getAttribute( "no" );
		if( parseInt(pageNo) == parseInt(nPage) ){
			initPage = nPage;
			prevPages = pageNodeList[i].getAttribute("prev");
			nextPages = pageNodeList[i].getAttribute("next");
// confirm( "p: " + nPage + "\nPrev: " + prevPages + "\nNext: " + nextPages );
			break;
		}
	}
	setBtnState();
}


function resetPageInfo()
{
	initPage = 0;
	prevPages = 0;
	nextPages = 0;
}
