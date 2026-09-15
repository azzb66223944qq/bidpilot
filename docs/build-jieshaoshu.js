/* 标书快反 BidPilot · 产品详细介绍书（docx）
 * 运行：NODE_PATH=$(npm root -g) node docs/build-jieshaoshu.js
 * 结构：R2封面(CM-2) → 目录 → 七章正文 → 附录
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, BorderStyle, WidthType, ShadingType,
  TableLayoutType, PageBreak, ImageRun, SectionType, NumberFormat, TableOfContents, LevelFormat
} = require("docx");
const fs = require("fs");
const { imageSize } = require("image-size");

/* ---------- 调色板 CM-2（Blue Orange · 科技白皮书） ---------- */
const PAL = {
  bg: "FEFEFE", primary: "1284BA", accent: "FF862F",
  cover: { titleColor: "1284BA", subtitleColor: "606060", metaColor: "707070", footerColor: "A0A0A0" },
  table: { headerBg: "1284BA", headerText: "FFFFFF", accentLine: "1284BA", innerLine: "D8E4EC", surface: "EDF4F9" },
};
const BODY = "182030", MUTED = "506070";

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

/* ---------- 封面辅助（按 design-system.md 规范实现） ---------- */
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

/* ---------- R2 双线框封面（白皮书配方） ---------- */
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
  children.push(new Paragraph({
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
  children.push(new Paragraph({
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
    alignment: AlignmentType.CENTER,
    indent: { left: padL - 400, right: padR - 400 }, spacing: { before: 200 },
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

/* ---------- 正文组件 ---------- */
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, bold: true, color: PAL.primary, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" }, size: 32 })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: PAL.primary, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" }, size: 26 })] });
}
function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 420 }, spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: BODY, ...opts })],
  });
}
function bullet(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 80 }, indent: { left: 360 },
    children: [
      new TextRun({ text: "\u2022 ", bold: true, color: PAL.accent, size: 24 }),
      new TextRun({ text: label, bold: true, size: 24, color: BODY }),
      new TextRun({ text: text, size: 24, color: BODY }),
    ],
  });
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
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    columnWidths: widths,
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
function pageBreakPara() { return new Paragraph({ children: [new PageBreak()] }); }

const SS = "docs/screenshots/";

/* ================= 正文内容 ================= */
const bodyChildren = [];

/* 一、产品概述 */
bodyChildren.push(h1("一、产品概述"));
bodyChildren.push(body("标书快反（BidPilot）是一款面向工程机械经销商的投标文件 AI 智能体（v2.1）。使用者只需粘贴两段文本——本公司资料库（资质、业绩、设备参数）与招标公告原文——系统即可在 10 秒内生成投标所需的四份核心成果：资格自查表、技术偏离表、废标风险 TOP5 与投标就绪度评分报告，将传统流程中 2–3 天的人工标书处理工作压缩到数秒，并以结构化方式提示每一处可能废标的风险。"));
bodyChildren.push(body("产品采用双引擎架构：内置规则引擎离线可用、结论可回溯，负责确定性判定；大模型引擎（GLM 等OpenAI 兼容接口，或扣子/Coze、Dify 平台部署）负责开放式问答。两套引擎共享同一份反幻觉系统提示词，保证输出行为一致。"));
bodyChildren.push(h2("1.1 核心价值主张"));
bodyChildren.push(bullet("省时：", "标书自查从 2–3 天压缩到 10 秒，业务员把时间花在报价与商务上；"));
bodyChildren.push(bullet("防错：", "32 类技术参数逐条比对、★关键参数废标判定、保证金/解密时限等高风险条款自动提醒；"));
bodyChildren.push(bullet("可信：", "反幻觉铁律——资料库里没有的信息一律输出“该信息不在本公司资料库中，请核实后补充”，绝不编造任何品牌、机型、参数、业绩与资质；"));
bodyChildren.push(bullet("可审计：", "每个判定结论都能回溯到招标公告原文片段，满足招投标场景的合规要求。"));
bodyChildren.push(h2("1.2 适用场景与用户"));
bodyChildren.push(tbl(["用户角色", "使用场景", "核心收益"], [
  ["经销商投标专员", "每单投标前的资格与参数自查", "省时、防废标"],
  ["销售经理", "多设备选型决策（对比模式）", "快速选型，避免盲目投标"],
  ["制造商渠道部门", "为授权经销商提供投标支持", "提升渠道中标率"],
  ["投标咨询顾问", "批量标书审查与风险扫描", "扩大服务吞吐量"],
], [2800, 4300, 3000]));
bodyChildren.push(caption("表 1-1 目标用户与使用场景"));

/* 二、功能详解 */
bodyChildren.push(pageBreakPara());
bodyChildren.push(h1("二、功能详解"));
bodyChildren.push(h2("2.1 四大核心输出"));
bodyChildren.push(body("资格自查：逐条对照招标公告的资格要求（独立法人、授权书、体系认证、业绩、联合体条款、资格审查方式等），输出“有据/待人工核实”双色标注，并自动列出保证金、CA 证书等平台类待办。技术偏离表：对 32 类技术参数逐条响应，标注满足/正偏离/负偏离/资料库无/待人工补充五态；废标风险 TOP5：以业务员可读的白话提示解密时限、同网络串标、保证金账户、授权书用印、限价与截止时间五大高危项；结论与评分：0–100 就绪度评分、A/B/C/D 等级、是否建议投标与前提条件清单。"));
bodyChildren.push(figure(SS + "1-qual-loader.png"));
bodyChildren.push(caption("图 2-1 资格自查页：项目速览卡与投标行动时间表（产品实拍，演示数据为虚构）"));
bodyChildren.push(h2("2.2 ★关键参数废标判定"));
bodyChildren.push(body("系统自动识别招标文件中的★号标注（段级定位：★只归属紧邻的参数，不污染同行其他参数）。当★参数出现负偏离时，按招标行业惯例判定为直接否决投标：评分压制至 15 分（D 级），页面顶部显示红色废标警告条，前提清单第一条即为“书面澄清或更换机型”。★参数在资料库中缺失时，则显示琥珀色警告（区别于负偏离），提示补齐前不具备投标条件。"));
bodyChildren.push(figure(SS + "2-conclusion-excavator-kill.png"));
bodyChildren.push(caption("图 2-2 挖掘机演示场景：★爬坡能力负偏离触发废标判定（产品实拍，演示数据为虚构）"));
bodyChildren.push(h2("2.3 对比选型模式"));
bodyChildren.push(body("在对比框贴入第二台设备资料库，系统输出双评分环对决视图（A 设备 vs B 设备）、偏离表 A/B 双列对照，以及一行选型建议。导出报告自动附带“对比分析”章节，含两台设备评分对照表与各自结论。"));
bodyChildren.push(h2("2.4 单位换算与口径治理"));
bodyChildren.push(body("引擎内置三套换算：毫米↔米（如 3.1m 对比 ≥2900mm）、马力↔千瓦（1 马力 = 0.7355kW）、吨↔千克。对无法安全换算的口径冲突（如爬坡能力的百分比与角度制、掘起力的 kN 与吨），系统拒绝瞎换算，明确标注“双方单位口径不同，请人工核对”——宁可不判定，不可错判定。"));
bodyChildren.push(figure(SS + "3-deviation-table.png"));
bodyChildren.push(caption("图 2-3 技术偏离表：★金色标记关键参数，跨单位参数自动换算比对（产品实拍，演示数据为虚构）"));
bodyChildren.push(h2("2.5 公告变更检测与自定义词库（v1.6）"));
bodyChildren.push(body("公告变更检测：澄清/补遗是招标过程中最常见的废标诱因——参数改了、★标注加了、时间提前了，漏看一处即出局。将澄清前后两版公告分别粘贴，系统自动比对并按风险分级列出全部变更：总价限价、投标保证金、开标时间、参数要求、★标注新增与取消、证明材料增删，每条附处置建议（如“重新安排基本账户汇款”“立即向制造商调取”），并给出下一步行动清单。"));
bodyChildren.push(body("自定义词库：规则库具备生长能力。当资料库或公告使用引擎未收录的设备表述（如以“额定容积”指代斗容），用户在词库中登记该别称及其对应参数，此后分析自动按该参数判定，且偏离表中诚实标注“依自定义词库匹配”，来源可追溯、条目可删除；每一次登记都沉淀为规则库资产，使产品随使用持续增值。"));
bodyChildren.push(h2("2.6 品类覆盖与▲重要条款（v1.7）"));
bodyChildren.push(body("品类扩展：依据中国政府采购网近半年真实公告研究，参数库从16类扩展至32类，机型族覆盖装载机、挖掘机、起重机、泵车、压路机等道路机械、洒水车等环卫车辆、推土机、叉车、旋挖钻机、高空作业平台7大类。新增▲重要条款双级风控：真实采购文件以▲标注影响评分的条款（区别于★否决条款），▲负偏离或缺失触发琥珀色复核警示而不判废标，实现★/▲分级风险管理。交货期支持合同履行期限等政采真实措辞，容积类参数支持L与立方米自动换算。"));
bodyChildren.push(h2("2.7 原文批注视图与置信度分级（v2.0）"));
bodyChildren.push(body("原文批注视图：新增独立标签页，将招标公告原文完整渲染，每一条被判定内容就地高亮——★关键条款金色、▲重要条款蓝色、负偏离红色下划线、正偏离浅蓝、满足绿色、待人工核实橙色虚线，悬停即可查看对应判定依据。可回溯性从文字承诺升级为可视化体验，且高亮数据与偏离表同源，不做任何额外推断。"));
bodyChildren.push(body("判定置信度分级：偏离表新增置信列——精确关键词命中为高置信（实心标记），经自定义词库别名匹配或单位口径待核对为中置信（半实心标记）。诚实量化每个判定的确信程度，让「宁可不判定、不可错判定」的原则可被看见。"));
bodyChildren.push(body("审计日志：每次生成分析自动留痕（时间、引擎版本、评分等级、输入指纹、词库状态），结论页展示最近记录并支持JSON导出——当时的判断永远可以复现。报告品牌系统支持上传公司Logo与选择主题色，导出报告自动套用。"));
bodyChildren.push(h2("2.8 采购文件导入与对比雷达图（v2.1/v2.1.1）"));
bodyChildren.push(body("采购文件PDF导入：拖入招标文件附件PDF，本地pdf.js解析（不上传服务器）自动定位技术参数章节并附加到公告区，参数不再需要手动复制粘贴；扫描件诚实提示无法解析。A/B对比雷达图：两台设备在共同参数维度上的多边形叠加，形状差异一眼可见。"));
bodyChildren.push(h2("2.9 其他功能一览"));
bodyChildren.push(tbl(["功能", "说明"], [
  ["项目速览卡", "限价/保证金/解密时限/报名与开标时间/审查方式/联合体，一屏速览"],
  ["投标行动时间表", "报名截止、保证金到账、开标三节点自动倒排，含距开标倒计时"],
  ["就绪度评分", "权重可配置（负偏离/缺参数/待核对/缺证明四项），脚注随报告输出"],
  ["我的设备库", "常用设备资料库本机保存（最多 30 个），一键载入"],
  ["公告变更检测", "新旧两版公告自动比对，6类变更按风险分级并附处置建议"],
  ["自定义词库", "登记设备表述别名，规则库随使用生长，匹配处诚实标注来源"],
  ["补料清单", "所有待核实项自动整理为可转发清单，发给制造商照单补料"],
  ["三路导出", "Markdown、单文件 HTML 报告（含公司抬头）、打印/PDF"],
  ["历史记录", "最近 20 次分析存本机，点击载入重跑"],
  ["中英界面", "全界面文案切换，偏好存本机"],
  ["演示指南", "内置三分钟答辩演示脚本"],
], [2600, 7500]));
bodyChildren.push(caption("表 2-1 功能清单"));

/* 三、使用指南 */
bodyChildren.push(pageBreakPara());
bodyChildren.push(h1("三、使用指南"));
bodyChildren.push(h2("3.1 三种运行方式"));
bodyChildren.push(bullet("在线体验（已上线）：", "https://azzb66223944qq.github.io/bidpilot/ —— 手机/电脑浏览器直接打开，支持安装为App；"));
bodyChildren.push(bullet("本地运行：", "双击 index.html 即可，规则引擎离线可用，无需安装；"));
bodyChildren.push(bullet("在线部署：", "上传至 GitHub Pages 即获得公开链接，适合放入参赛材料；"));
bodyChildren.push(bullet("智能体部署：", "点击页面“系统提示词”按钮复制提示词，粘贴到扣子（Coze）/Dify 新建智能体，并上传资料为知识库。"));
bodyChildren.push(h2("3.2 五步上手"));
bodyChildren.push(tbl(["步骤", "操作", "说明"], [
  ["1", "载入/粘贴资料库", "点击演示芯片，或粘贴本公司资质、业绩、设备参数"],
  ["2", "粘贴招标公告", "整段粘贴即可，系统自动提取限价、时间节点、参数要求"],
  ["3", "点击生成投标分析", "或使用 Ctrl/⌘+Enter 快捷键"],
  ["4", "查看四个标签页", "资格自查 → 技术偏离表 → 废标风险 → 结论与评分"],
  ["5", "导出与补料", "下载 HTML/MD 报告，或一键复制补料清单发给制造商"],
], [1000, 3200, 5900]));
bodyChildren.push(caption("表 3-1 五步上手流程"));
bodyChildren.push(h2("3.3 接入大模型（可选）"));
bodyChildren.push(body("在右上角“设置”中填入 OpenAI 兼容 API 地址与密钥（推荐智谱 GLM，glm-4-flash 免费档即可运行），模型名默认 glm-4-flash，保存后切换到“接入大模型”模式。密钥仅保存在本机浏览器 localStorage，不经过任何第三方服务器。若遇浏览器跨域限制，请使用内置规则引擎或将系统提示词部署到 Coze/Dify 平台。"));

/* 四、技术架构 */
bodyChildren.push(pageBreakPara());
bodyChildren.push(h1("四、技术架构"));
bodyChildren.push(h2("4.1 双引擎架构"));
bodyChildren.push(body("规则引擎（engine.js，纯函数模块，浏览器与 Node 双端运行）承担参数提取、单位换算、偏离判定、评分计算等确定性工作，离线可用、结论可回溯、可单元测试；大模型引擎承担自然语言问答与长文本理解，受系统提示词约束在白名单信息源内作答。规则引擎保底、大模型增强、人工复核兜底，三层递进。"));
bodyChildren.push(h2("4.2 反幻觉三层防线"));
bodyChildren.push(bullet("输入层：", "白名单协议——只允许引用资料库与招标公告两份输入；"));
bodyChildren.push(bullet("判定层：", "数值比较全部由确定性代码完成，绕开模型自由发挥；"));
bodyChildren.push(bullet("输出层：", "缺失信息强制输出固定占位符，业务员拿到的是补料清单而非错误答案。"));
bodyChildren.push(h2("4.3 质量保障"));
bodyChildren.push(body("引擎配套 140 项自动化回归测试（含黄金快照面级回归）（tests/engine.test.js），覆盖四个演示场景（装载机、挖掘机、起重机、泵车）、单位换算边界、★定位精确性、权重配置、HTML 报告转义防注入与乱输入鲁棒性。全量测试可通过 node tests/engine.test.js 与 node tests/golden.test.js 一键复跑。"));
bodyChildren.push(h2("4.4 文件结构"));
bodyChildren.push(tbl(["文件", "职责"], [
  ["index.html", "前端应用（界面、交互、导出、历史、设备库、语言切换）"],
  ["engine.js", "核心解析引擎 v2.1（纯函数，32 类参数 7 大机型族，置信度分级，可单测）"],
  ["tests/engine.test.js", "140 项自动化回归测试"],
  ["prompts/system-prompt.md", "智能体系统提示词（Coze/Dify/GLM 通用）"],
  ["docs/", "产品截图、答辩问答、商业计划书大纲、路演 PPT"],
], [3600, 6500]));
bodyChildren.push(caption("表 4-1 代码仓库结构"));

/* 五、版本历史 */
bodyChildren.push(pageBreakPara());
bodyChildren.push(h1("五、版本历史"));
bodyChildren.push(tbl(["版本", "主要特性"], [
  ["v1.0", "反幻觉引擎、四份核心输出、26 项测试、Coze 部署方案"],
  ["v1.1", "就绪度评分模型、扩展参数与单位换算、双演示场景"],
  ["v1.2", "对比选型模式、项目速览卡、补料清单、HTML 报告导出"],
  ["v1.3", "起重机/泵车场景（16 类参数）、评分权重可配置、中英界面"],
  ["v1.4", "★关键参数废标判定（段级定位）、投标行动时间表、报告抬头"],
  ["v1.7", "★缺失琥珀告警、对比报告导出补全、我的设备库、快捷键"],
  ["v1.6", "公告变更检测（6类变更风险分级）、自定义词库（规则库生长）、PWA缓存策略修正"],
  ["v1.7", "品类扩展16→32类（7大机型族）、▲重要条款双级风控、交货期政采措辞、容积单位换算"],
  ["v2.0", "原文批注视图（风险在原文上发光）、判定置信度分级、审计日志、报告品牌系统（Logo+主题色）、CI自动测试"],
  ["v2.1", "采购文件PDF导入（本地pdf.js解析+章节定位）、A/B对比雷达图、黄金快照测试、CI双测试"],
  ["v2.1.1", "导出置信列对齐、报告指纹尾注、资产包导入导出、破坏性操作二次确认"],
  ["v2.1", "采购文件PDF导入（本地pdf.js解析+章节定位）、A/B对比雷达图、黄金快照测试、CI双测试"],
], [1600, 8500]));
bodyChildren.push(caption("表 5-1 版本演进"));

/* 六、合规与免责声明 */
bodyChildren.push(h1("六、合规与免责声明"));
bodyChildren.push(body("内置演示数据（浙东机械、北岭设备等公司与其招标项目）均为虚构，仅用于产品演示。本工具为辅助分析工具，输出不能替代人工复核，正式投标前必须逐条核对招标文件原文；报告导出件均带有虚构数据声明与人工复核提示。大模型模式下密钥仅存本机，历史记录与设备库数据均保存在浏览器 localStorage，不上传任何服务器。因使用本工具造成的任何投标损失，由使用者自行承担。"));

/* 七、常见问题 */
bodyChildren.push(h1("七、常见问题"));
bodyChildren.push(tbl(["问题", "解答"], [
  ["与直接问大模型有何区别？", "本产品从源头压制幻觉（白名单+占位符），判定由确定性代码完成且可回溯原文；通用大模型会编造参数，投标场景即废标。"],
  ["支持哪些机型？", "装载机、挖掘机、起重机、泵车、压路机、环卫车、叉车、旋挖钻机等七大机型族 32 类参数；贴入任意含对应关键词的公告均可识别。"],
  ["评分权重如何设定？", "默认 15/6/5/3（负偏离/缺参数/待核对/缺证明），可在设置中按行业调整；权重代表业务价值观，调整需有依据。"],
  ["数据安全吗？", "全部数据仅存本机浏览器；大模型模式下密钥也只存本机。"],
  ["离线能用吗？", "内置规则引擎完全离线可用；仅大模型模式需要联网。"],
], [3400, 6700]));
bodyChildren.push(caption("表 7-1 常见问题"));

/* ================= 组装文档 ================= */
const pageSize = { width: 11906, height: 16838 };
const bodyMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const footerArabic = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: MUTED })] })] });
const footerRoman = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: MUTED })] })] });
const headerBody = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PAL.table.innerLine, space: 4 } },
  children: [new TextRun({ text: "标书快反 BidPilot · 产品详细介绍书", size: 16, color: MUTED })] })] });

const doc = new Document({
  creator: "标书快反团队",
  title: "标书快反 BidPilot 产品详细介绍书",
  features: { updateFields: true },
  styles: { default: { document: {
    run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: BODY },
    paragraph: { spacing: { line: 312 } },
  }}},
  sections: [
    /* 封面 */
    { properties: { page: { size: pageSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR2({
        palette: PAL,
        englishLabel: "BIDPILOT PRODUCT GUIDE",
        title: "标书快反产品详细介绍书",
        subtitle: "工程机械投标文件 AI 智能体 · v2.1",
        metaLines: ["反幻觉 · 可回溯 · 双引擎", "2026 年 9 月"],
        footerRight: "BidPilot Team · 内部资料 · 演示数据均为虚构",
      }) },
    /* 目录（罗马页码） */
    { properties: { type: SectionType.NEXT_PAGE, page: { size: pageSize, margin: bodyMargin,
        pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } },
      footers: { default: footerRoman },
      children: [
        new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "目  录", bold: true, size: 32, color: PAL.primary, font: { eastAsia: "SimHei" } })] }),
        new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({ spacing: { before: 200 },
          children: [new TextRun({ text: "提示：在 Word 中右键目录 → “更新域”可刷新页码。", size: 18, color: "909090", italics: true })] }),
        new Paragraph({ children: [new PageBreak()] }),
      ] },
    /* 正文（阿拉伯页码从1开始） */
    { properties: { type: SectionType.NEXT_PAGE, page: { size: pageSize, margin: bodyMargin,
        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: headerBody }, footers: { default: footerArabic },
      children: bodyChildren },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("docs/Product-Guide-BidPilot.docx", buf);
  console.log("DOCX done: docs/Product-Guide-BidPilot.docx");
});
