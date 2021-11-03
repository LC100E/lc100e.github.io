<?xml version="1.0" encoding="UTF-8"?> 
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
				<xsl:apply-templates select="ItemList"/>
			</body>
		</html>

	</xsl:template>

	<xsl:template match="ItemList">
		<font size="-1"><b><xsl:value-of select="@sysname" /></b></font>
		<div class="itemList">
			<xsl:for-each select="item">
					<xsl:if test="./@type['conn' $eq$ .]">
						<xsl:if test="./@no['1' $eq$ .]">
							<div class="showType">Parts Location</div>
						</xsl:if>
					</xsl:if>
					<xsl:if test="./@type['rb' $eq$ .]">
						<xsl:if test="./@no['1' $eq$ .]">
							<div class="showType">Relay Blocks</div>
						</xsl:if>
					</xsl:if>
					<xsl:if test="./@type['jb' $eq$ .]">
						<xsl:if test="./@no['1' $eq$ .]">
							<div class="showType">Junction Blocks</div>
						</xsl:if>
					</xsl:if>
					<xsl:if test="./@type['w2w' $eq$ .]">
						<xsl:if test="./@no['1' $eq$ .]">
							<div class="showType">Wire and Wire</div>
						</xsl:if>
					</xsl:if>
					<xsl:if test="./@type['gp' $eq$ .]">
						<xsl:if test="./@no['1' $eq$ .]">
							<div class="showType">Ground Points</div>
						</xsl:if>
					</xsl:if>
					<xsl:if test="./@type['sp' $eq$ .]">
						<xsl:if test="./@no['1' $eq$ .]">
							<div class="showType">Splice Points</div>
						</xsl:if>
					</xsl:if>
					<div class="item">
						<A class="item" target="PDF_Frame">
							<xsl:attribute name="id">id<xsl:eval>getCount()</xsl:eval></xsl:attribute>
							<xsl:attribute name="onclick">selectItem(<xsl:eval>countUp()</xsl:eval>)</xsl:attribute>

						<xsl:choose>
							<xsl:when test="./@type['w2w' $eq$ .]">

							<xsl:attribute name="href"><xsl:value-of select="ref/@type"/>/w2w.html?page=<xsl:value-of select="ref/@page"/></xsl:attribute>
							</xsl:when>
							<xsl:when test="./@type['jb' $eq$ . or 'rb' $eq$ . ]">
							<xsl:attribute name="href"><xsl:value-of select="ref/@type"/>/relay.html?page=<xsl:value-of select="ref/@page"/></xsl:attribute>
							</xsl:when>
							<xsl:otherwise>

							<xsl:attribute name="href"><xsl:value-of select="ref/@type"/>/<xsl:value-of select="ref/@page"/>.pdf</xsl:attribute>
							</xsl:otherwise>
						</xsl:choose>


							<xsl:value-of select="@code"/>
							<xsl:if test="note['' $ne$ .]">
								 &lt;<xsl:value-of select="note"/>&gt;
							</xsl:if>
						</A>
					</div>
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
