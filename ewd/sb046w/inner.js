var arrayPage;
var pageIndex;

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
}

function initPageInfo( pageInfo )
{
	arrayPage = pageInfo;
	pageIndex = 0;
	dspPage(pageIndex);
	setBtnState();
}

function page(nDirect)
{
	if( nDirect < 0 ){
		pageIndex--;
	}
	else{
		pageIndex++;
	}
	if( pageIndex < 0 || pageIndex > arrayPage.length - 1 )	return;

	parent.setPDF(arrayPage[pageIndex]);
	dspPage(pageIndex);
	setBtnState();
}

function setBtnState()
{
	setPrevBtnState( pageIndex != 0 );
	setNextBtnState( pageIndex != ( arrayPage.length - 1) );

}

function dspPage( nIndex )
{
	document.all.n_page.innerHTML = "page " + (parseInt(nIndex) + 1);
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

