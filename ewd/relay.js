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
	console.debug("pdfName " + pdfName);
	console.debug("page string " + getPageString(pdfName));
	return getPageString(pdfName);

}


function gotoPage( nPage )
{
	dspPage(nPage);
	setBtnState();
	checkInnerCircuitExist( nPage );

	parent.setPDF( getFilePath(getCurrentPDFName()) + nPage );

}

function page(n)
{
	
	var nPage = parseInt(getCurrentPage());
	console.log("current page: " + nPage);
	console.log("current window pathname: " + window.location.pathname);
	if( nPage < 0 ){
		alert( "page error" );
		return;
	}
	nPage = parseInt(nPage) + parseInt(n);
	prevPages = parseInt(prevPages) + parseInt(n);
	nextPages = parseInt(nextPages) - parseInt(n);

	// skip blank page
	if( checkBlankPage( nPage ) == true ){
		if( n > 0 )	nPage++;
		else nPage--;
	}

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
	if( initPage != 0 )	{
		console.log("onload_page returing as already initialised");
		return;
	}

	if( parent == null ){
		alert("Parent window not found");
		return;
	}
	console.log("onload page param ", parent.getPageParam());
	console.log("parent path: " + parent.location.pathname);
	var { pageParam, path } = parent.getPageParam();
	console.log("file: " + pageParam + " path: " + path);
	setPageInfo( pageParam, path );
}

// setup initial page information from xml
function setPageInfo(nPage, path)
{
	console.log("page: " + nPage + " path: " + path);
	resetPageInfo();


	var pageNode

	pageNode = getPageNode( nPage )

	if( pageNode == null )	return;

	checkInnerCircuitExist( nPage )
		//------

	prevPages = pageNode.getAttribute("prev");
	nextPages = pageNode.getAttribute("next");

	initPage = nPage - prevPages;

	dspPage(nPage);

	setBtnState();
}


function openSubWnd(urlStr, wndName)
{
	w = window.open( urlStr, wndName,
		"left = 0, top = 0, width=715, height=570, toolbar=no, menubar=no, location=no, status=no, resizable=yes, scrollbars=yes" );

	return w;
}

function checkBlankPage( nPage )
{
	var pageNode;

	pageNode = getPageNode(nPage);
	console.log("pageNode = " + pageNode);

	if( pageNode == null )	return false;

	var sp = pageNode.getAttribute("space");
	if( sp != null && sp.toUpperCase() == "Y" ){
		return true;
	}

	return false;
}


function resetPageInfo()
{
	initPage = 0;
	prevPages = 0;
	nextPages = 0;
}

function checkInnerCircuitExist( nPage )
{
	var node;
	var innerNodeList;

	node = getPageNode(nPage);
	console.log("pageNode = " + node);

	innerNodeList = node.getElementsByTagName("inner");
	if( innerNodeList.length > 0 ){
		document.all.btn_Inner.style.visibility="visible";
	}
	else{
		document.all.btn_Inner.style.visibility="hidden";
	}
}

function navigateToInner()
{
	var pageNode;
	var arrayPage;

	pageNode = getPageNode( getCurrentPage() );

	if( pageNode == null ){
		alert("Link Info Erro: Inner Circuit ");
		return;
	}

	arrayPage = getInnerCircuitPages(pageNode);

	if( arrayPage.length <= 0 ){
		alert("Link Info Erro: Inner Circuit ");
		return;
	}

	var param = makePageParam( arrayPage );


//	parent.navigate("inner.html" + param);
	console.log("inner page to open: " + "inner.html" + param);
	openSubWnd( "inner.html" + param, "ewd_inner");
}

function openSubWnd(urlStr, wndName)
{
	w = window.open( urlStr, wndName,
		"left = 0, top = 0, width=715, height=570, toolbar=no, menubar=no, location=no, status=no, resizable=yes, scrollbars=yes" );

	return w;
}


function makePageParam( arrayPage )
{

	var i;
	var resultStr = "";

	if( arrayPage == null )	return resultStr;
	if( arrayPage.length <= 0 )	return resultStr;

	resultStr = "?page=" + arrayPage[0];

	for( i = 1; i < arrayPage.length; i++ ){
		resultStr += "+" + arrayPage[i];
	}

	return resultStr;
}


function getInnerCircuitPages( node )
{
	var innerNodeList;
	var rs = new Array();
	var i;

	innerNodeList = node.getElementsByTagName("inner");

	for( i = 0; i < innerNodeList.length; i++ ){
		rs[rs.length] = innerNodeList[i].getAttribute("no");
	}

	return rs;
}

// async
function getPageNode(nPage)
{
	var list =  getPageList();
	console.log("page node: " + nPage);
	console.log("getPageNode list: " + list);
	if( list == null ){
		console.log("page Node info not found.  Page: " + nPage);
		alert("page info not found");
		return null;
	}
	// pageNodeList = list.getElementsByTagName("PageList/page");
	pageNodeList = list.getElementsByTagName("page");
	console.log("pageNodeList ", pageNodeList);
	if( pageNodeList == null ){
		console.log("page Node info not found.  Page: " + nPage);
		alert("page Node info not found");
		return null;
	}

	for( var i = 0; i < pageNodeList.length; i++ ){
		var pageNo = pageNodeList[i].getAttribute( "no" );
		if( parseInt(pageNo) == parseInt(nPage) ){
			console.log("****** page ", pageNodeList[i]);
			return pageNodeList[i];
		}
	}
	return null
}
