function setbtnimage(status, PsBaseFile, PoObj){
    if (status==0) {
      document.images[PoObj].src='../images/' + PsBaseFile + '1.gif';
    }else if (status==1){
      document.images[PoObj].src='../images/' + PsBaseFile + '2.gif';
    }else{
      document.images[PoObj].src='../images/' + PsBaseFile + '3.gif';
    }
  }

  function frameclose(){
    window.top.document.getElementById("nav").style.display = "none";
    window.top.document.getElementById("content").style.gridColumn = "1 / span 2";
    window.top.document.getElementById("pdf").style.gridRow = "2 / span 1";
    window.top.document.getElementById("frameopen").style.display="block";
    
  }
  function frameopen(){
    window.top.document.getElementById("nav").style.display = "grid";
    window.top.document.getElementById("content").style.gridColumn = "2 / span 1";
    window.top.document.getElementById("pdf").style.gridArea = "pdf";
    window.top.document.getElementById("frameopen").style.display="none";
  }
