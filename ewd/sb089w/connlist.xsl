<?xml version="1.0"?> 
<xsl:stylesheet xmlns:xsl="http://www.w3.org/TR/WD-xsl">
	<xsl:template match="/">
		<html>
			<HEAD>
				<META http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
				<META http-equiv="Content-Style-Type" content="text/css" />
				<LINK REL="STYLESHEET" TYPE="text/css" HREF="menu.css"/>
				<script type="text/javascript">
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
				</script>
			</HEAD>
			<body>
				<xsl:eval>counterClear()</xsl:eval>
				<xsl:apply-templates select="ConnList"/>
			</body>
		</html>

	</xsl:template>

	<xsl:template match="ConnList">
		<font size="-1"><b><xsl:value-of select="@sysname" /></b></font>
		<div class="itemList">
			<xsl:for-each select="item">
				<xsl:if test="./@type['conn' $eq$ .]">
					<div class="item">
					<A class="item" target="PDF_Frame">
						<xsl:attribute name="id">id<xsl:eval>getCount()</xsl:eval></xsl:attribute>
						<xsl:attribute name="onclick">selectItem(<xsl:eval>countUp()</xsl:eval>)</xsl:attribute>
						<xsl:attribute name="href">../connector/<xsl:value-of select="partNo"/>.pdf</xsl:attribute>
						<xsl:value-of select="@code"/>
						<xsl:if test="note['' $ne$ .]">
							 &lt;<xsl:value-of select="note"/>&gt;
						</xsl:if>
					</A>
					</div>
				</xsl:if>
			</xsl:for-each>
		</div>
	</xsl:template>
	<xsl:script>
		counter = 0;
		function counterClear() {
			counter = 0;
		}
		function getCount(){ return counter; }
		function countUp() {
			return counter++;
		}
	</xsl:script>
</xsl:stylesheet>
