/* ============================================================
   师作 TeachDo B01 · 自研导出器 export.js
   ZIP（STORE 存储 + CRC32）/ DOCX / PPTX 全部手写，零三方库。
   OOXML 即「XML 装进 ZIP」，本文件只依赖 TextEncoder 与原生 API。
   ============================================================ */
"use strict";
window.TD = window.TD || {};

TD.Export = {};

/* ---------- CRC32（IEEE 802.3，查表法，表自生成） ---------- */
TD.Export._crcTable = (function(){
  const t = new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c = n;
    for(let k=0;k<8;k++) c = (c & 1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1);
    t[n] = c>>>0;
  }
  return t;
})();
TD.Export.crc32 = function(bytes){
  let crc = 0xFFFFFFFF;
  const t = this._crcTable;
  for(let i=0;i<bytes.length;i++) crc = t[(crc ^ bytes[i]) & 0xFF] ^ (crc>>>8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

/* ---------- ZIP（STORE 法，不压缩；OOXML 接收方兼容） ---------- */
TD.Export.zipBytes = function(files){
  /* files: [{name:"a/b.xml", data:Uint8Array}] */
  const enc = new TextEncoder();
  const parts = []; const central = []; let offset = 0;
  const dosTime = (function(){ const d=new Date();
    const time = ((d.getHours()&31)<<11)|((d.getMinutes()&63)<<5)|((d.getSeconds()/2)&31);
    const date = (((d.getFullYear()-1980)&127)<<9)|(((d.getMonth()+1)&15)<<5)|(d.getDate()&31);
    return {time,date}; })();

  files.forEach(f=>{
    const nameBytes = enc.encode(f.name);
    const data = (f.data instanceof Uint8Array) ? f.data : enc.encode(f.data);
    const crc = this.crc32(data);
    /* Local file header */
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);            /* version needed */
    lh.setUint16(6, 0, true);             /* flags */
    lh.setUint16(8, 0, true);             /* method = STORE */
    lh.setUint16(10, dosTime.time, true);
    lh.setUint16(12, dosTime.date, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);  /* compressed = stored */
    lh.setUint32(22, data.length, true);  /* uncompressed */
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);            /* extra len */
    parts.push(new Uint8Array(lh.buffer), nameBytes, data);
    /* Central directory entry */
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
    ch.setUint16(8, 0, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime.time, true); ch.setUint16(14, dosTime.date, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
    ch.setUint16(28, nameBytes.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nameBytes);
    offset += 30 + nameBytes.length + data.length;
  });

  const cdSize = central.reduce((a,b)=>a+b.length,0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, files.length, true); eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, cdSize, true); eocd.setUint32(16, offset, true);
  eocd.setUint16(20, 0, true);

  const all = parts.concat(central, [new Uint8Array(eocd.buffer)]);
  let total = 0; all.forEach(u=>{ total += u.length; });
  const out = new Uint8Array(total);
  let pos = 0; all.forEach(u=>{ out.set(u, pos); pos += u.length; });
  return out;
};

TD.Export.zip = function(files){
  return new Blob([this.zipBytes(files)], {type:"application/zip"});
};

TD.Export.download = function(blob, filename){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 800);
};

/* ---------- XML 转义 ---------- */
TD.Export.esc = function(s){
  return String(s==null?"":s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
};

/* ============================================================
   DOCX 生成
   ============================================================ */
TD.Export.docxFiles = function(title, blocks){
  /* blocks: [{h1}|{h2}|{p}|{table:rows}... ] */
  const esc = this.esc;
  let body = "";
  body += '<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>'+esc(title)+'</w:t></w:r></w:p>';
  blocks.forEach(b=>{
    if(b.h1) body += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>'+esc(b.h1)+'</w:t></w:r></w:p>';
    else if(b.h2) body += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>'+esc(b.h2)+'</w:t></w:r></w:p>';
    else if(b.p!=null) body += '<w:p><w:r><w:t xml:space="preserve">'+esc(b.p)+'</w:t></w:r></w:p>';
    else if(b.bullet) body += '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">'+esc(b.bullet)+'</w:t></w:r></w:p>';
    else if(b.table){
      body += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>'
        + '<w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/>'
        + '<w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>';
      b.table.forEach(row=>{
        body += "<w:tr>";
        row.forEach(cell=>{ body += '<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr><w:p><w:r><w:t xml:space="preserve">'+esc(cell)+'</w:t></w:r></w:p></w:tc>'; });
        body += "</w:tr>";
      });
      body += "</w:tbl>";
    }
  });

  const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:body>' + body + '<w:sectPr/></w:body></w:document>';

  const stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Microsoft YaHei" w:eastAsia="Microsoft YaHei"/><w:sz w:val="21"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>'
    + '</w:styles>';

  const numberingXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="·"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="420" w:hanging="220"/></w:pPr></w:lvl></w:abstractNum>'
    + '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';

  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    + '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
    + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
    + '</Types>';

  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    + '</Relationships>';

  const docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'
    + '</Relationships>';

  const core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    + '<dc:title>'+esc(title)+'</dc:title><dc:creator>师作 TeachDo</dc:creator>'
    + '<dcterms:created xsi:type="dcterms:W3CDTF">'+new Date().toISOString()+'</dcterms:created>'
    + '</cp:coreProperties>';

  return [
    {name:"[Content_Types].xml", data:contentTypes},
    {name:"_rels/.rels", data:rels},
    {name:"word/document.xml", data:documentXml},
    {name:"word/_rels/document.xml.rels", data:docRels},
    {name:"word/styles.xml", data:stylesXml},
    {name:"word/numbering.xml", data:numberingXml},
    {name:"docProps/core.xml", data:core}
  ];
};
TD.Export.docx = function(title, blocks){
  return this.zip(this.docxFiles(title, blocks));
};

/* ============================================================
   PPTX 生成（Slide IR → OOXML）
   ============================================================ */
TD.Export.pptxFiles = function(slides, style){
  const esc = this.esc;
  const st = style || TD.KB.styles[0];
  /* 颜色转十六进制（去 #） */
  const hex = c => (c||"#000000").replace("#","");
  const BG = hex(st.colors.bg), INK = hex(st.colors.ink), BODY = hex(st.colors.body), DIM = hex(st.colors.dim), ACC = hex(st.colors.accent);

  /* 每页 XML */
  const slideXml = (s, idx)=>{
    const isCover = s.layout==="cover";
    let shapes = "";
    let sid = 100;
    /* 顶部色条 */
    shapes += rect(2, 0, 0, 12192000, 91440, ACC);
    /* 标题 */
    shapes += textBox(3, 685800, 900000, 8000000, 900000, s.title||"", isCover?3600:2800, INK, true);
    /* kicker */
    if(s.kicker) shapes += textBox(4, 685800, 200000, 8000000, 320000, s.kicker, 1100, DIM, false, true);
    /* bullets */
    if(Array.isArray(s.bullets) && s.bullets.length){
      let y = isCover? 2600000 : 2050000;
      s.bullets.forEach(b=>{
        shapes += textBox(++sid, 685800, y, 10800000, 520000, "· "+b, 1600, BODY, false);
        y += 560000;
      });
    }
    /* 页脚 */
    shapes += textBox(90, 685800, 6300000, 10800000, 280000, (s.source||"")+"　｜　P "+(idx+1)+" / "+slides.length, 900, DIM, false, true);

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
      + '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="'+BG+'"/></a:solidFill></p:bgPr></p:bg>'
      + '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
      + shapes
      + '</p:spTree></p:cSld><p:clrMapOvr><a:overrideClrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sld>';
  };

  function rect(id, x,y,cx,cy, color){
    return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="bar"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
      + '<p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>'
      + '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>';
  }
  function textBox(id, x,y,cx,cy, text, sz, color, bold, spacing){
    const ls = spacing ? '<a:lnSpc><a:spcPct val="130000"/></a:lnSpc>' : '<a:lnSpc><a:spcPct val="150000"/></a:lnSpc>';
    return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="tx"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
      + '<p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'
      + '<p:txBody><a:bodyPr wrap="square" rtlCol="0" anchor="t"><a:normAutofit/></a:bodyPr><a:lstStyle/>'
      + '<a:p><a:pPr>'+ls+'</a:pPr><a:r><a:rPr lang="zh-CN" sz="'+sz+'" '+(bold?'b="1" ':'')+'><a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:rPr><a:t>'+esc(text)+'</a:t></a:r></a:p>'
      + '</p:txBody></p:sp>';
  }

  /* 文件清单 */
  const files = [];
  const n = slides.length;
  let ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
    + '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
    + '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
    + '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
    + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>';
  for(let i=1;i<=n;i++) ct += '<Override PartName="/ppt/slides/slide'+i+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
  ct += '</Types>';
  files.push({name:"[Content_Types].xml", data:ct});

  files.push({name:"_rels/.rels", data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'});

  let presRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  for(let i=1;i<=n;i++) presRels += '<Relationship Id="rId'+i+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+i+'.xml"/>';
  presRels += '<Relationship Id="rId'+(n+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/></Relationships>';
  files.push({name:"ppt/_rels/presentation.xml.rels", data:presRels});

  let sldIdLst = "";
  for(let i=1;i<=n;i++) sldIdLst += '<p:sldId id="'+(255+i)+'" r:id="rId'+i+'"/>';
  files.push({name:"ppt/presentation.xml", data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
    + '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId'+(n+1)+'"/></p:sldMasterIdLst>'
    + '<p:sldIdLst>'+sldIdLst+'</p:sldIdLst>'
    + '<p:sldSz cx="12192000" cy="6858000" type="wide"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>'});

  /* slideMaster + layout + theme（最小合法集） */
  files.push({name:"ppt/slideMasters/_rels/slideMaster1.xml.rels", data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>'});
  files.push({name:"ppt/slideMasters/slideMaster1.xml", data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
    + '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="'+BG+'"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
    + '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
    + '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>'});
  files.push({name:"ppt/slideLayouts/_rels/slideLayout1.xml.rels", data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>'});
  files.push({name:"ppt/slideLayouts/slideLayout1.xml", data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">'
    + '<p:cSld name="空白"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:overrideClrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sldLayout>'});
  files.push({name:"ppt/theme/theme1.xml", data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="TeachDo"><a:themeElements>'
    + '<a:clrScheme name="TeachDo"><a:dk1><a:srgbClr val="'+INK+'"/></a:dk1><a:lt1><a:srgbClr val="'+BG+'"/></a:lt1><a:dk2><a:srgbClr val="'+BODY+'"/></a:dk2><a:lt2><a:srgbClr val="FFFFFF"/></a:lt2><a:accent1><a:srgbClr val="'+ACC+'"/></a:accent1><a:accent2><a:srgbClr val="'+DIM+'"/></a:accent2><a:accent3><a:srgbClr val="'+ACC+'"/></a:accent3><a:accent4><a:srgbClr val="'+ACC+'"/></a:accent4><a:accent5><a:srgbClr val="'+ACC+'"/></a:accent5><a:accent6><a:srgbClr val="'+ACC+'"/></a:accent6><a:hlink><a:srgbClr val="'+ACC+'"/></a:hlink><a:folHlink><a:srgbClr val="'+DIM+'"/></a:folHlink></a:clrScheme>'
    + '<a:fontScheme name="TeachDo"><a:majorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:majorFont><a:minorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:minorFont></a:fontScheme>'
    + '<a:fmtScheme name="TeachDo"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>'
    + '</a:themeElements></a:theme>'});

  slides.forEach((s,i)=>{ files.push({name:"ppt/slides/slide"+(i+1)+".xml", data:slideXml(s,i)}); });

  files.push({name:"docProps/core.xml", data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    + '<dc:title>'+esc(slides[0]?slides[0].title:"课件")+'</dc:title><dc:creator>师作 TeachDo</dc:creator>'
    + '<dcterms:created xsi:type="dcterms:W3CDTF">'+new Date().toISOString()+'</dcterms:created></cp:coreProperties>'});

  return files;
};
TD.Export.pptx = function(slides, style){
  return this.zip(this.pptxFiles(slides, style));
};

/* ============================================================
   三件套打包
   ============================================================ */
TD.Export.lessonDocxFiles = function(lesson, input, pkg){
  const blocks = [];
  blocks.push({h1:"一、基本信息"});
  blocks.push({p:"课题："+(lesson.meta.topic||input.topic)+"　学段："+input.stage+"　学科："+input.subject+"　课时："+input.minutes+" 分钟"});
  blocks.push({p:"教材："+(input.textbook||"")+"　单元/课时："+(input.unit||"")});
  blocks.push({h1:"二、教学目标"});
  (lesson.objectives||[]).forEach((o,i)=>blocks.push({p:(i+1)+". "+o}));
  blocks.push({h1:"三、教学重难点"});
  blocks.push({p:"重点："+(lesson.keypoints&&lesson.keypoints.key||"")});
  blocks.push({p:"难点："+(lesson.keypoints&&lesson.keypoints.hard||"")});
  blocks.push({h1:"四、教学过程"});
  (lesson.stages||[]).forEach((s,i)=>{
    blocks.push({h2:"环节"+(i+1)+"："+s.name+"（"+s.minutes+" 分钟）"});
    blocks.push({p:"教师："+s.teacher});
    blocks.push({p:"学生："+s.student});
    if(s.intent) blocks.push({p:"设计意图："+s.intent});
    if(s.board) blocks.push({p:"板书："+s.board});
  });
  blocks.push({h1:"五、板书设计"});
  blocks.push({p:lesson.board||""});
  blocks.push({h1:"六、作业设计"});
  (lesson.homework||[]).forEach(h=>blocks.push({p:"【"+h.level+"】"+h.task}));
  if(lesson.reflection){ blocks.push({h1:"七、教学反思（预留）"}); blocks.push({p:lesson.reflection}); }
  if(pkg && pkg.standards && pkg.standards.length){
    blocks.push({h1:"附 · 课标依据"});
    pkg.standards.forEach(s=>blocks.push({p:"["+s.id+"] "+s.topic+"："+s.cite}));
  }
  return this.docxFiles((lesson.meta.topic||input.topic)+" · 教案", blocks);
};

TD.Export.scriptDocxFiles = function(script, input){
  const blocks = [];
  blocks.push({h1:"课堂讲稿"});
  blocks.push({p:"课题："+input.topic+"　学段："+input.stage+"　课时："+input.minutes+" 分钟"});
  (script||[]).forEach(pg=>{
    blocks.push({h2:"P"+pg.page+" · "+pg.title+"（"+pg.minutes+" 分钟）"});
    if(pg.board) blocks.push({p:"【板书】"+pg.board});
    (pg.says||[]).forEach(x=>{
      const tag = x.who==="T"?"【师】":(x.who==="S"?"【预设学生】":"【活动】");
      blocks.push({p:tag+" "+x.text});
    });
  });
  return this.docxFiles(input.topic+" · 讲稿", blocks);
};

TD.Export.citationTxt = function(pkg, lesson){
  const L = [];
  L.push("师作 TeachDo · 引用清单"); L.push("生成时间："+new Date().toLocaleString()); L.push("");
  L.push("一、课标依据（逐字摘录，出处可核验）");
  (pkg.standards||[]).forEach(s=>{ L.push("["+s.id+"] "+s.topic); L.push("　原文：「"+s.quote+"」"); L.push("　出处："+s.cite); L.push(""); });
  L.push("二、公开课结构骨架（自研归纳，仅借鉴结构）");
  if(pkg.skeleton) L.push(pkg.skeleton.name+"："+pkg.skeleton.skeleton.map(x=>x.role).join(" → "));
  L.push("");
  L.push("三、画风参考："+(pkg.style?pkg.style.name:"-")+"（只取版式与配色规则）");
  L.push("四、相似度自检：本库仅含结构骨架，正文相似度趋近 0。");
  L.push("五、本教案引用的课标条目："+((lesson&&lesson.basis||[]).join("、")||"-"));
  return L.join("\n");
};

TD.Export.bundle = function(proj, mode){
  const pkg = proj.pkg||{}, input = proj.input;
  const base = (input.topic||"备课") + "_B01";
  /* 单文件下载 / 合并打包共用：把 DOCX/PPTX 的内部文件列表压平成字节 */
  const enc = new TextEncoder();
  const flat = [];
  if(proj.lesson) flat.push({name:"01_教案_"+base+".docx", data:this.zipBytes(this.lessonDocxFiles(proj.lesson, input, pkg))});
  if(proj.slides && proj.slides.length) flat.push({name:"02_课件_"+base+".pptx", data:this.zipBytes(this.pptxFiles(proj.slides, pkg.style))});
  if(proj.script && proj.script.length) flat.push({name:"03_讲稿_"+base+".docx", data:this.zipBytes(this.scriptDocxFiles(proj.script, input))});
  flat.push({name:"04_引用清单.txt", data:enc.encode(this.citationTxt(pkg, proj.lesson))});
  if(mode==="merged"){
    return { blob:new Blob([this.zipBytes(flat)],{type:"application/zip"}), name:base+"_备课包.zip" };
  }
  return { files:flat, base };
};
TD.Export.ready = true;
