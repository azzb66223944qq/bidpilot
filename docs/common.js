/* 文档构建公共模块：调色板/组件/R2封面（供方案书、测试报告等复用） */
const {
  Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel,
  BorderStyle, WidthType, ShadingType, TableLayoutType, ImageRun
} = require("docx");
const fs = require("fs");
const { imageSize } = require("image-size");

const PAL = {
  bg: "FEFEFE", primary: "1284BA", accent: "FF862F",
  cover: { titleColor: "1284BA", subtitleColor: "606060", metaColor: "707070", footerColor: "A0A0A0" },
  table: { headerBg: "1284BA", headerText: "FFFFFF", accentLine: "1284BA", innerLine: "D8E4EC", surface: "EDF4F9" },
};
const BODY = "182030", MUTED = "506070";

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([..."，。、；：！？", ..."的与和及之在于为", ..."-_—–·/", ..." \t"]);
  const lines = []; let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt < 0) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop(); lines[lines.length - 1] += last;
  }
  return lines;
}
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / (pt * 20));
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) { lines = splitTitleLines(title, charsPerLine(minPt)); titlePt = minPt; }
  return { titlePt, titleLines: lines };
}
function buildCoverR2(config) {
  const P = config.palette, padL = 1400, padR = 1400;
  const { titlePt, titleLines } = calcTitleLayout(config.title, 11906 - padL - padR, 40, 24);
  const titleSize = titlePt * 2;
  const thickBorder = { style: BorderStyle.SINGLE, size: 18, color: P.accent, space: 20 };
  const children = [];
  children.push(new Paragraph({
    indent: { left: padL - 400, right: padR - 400 }, spacing: { before: 1200, after: 200 },
    border: { top: thickBorder }, children: [],
  }));
  children.push(new Paragraph({ spacing: { before: 1800 } }));
  if (config.englishLabel) children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 500 },
    children: [new TextRun({ text: config.englishLabel.split("").join("  "), size: 18, color: P.accent, font: { ascii: "Calibri" }, characterSpacing: 40 })],
  }));
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: i < titleLines.length - 1 ? 80 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: P.cover.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }
  if (config.subtitle) children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 400 },
    children: [new TextRun({ text: config.subtitle, size: 24, color: P.cover.subtitleColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
  }));
  children.push(new Paragraph({ spacing: { before: 1200 } }));
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100, line: Math.ceil(18 * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: line, size: 36, color: P.cover.metaColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: 2000 } }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, indent: { left: padL - 400, right: padR - 400 }, spacing: { before: 200 },
    border: { bottom: thickBorder },
    children: [new TextRun({ text: config.footerRight || "", size: 18, color: P.cover.footerColor, font: { ascii: "Arial" } })],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: PAL.bg }, borders: noBorders, children })],
    })],
  })];
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, bold: true, color: PAL.primary, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" }, size: 32 })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: PAL.primary, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" }, size: 26 })] });
}
function body(text) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 420 }, spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: BODY })] });
}
function bullet(label, text) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 80 }, indent: { left: 360 },
    children: [
      new TextRun({ text: "\u2022 ", bold: true, color: PAL.accent, size: 24 }),
      new TextRun({ text: label, bold: true, size: 24, color: BODY }),
      new TextRun({ text: text, size: 24, color: BODY }),
    ] });
}
function note(text) {
  return new Paragraph({ spacing: { line: 312, before: 60, after: 120 }, indent: { left: 360 },
    children: [new TextRun({ text, size: 21, color: MUTED, italics: true })] });
}
function tbl(headers, rows, widths) {
  const mk = (t, isHead, i, alignCenter) => new TableCell({
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    shading: { type: ShadingType.CLEAR, fill: isHead ? PAL.table.headerBg : (i % 2 === 1 ? PAL.table.surface : "FFFFFF") },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: PAL.table.innerLine }, bottom: { style: BorderStyle.SINGLE, size: 4, color: PAL.table.innerLine },
      left: { style: BorderStyle.SINGLE, size: 4, color: PAL.table.innerLine }, right: { style: BorderStyle.SINGLE, size: 4, color: PAL.table.innerLine },
    },
    children: [new Paragraph({
      alignment: alignCenter ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { line: 276 },
      children: [new TextRun({ text: String(t), bold: isHead, size: isHead ? 21 : 20, color: isHead ? PAL.table.headerText : BODY })],
    })],
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((x, i) => mk(x, true, 0, i > 0)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((x, i) => mk(x, false, ri, i > 0 && String(x).length <= 8)) })),
    ],
  });
}
function caption(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 200 },
    children: [new TextRun({ text, size: 20, color: MUTED })] });
}
function figure(path, maxWtw = 8600) {
  const dim = imageSize(fs.readFileSync(path));
  const wIn = Math.min(maxWtw / 1440, 6.0);
  const hIn = wIn * (dim.height / dim.width);
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(path), transformation: { width: wIn * 96, height: hIn * 96 } })],
  });
}

module.exports = { PAL, BODY, MUTED, buildCoverR2, h1, h2, body, bullet, note, tbl, caption, figure };
