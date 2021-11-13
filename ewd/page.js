var pageParam = -1;

async function document_onload(){		
    if( window.location.search != "" ){
        pageParam = getParam(window.location.search, "page");
        path = getParam(window.location.search, "path");
        await menuFrame.loadXML(path + "pages.xml")
        setPDF( path + pageParam );
        menuFrame.setPageInfo( pageParam, path );
    }
}

function document_onload_overall(){

    if( window.location.search != "" ){
        // setPDF( getSystemCode(window.location.search) );
        code = getParam(window.location.search, "code");
        path = getParam(window.location.search, "path");
        setPDF( path + "overall/" + code );
    }

}

function getPageParam(){ 
    return { pageParam, path };
}

function getParam( query, param ){
    var val = "";

    var ss=devideParam(query);

    for( var i = 0; i < ss.length; i++ ){
        if( ss[i] == param ){
            if( i < ss.length - 1){
                val = ss[i + 1];
                break;
            }
        }
    }
    return val;

}

function devideParam(str)	{
    var regExp=/&|=/;

    str = str.substr(1);
    return str.split(regExp);
}

function getPDFName(){
    return document.getElementById("pdfFrame").src;
}

function setPDF(url){
    document.getElementById("pdfFrame").src = ( url + ".pdf" );	
}

