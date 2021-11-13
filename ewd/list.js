var bSelectedID = "";

function selectItem(idSel)
{
	nID = "id" + idSel;
	if( bSelectedID != "" ){	
		document.all(bSelectedID).className = "item";
	}
	document.all(nID).className = "selectedItem";
	bSelectedID = nID;
}
