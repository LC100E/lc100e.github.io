async function init(){
    id=0;
    linkid=0;
    openFlag=new Array;
    ColorFlag=new Array;
    gNoArray=new Array;
    pImg=new Array("/images/plas1.gif","/images/plas2.gif");
    mImg=new Array("/images/minas1.gif","/images/minas2.gif");
  
    fImg=new Array("/images/close_g.gif","/images/open_g.gif",
                   "/images/close_y.gif","/images/open_y.gif",
                   "/images/close_r.gif","/images/open_r.gif",
                   "/images/close_p.gif","/images/open_p.gif",
                   "/images/close_b.gif","/images/open_b.gif",
                   "/images/close_lb.gif","/images/open_lb.gif");
  
    dImg=new Array("/images/tg3.gif","/images/tg4.gif");
    rImg=new Array("/images/tg1.gif","/images/tg2.gif");
    
    document.write("<span class='TopItem' onclick='AllClose()'><font style='font-size:11pt;'>");
    document.write("<p id='Ttree'></p><br>");
    document.write("</font></span><br>"); 
    
    document.write("<p id='Ttree2'></p>");
  
    GetModelName("Ttree");
  
    var xmlFile="/xml/pdf.xml";
    let xmlDoc = await loadXML(xmlFile);
    HomePath="/manual";
    try {
      xmlDoc = xmlDoc.getElementsByTagName("pdf");
      xmlDoc = xmlDoc[0];
      document.getElementById("Ttree2").innerHTML = ParseTree(xmlDoc,"");
      return;
    } catch (err) {
      console.log("error: ", err);
    }
    
  }
  
  // function loadPDFxml(xmlFile, id) {
  //   var xhttp = new XMLHttpRequest();
  //   return new Promise(function(resolve, reject) {
  //     xhttp.onreadystatechange = function() {
  //       if (this.readyState == 4) {
  //         if (xhttp.status >= 300) {
  //           reject("Error, status code = " + xhttp.status)
  //         } else {
  //           resolve (xhttp.responseXML);
            // xmlDoc = xhttp.responseXML;
            // xmlDoc = xmlDoc.getElementsByTagName("pdf");
            // xmlDoc = xmlDoc[0];
            // document.getElementById(id).innerHTML = ParseTree(xmlDoc,"");
      //     }
      //   }
      // };
  
  //     xhttp.open("GET", xmlFile, true);
  //     xhttp.send();
  //     return;
  //   });
  // }
  
  // function loadPDFxml(xmlFile, id) {
  //   var xhttp = new XMLHttpRequest();
  //   return new Promise(function(resolve, reject) {
  //     xhttp.onreadystatechange = function() {
  //       if (this.readyState == 4) {
  //         if (xhttp.status >= 300) {
  //           reject ("Error, status code = " + xhttp.status)
  //         } else {
  //           resolve (xhttp.responseXML);
  //         }
  //       }
  //     };
  
  //     xhttp.open("GET", xmlFile, true);
  //     xhttp.send();
  //   });
  // }
  
  function ParseTree(poNode, PsTree) {
    var gNo;
    var ItemCnt = 0;
    var Len=poNode.childNodes.length; // �q�m�[�h���̎擾
    var Buf="";
    var CenterBuf = "";
    var BeforeBuf="<div id="+ id;
  
    if(id>0) BeforeBuf+=" style='display:none'"; // �ŏ��̃m�[�h�ȊO�͑S�ĕ�����Ԃɂ���
    BeforeBuf+=">";
  
    
    for(var i=0;i < Len;i++) {
      nodename = poNode.childNodes[i].nodeName;
      
      if(nodename!="title" && nodename!="color" && nodename!="#text"){
        // if not 'title' or 'color' then it's a menu, item or url
        id++;
        if(i==Len-1) gNo=0; else gNo=1; // �Ō�̃m�[�h�̏ꍇ gNo=0 ����ȊO gNo=1
        gNoArray[id] = gNo;
        
        var sTree = PsTree + "<img src='"+dImg[gNo]+"' class='treeimg' align='top'>"; 
        var child = poNode.childNodes.item(i); //menu item
  
        if(child.childNodes.length > 1){
          if(child.childNodes[1].nodeName == "color"){
            ColorFlag[id]=child.childNodes[1].textContent;
          }else{
            ColorFlag[id]=-1;
          }
        }else{
            ColorFlag[id]=-1;
        }
        
        if(child.nodeName=="menu"){
          var title = child.childNodes[1].textContent; //menu title
          // �v�f����"menu"�̏ꍇ�̏���
          openFlag[id]=true;
            if (ColorFlag[id]==-1) {
              Buf= PsTree + "<span class='fd' onclick='ViewTree("+id+","+gNo+")' title='" + title + "'><font class='treedata'><img id='Node"+id+"' src='"+pImg[gNo]+"' class='treeimg' align='top'>" + title + "</font></span><br>"; // \n
            } else {
              Buf= PsTree + "<span class='fd' onclick='ViewTree("+id+","+gNo+")' title='" + title + "'><font class='treedata'><img id='Node"+id+"' src='"+pImg[gNo]+"' class='treeimg' align='top'><img id='FD"+id+"' src='"+fImg[ColorFlag[id] * 2]+"' class='treeimg'  align='top'>" + title + "</font></span><br>"; 
            }
          if(child.hasChildNodes) {
                var ChildBuf = ParseTree(child, sTree); //�q�m�[�h������ꍇ�A�ċA����
                if (ChildBuf!=""){
                  // �q�m�[�h�ɕ\���Ώۃf�[�^���������ꍇ
                  CenterBuf+=Buf + ChildBuf;
                }
          }else{
                CenterBuf=Buf;
          }
        }else if(child.nodeName=="item"){
          linkid++;
          var iNodeCnt = child.childNodes.length;
          var sNodeName="";
          var sNodeValue="";
          var sDatatype="";
          var sStDate="";
          var sEdDate="";
          for(var j=1;j < iNodeCnt;j+=2) {
            sNodeName = child.childNodes[j].nodeName;
            sNodeValue = child.childNodes[j].textContent;
  
            if(sNodeName=="url"){
              var title = child.childNodes[j-1].textContent;
               var url = HomePath + sNodeValue; // URL
            }else if(sNodeName=="datatype"){
              sDatatype = sNodeValue;      // �f�[�^�^�C�v�̎擾
            }else if(sNodeName=="stdate"){
              sStDate = sNodeValue;          // �K���J�n�N���̎擾
            }else if(sNodeName=="eddate"){
              sEdDate = sNodeValue;          // �K���I���N���̎擾
            }
          }
          if(sDatatype=="sb"){
            CenterBuf+= PsTree + "<font class='treedata'><img src='" + rImg[gNo] + "' class='treeimg' align='top'><a id='link" + linkid + "' onclick=\"linkclick('link" + linkid + "')\" title='" + title + "' class='" + sDatatype + "' href='"+url+"' target='pdf' class='pdf'>" + title + "</a></font><br>";
          }else if(sDatatype=="sup"){
            CenterBuf+= PsTree + "<font class='treedata'><img src='" + rImg[gNo] + "' class='treeimg' align='top'><a id='link" + linkid + "' onclick=\"linkclick('link" + linkid + "')\" title='" + title + "' class='" + sDatatype + "' href='"+url+"' target='pdf' class='pdf'>" + title + "</a></font><br>"; 
          }else{
            CenterBuf+= PsTree + "<font class='treedata'><img src='" + rImg[gNo] + "' class='treeimg' align='top'><a id='link" + linkid + "' onclick=\"linkclick('link" + linkid + "')\" title='" + title + "' href='" + url + "'  target='pdf' class='pdf'>" + title + "</a></font><br>";
          }
        }
      } else {
        // �v�f����"title" or "color" �̏ꍇ�͉����������Ȃ�
        // do nothing
      }
    }
    if (CenterBuf!=""){
      sRet = BeforeBuf + CenterBuf + "</div>";
      return(sRet);
    }else{
      return("");
    }
  }
  
  var sBefore = "";
  
  function linkclick(psObj) {
    if (sBefore != psObj && sBefore != "") document.all(sBefore).style.fontWeight = "normal";
    document.all(psObj).style.fontWeight = "bold";
    sBefore = psObj;
  }
  
  function ViewTree(id,n) {
    if(document.getElementById(id)){
      if (window.getComputedStyle(document.getElementById(id)).display === "none"){
        document.getElementById(id).style="display:block";
        document.getElementById("Node"+id).src=mImg[n];
        openFlag[id]=true;
      } else {
        document.getElementById(id).style.display="none";
        document.getElementById("Node"+id).src=pImg[n]
        openFlag[id]=false;
      }
    } else {
      console.log("menu id not found in ViewTree");
    }
  }
  
  function AllClose(){
    var i = 0;
  
    for (i = 0; i < openFlag.length; i++) {
      if (openFlag[i] == true) {
        document.getElementById("Node"+i).src=pImg[gNoArray[i]];
        if (ColorFlag[i]!=-1) {
          document.getElementById("FD"+i).src=fImg[ColorFlag[i] * 2];
        }
        document.getElementById(i).style="display:none";
        openFlag[i]=false;
      }
    }
  }
  
  // function finddisp()
  // {
  //   parent.location.href = "./menu2.html"
  // }
  
  function getParamValue(sGetString, sParamName) {
    var sValue = "";
    
    if (sGetString.indexOf(sParamName) >= 0) {
      sValue = sGetString.substring(sGetString.indexOf(sParamName) + sParamName.length);
      if (sValue.indexOf("&") > 0) {
        sValue = sValue.substring(0, sValue.indexOf("&"));
      }
    }
    return unescape(sValue);
  }
  
  