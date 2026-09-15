/* 标书快反 BidPilot · 路演PPT构建脚本（pptxgenjs）
 * 运行：NODE_PATH=$(npm root -g) node docs/build-lupian.js
 * 输出：docs/Roadshow-Deck-BidPilot.pptx
 */
const pptxgen = require("pptxgenjs");

const p = new pptxgen();
p.layout = "LAYOUT_WIDE";           // 13.33 × 7.5
p.author = "标书快反团队";
p.title = "标书快反 BidPilot · 路演";

/* —— 调色板（与产品UI一致）：深海军蓝背景 + 产品蓝 + 青色点缀 —— */
const BG = "0B1220", CARD = "141E30", LINE = "2A3A58";
const PRIMARY = "4F8CFF", ACCENT = "37E0FF";
const TXT = "EEF3FB", MUTED = "93A5C4", FAINT = "5F7195";
const GOLD = "FFB547", RED = "FF6B6B", GREEN = "2FE0A2";
const F = "Microsoft YaHei";

const W = 13.33, H = 7.5, M = 0.6;
const IMG = { qual: "docs/screenshots/1-qual-loader.png", kill: "docs/screenshots/2-conclusion-excavator-kill.png", dev: "docs/screenshots/3-deviation-table.png" };

let pageNo = 0;
function slide(kicker, title) {
  pageNo++;
  const s = p.addSlide();
  s.background = { color: BG };
  if (kicker) s.addText(kicker, { x: M, y: 0.34, w: 9, h: 0.32, fontSize: 12, fontFace: F, color: ACCENT, charSpacing: 3, margin: 0 });
  if (title) s.addText(title, { x: M, y: 0.62, w: W - 2 * M, h: 0.66, fontSize: 30, fontFace: F, bold: true, color: TXT, margin: 0 });
  s.addText(String(pageNo).padStart(2, "0"), { x: W - 1.1, y: H - 0.55, w: 0.6, h: 0.3, fontSize: 11, fontFace: F, color: FAINT, align: "right", margin: 0 });
  return s;
}
function card(s, x, y, w, h, fill) {
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill || CARD }, line: { color: LINE, width: 1 }, rectRadius: 0.09 });
}
function numSq(s, x, y, n, color) {
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: 0.52, h: 0.52, fill: { color: color || PRIMARY }, rectRadius: 0.08 });
  s.addText(n, { x, y, w: 0.52, h: 0.52, fontSize: 16, fontFace: F, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
}
const bu = () => ({ code: "2022", indent: 12 });

/* ================= S1 封面 ================= */
{
  const s = p.addSlide();
  s.background = { color: BG };
  s.addText("第十五届中国创新创业大赛「AI+工程机械」专业赛 · AI+运营方向", { x: M, y: 0.55, w: 10, h: 0.35, fontSize: 13, fontFace: F, color: MUTED, margin: 0 });
  s.addText("标书快反", { x: M, y: 1.75, w: 8.2, h: 1.15, fontSize: 60, fontFace: F, bold: true, color: TXT, margin: 0 });
  s.addText([
    { text: "BidPilot", options: { color: PRIMARY, bold: true } },
    { text: "  ·  工程机械投标文件 AI 智能体", options: { color: MUTED } }
  ], { x: M, y: 2.95, w: 9.5, h: 0.6, fontSize: 26, fontFace: F, margin: 0 });
  s.addText([
    { text: "把投标标书处理从 2–3 天压缩到 10 秒：", options: { color: TXT, breakLine: true } },
    { text: "资格自查 · 技术偏离表 · 废标风险 TOP5 · 就绪度评分，一次生成。", options: { color: MUTED } }
  ], { x: M, y: 3.95, w: 9.2, h: 0.9, fontSize: 16, fontFace: F, margin: 0, paraSpaceAfter: 6 });
  const chips = ["反幻觉引擎", "双引擎架构", "140 项测试", "32 类参数", "v2.1"];
  chips.forEach((c, i) => {
    const cw = 2.28, cx = M + i * (cw + 0.25);
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: cx, y: 5.15, w: cw, h: 0.5, fill: { color: CARD }, line: { color: PRIMARY, width: 1 }, rectRadius: 0.25 });
    s.addText(c, { x: cx, y: 5.15, w: cw, h: 0.5, fontSize: 13, fontFace: F, color: ACCENT, align: "center", valign: "middle", margin: 0 });
  });
  /* 品牌母题：就绪度评分环（对应产品核心视觉） */
  s.addShape(p.shapes.OVAL, { x: 9.35, y: 1.7, w: 3.1, h: 3.1, fill: { color: BG }, line: { color: LINE, width: 10 } });
  s.addShape(p.shapes.OVAL, { x: 9.35, y: 1.7, w: 3.1, h: 3.1, fill: { color: BG, transparency: 100 }, line: { color: ACCENT, width: 10 } });
  s.addText("94", { x: 9.35, y: 2.55, w: 3.1, h: 1.0, fontSize: 54, fontFace: F, bold: true, color: GREEN, align: "center", margin: 0 });
  s.addText("演示场景就绪度评分", { x: 9.35, y: 3.55, w: 3.1, h: 0.35, fontSize: 12, fontFace: F, color: MUTED, align: "center", margin: 0 });
  s.addText("内置演示数据均为虚构 · 正式投标必须人工逐条复核", { x: M, y: H - 0.62, w: 10, h: 0.32, fontSize: 11, fontFace: F, color: FAINT, margin: 0 });
  s.addNotes("开场30秒：一句话定位——工程机械经销商的投标AI助手。强调右边评分环是产品真实界面元素。");
}

/* ================= S2 痛点 ================= */
{
  const s = slide("PAIN POINTS", "工程机械投标的三重痛点");
  s.addText("2–3", { x: M, y: 1.85, w: 3.6, h: 1.5, fontSize: 88, fontFace: F, bold: true, color: ACCENT, margin: 0 });
  s.addText("天", { x: 3.35, y: 2.85, w: 0.9, h: 0.6, fontSize: 28, fontFace: F, bold: true, color: ACCENT, margin: 0 });
  s.addText("一次投标，人工读公告、做偏离表、\n查废标条款的典型耗时", { x: M, y: 3.5, w: 4.1, h: 0.9, fontSize: 14, fontFace: F, color: MUTED, margin: 0 });
  card(s, M, 5.0, 4.1, 1.5);
  s.addText([
    { text: "而漏看一条的代价：", options: { color: MUTED, breakLine: true } },
    { text: "保证金没收 + 订单旁落 + 信用受损", options: { color: RED, bold: true } }
  ], { x: M + 0.25, y: 5.25, w: 3.7, h: 1.0, fontSize: 15, fontFace: F, margin: 0, paraSpaceAfter: 6 });

  const rows = [
    ["规则复杂", "32类参数、★▲条款、解密时限、保证金规则——漏一条即出局"],
    ["废标频发", "★参数不满足、授权书漏盖章、保证金晚到账：每一项都是一票否决"],
    ["经验难传承", "老师傅的避坑清单存在脑子里，新人每次都要重交学费"]
  ];
  rows.forEach((r, i) => {
    const y = 1.85 + i * 1.62;
    card(s, 5.3, y, 7.4, 1.38);
    numSq(s, 5.62, y + 0.43, "0" + (i + 1), i === 1 ? RED : PRIMARY);
    s.addText(r[0], { x: 6.4, y: y + 0.22, w: 6.0, h: 0.42, fontSize: 18, fontFace: F, bold: true, color: TXT, margin: 0 });
    s.addText(r[1], { x: 6.4, y: y + 0.66, w: 6.05, h: 0.6, fontSize: 13, fontFace: F, color: MUTED, margin: 0 });
  });
  s.addText("注：耗时为行业访谈估计（示例数据，参赛前以调研数据替换）", { x: M, y: H - 0.5, w: 8, h: 0.3, fontSize: 10.5, fontFace: F, color: FAINT, margin: 0 });
  s.addNotes("痛点讲完立刻抛转折句：这些坑，机器比人记得牢。");
}

/* ================= S3 方案总览 ================= */
{
  const s = slide("SOLUTION", "10 秒生成四份投标必备成果");
  s.addText([
    { text: "2–3 天", options: { fontSize: 30, color: MUTED, strike: true } },
    { text: "  →  ", options: { fontSize: 30, color: FAINT } },
    { text: "10 秒", options: { fontSize: 44, color: ACCENT, bold: true } }
  ], { x: M, y: 1.7, w: 4.85, h: 0.9, fontFace: F, margin: 0 });
  s.addText("贴入资料库与招标公告，四份成果一次成型；\n资料库里没有的信息，一个字都不编。", { x: M, y: 2.75, w: 4.4, h: 1.0, fontSize: 14, fontFace: F, color: MUTED, margin: 0 });
  card(s, M, 4.15, 4.4, 2.2);
  s.addText("四大输出", { x: M + 0.25, y: 4.35, w: 3.9, h: 0.35, fontSize: 13, fontFace: F, color: ACCENT, charSpacing: 2, margin: 0 });
  s.addText([
    { text: "资格自查 · 能投/缺什么/待核实", options: { bullet: bu(), breakLine: true } },
    { text: "技术偏离表 · 逐条满足/正/负偏离", options: { bullet: bu(), breakLine: true } },
    { text: "废标风险 TOP5 · 白话避坑提醒", options: { bullet: bu(), breakLine: true } },
    { text: "结论与评分 · 就绪度 0–100 + 前提清单", options: { bullet: bu() } }
  ], { x: M + 0.25, y: 4.72, w: 4.0, h: 1.5, fontSize: 13, fontFace: F, color: TXT, paraSpaceAfter: 6, margin: 0 });

  const rows = [
    ["输入", "本公司资料库（资质/业绩/设备参数） + 招标公告整段粘贴"],
    ["解析", "32类参数 · 单位换算 · ★▲条款定位 · 变更检测"],
    ["判定", "满足/正偏离/负偏离 · 上下限语义区分 · 跨口径冲突不瞎换算"],
    ["交付", "MD/HTML/PDF报告 · 补料清单 · 公告对比"]
  ];
  rows.forEach((r, i) => {
    const y = 1.7 + i * 1.24;
    card(s, 5.5, y, 7.2, 1.05);
    s.addText(r[0], { x: 5.78, y: y + 0.14, w: 1.2, h: 0.4, fontSize: 16, fontFace: F, bold: true, color: PRIMARY, margin: 0 });
    s.addText(r[1], { x: 5.78, y: y + 0.5, w: 6.7, h: 0.45, fontSize: 12.5, fontFace: F, color: MUTED, margin: 0 });
    if (i < 3) s.addShape(p.shapes.LINE, { x: 11.0, y: y + 1.05, w: 0, h: 0.19, line: { color: FAINT, width: 1.5, dashType: "dash" } });
  });
  s.addNotes("强调'一个字都不编'——引出下一页反幻觉设计。");
}

/* ================= S4 产品实拍1 ================= */
{
  const s = slide("PRODUCT", "产品实拍 · 资格自查与行动时间表");
  card(s, M - 0.06, 1.56, 7.6, 4.36);
  s.addImage({ path: IMG.qual, x: M, y: 1.62, w: 7.2, h: 4.05, sizing: { type: "cover", w: 7.2, h: 4.05 } });
  s.addText("资格自查页 · 产品实拍（演示数据为虚构）", { x: M, y: 5.98, w: 7.2, h: 0.3, fontSize: 11, fontFace: F, color: FAINT, margin: 0 });

  const pts = [
    ["7 张速览卡", "限价 / 保证金 / 解密时限 / 报名与开标时间 / 审查方式，一屏速览"],
    ["行动时间表", "自动倒排：报名截止 T-26 · 保证金 T-40 · 开标演练 T-41"],
    ["逐条自查", "有据/待人工核实双色标注，缺项自动进入补料清单"]
  ];
  pts.forEach((r, i) => {
    const y = 1.7 + i * 1.55;
    card(s, 8.35, y, 4.4, 1.32);
    s.addText(r[0], { x: 8.62, y: y + 0.18, w: 3.9, h: 0.4, fontSize: 16, fontFace: F, bold: true, color: ACCENT, margin: 0 });
    s.addText(r[1], { x: 8.62, y: y + 0.6, w: 3.9, h: 0.62, fontSize: 12, fontFace: F, color: MUTED, margin: 0 });
  });
  s.addNotes("指着速览卡说：这些数字全部从公告原文自动提取，不是手填。");
}

/* ================= S5 反幻觉 ================= */
{
  const s = slide("CORE BARRIER", "核心壁垒 · 反幻觉铁律");
  s.addText("“资料库里没有的，一个字都不编。”", { x: M, y: 1.55, w: 12.1, h: 0.62, fontSize: 24, fontFace: F, bold: true, color: ACCENT, margin: 0 });

  const boxes = [
    ["输入", "资料库 + 招标公告\n（唯一信息来源）", PRIMARY],
    ["规则引擎", "白名单引用 · 确定性判定\n32类参数 · 140项测试 · 审计日志", PRIMARY],
    ["输出协议", "缺失信息 → 固定占位符\n“该信息不在资料库中，请核实”", ACCENT]
  ];
  boxes.forEach((b, i) => {
    const x = M + i * 4.35;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: 2.5, w: 3.6, h: 1.5, fill: { color: CARD }, line: { color: b[2], width: 1.5 }, rectRadius: 0.1 });
    s.addText(b[0], { x: x + 0.25, y: 2.68, w: 3.1, h: 0.4, fontSize: 17, fontFace: F, bold: true, color: b[2], margin: 0 });
    s.addText(b[1], { x: x + 0.25, y: 3.12, w: 3.15, h: 0.75, fontSize: 12.5, fontFace: F, color: TXT, margin: 0 });
    if (i < 2) s.addText("→", { x: x + 3.68, y: 2.95, w: 0.7, h: 0.6, fontSize: 30, fontFace: F, color: FAINT, align: "center", margin: 0 });
  });

  const cards = [
    ["结论可回溯", "每个判定都能对应到公告原文片段，可审计、可追责"],
    ["编造即出局的行业", "投标场景里编造参数 = 废标 + 法律责任，通用大模型恰恰爱编"],
    ["双引擎兜底", "规则引擎离线可用（投标现场常没网），大模型负责开放式问答"]
  ];
  cards.forEach((c, i) => {
    const x = M + i * 4.35;
    card(s, x, 4.45, 3.6, 1.85);
    s.addText(c[0], { x: x + 0.25, y: 4.65, w: 3.1, h: 0.4, fontSize: 15, fontFace: F, bold: true, color: TXT, margin: 0 });
    s.addText(c[1], { x: x + 0.25, y: 5.08, w: 3.15, h: 1.1, fontSize: 12, fontFace: F, color: MUTED, margin: 0 });
  });
  s.addText("与“直接问大模型”的本质区别：我们从源头压制幻觉，而不是事后校对幻觉。", { x: M, y: 6.6, w: 12, h: 0.4, fontSize: 13, fontFace: F, color: MUTED, margin: 0 });
  s.addNotes("这是答辩防守核心页：评委问'和ChatGPT有什么区别'就翻这页。");
}

/* ================= S6 引擎能力 ================= */
{
  const s = slide("ENGINE", "32 类参数 · 7 大机型族 · 可解释判定");
  const stats = [
    ["32", "类技术参数", "装载/挖掘/起重/泵送/道路/环卫\n七大机型族全覆盖", PRIMARY],
    ["4 套", "单位自动换算", "mm↔m · 马力↔kW · 吨↔kg · L↔m³\n口径冲突拒绝瞎换算", ACCENT],
    ["★▲", "双级条款风控", "★负偏离→废标级 · ▲负偏离→评分复核\n原文批注视图：风险在原文上发光", GOLD],
    ["0–100", "就绪度评分", "权重可配置，脚注随报告输出\n权重 = 业务价值观", GREEN]
  ];
  stats.forEach((t, i) => {
    const x = M + (i % 2) * 2.95, y = 1.7 + Math.floor(i / 2) * 2.3;
    card(s, x, y, 2.75, 2.1);
    s.addText(t[0], { x: x + 0.22, y: y + 0.15, w: 2.3, h: 0.75, fontSize: 40, fontFace: F, bold: true, color: t[3], margin: 0 });
    s.addText(t[1], { x: x + 0.22, y: y + 0.95, w: 2.3, h: 0.35, fontSize: 13.5, fontFace: F, bold: true, color: TXT, margin: 0 });
    s.addText(t[2], { x: x + 0.22, y: y + 1.32, w: 2.35, h: 0.7, fontSize: 10.5, fontFace: F, color: MUTED, margin: 0 });
  });
  card(s, M - 0.06, 6.0, 6.0, 1.1);
  s.addText("140 项自动化测试全绿：正例可投 · 反例敢拒 · 乱输入不崩", { x: M + 0.2, y: 6.22, w: 5.7, h: 0.65, fontSize: 14, fontFace: F, bold: true, color: TXT, margin: 0 });

  card(s, 6.75, 1.7, 6.0, 5.4);
  s.addImage({ path: IMG.dev, x: 6.9, y: 1.95, w: 5.7, h: 3.2, sizing: { type: "cover", w: 5.7, h: 3.2 } });
  s.addText("偏离表实拍：★精准定位 · 6.58m 自动对比 ≥6500mm", { x: 6.95, y: 5.25, w: 5.6, h: 0.35, fontSize: 11.5, fontFace: F, color: MUTED, margin: 0 });
  s.addText("每个判定可回溯原文片段", { x: 6.95, y: 6.55, w: 5.6, h: 0.35, fontSize: 12, fontFace: F, color: ACCENT, margin: 0 });
  s.addNotes("左边四张卡按顺序讲，落到右边截图的★与单位换算两处细节。");
}

/* ================= S7 产品实拍2 敢说不 ================= */
{
  const s = slide("DEMO", "演示 · 工具敢于说“不”");
  card(s, M - 0.06, 1.56, 7.6, 4.36);
  s.addImage({ path: IMG.kill, x: M, y: 1.62, w: 7.2, h: 4.05, sizing: { type: "cover", w: 7.2, h: 4.05 } });
  s.addText("挖掘机场景 · 废标判定实拍", { x: M, y: 5.98, w: 7.2, h: 0.3, fontSize: 11, fontFace: F, color: FAINT, margin: 0 });

  s.addText([
    { text: "★爬坡能力 ", options: { color: GOLD, bold: true } },
    { text: "65%，不满足招标要求的 ≥70%", options: { color: TXT } }
  ], { x: 8.35, y: 1.75, w: 4.4, h: 0.8, fontSize: 16, fontFace: F, margin: 0 });
  const steps = [
    ["红色废标警告条", "★关键参数负偏离 = 直接否决投标", RED],
    ["评分压至 15 分 / D 级", "暂缓投标，非普通扣分", GOLD],
    ["前提第一条", "书面澄清或更换机型，否则不投", PRIMARY]
  ];
  steps.forEach((t, i) => {
    const y = 2.75 + i * 1.15;
    card(s, 8.35, y, 4.4, 0.98);
    s.addShape(p.shapes.OVAL, { x: 8.58, y: y + 0.3, w: 0.36, h: 0.36, fill: { color: t[2] } });
    s.addText(String(i + 1), { x: 8.58, y: y + 0.3, w: 0.36, h: 0.36, fontSize: 13, fontFace: F, bold: true, color: "0B1220", align: "center", valign: "middle", margin: 0 });
    s.addText(t[0], { x: 9.1, y: y + 0.12, w: 3.55, h: 0.38, fontSize: 14.5, fontFace: F, bold: true, color: TXT, margin: 0 });
    s.addText(t[1], { x: 9.1, y: y + 0.5, w: 3.55, h: 0.35, fontSize: 11.5, fontFace: F, color: MUTED, margin: 0 });
  });
  s.addText("工具的价值不是替你投，而是告诉你什么不能投。", { x: 8.35, y: 6.35, w: 4.4, h: 0.6, fontSize: 14, fontFace: F, bold: true, color: ACCENT, margin: 0 });
  s.addNotes("这页讲'敢说不'：输出红条+15分的组合，评委立刻理解★规则的分量。");
}

/* ================= S8 市场分析 ================= */
{
  const s = slide("MARKET", "市场分析 · 示例测算");
  const cards = [
    ["TAM", "8 亿/年", "全国 10万+ 工程机械经销商\n× 年投标 5–20 次 × SaaS 年费均值", PRIMARY],
    ["SAM", "2.4 亿/年", "华东区域可服务经销商\n（首阶段销售覆盖范围）", ACCENT],
    ["SOM", "30 万/年", "首年 50 家试点经销商\n（验证续费率后再放大）", GREEN]
  ];
  cards.forEach((c, i) => {
    const x = M + i * 4.15;
    card(s, x, 1.75, 3.9, 2.5);
    s.addText(c[0], { x: x + 0.28, y: 2.0, w: 3.3, h: 0.4, fontSize: 15, fontFace: F, bold: true, color: MUTED, charSpacing: 3, margin: 0 });
    s.addText(c[1], { x: x + 0.28, y: 2.4, w: 3.3, h: 0.9, fontSize: 44, fontFace: F, bold: true, color: c[3], margin: 0 });
    s.addText(c[2], { x: x + 0.28, y: 3.4, w: 3.4, h: 0.7, fontSize: 11.5, fontFace: F, color: MUTED, margin: 0 });
  });
  card(s, M, 4.6, 12.13, 1.7);
  s.addText("测算口径", { x: M + 0.28, y: 4.8, w: 3, h: 0.35, fontSize: 13, fontFace: F, color: ACCENT, charSpacing: 2, margin: 0 });
  s.addText([
    { text: "付费动因：一次废标损失（保证金 + 机会成本）≈ 数年 SaaS 年费，付费逻辑成立", options: { bullet: bu(), breakLine: true } },
    { text: "获客路径：行业协会与厂商渠道 —— 我们帮厂商的经销商中标，厂商有推荐动力", options: { bullet: bu(), breakLine: true } },
    { text: "扩品路径：七大机型族已覆盖，规则库横向复制成本低", options: { bullet: bu() } }
  ], { x: M + 0.28, y: 5.18, w: 11.6, h: 1.05, fontSize: 13, fontFace: F, color: TXT, paraSpaceAfter: 5, margin: 0 });
  s.addText("以上为示例测算（est.），参赛提交前以中国工程机械工业协会等公开数据核校。", { x: M, y: 6.55, w: 12, h: 0.35, fontSize: 10.5, fontFace: F, color: FAINT, margin: 0 });
  s.addNotes("强调数字是示例口径，答辩时展示测算框架而非编造精确数。");
}

/* ================= S9 商业模式 ================= */
{
  const s = slide("BUSINESS MODEL", "商业模式 · 三档收费");
  const rows = [
    [["经销商 SaaS 席位", true], ["年费订阅", false], ["网页版 + Coze 智能体 + 规则库更新", false], ["主力营收", true]],
    [["小散用户", false], ["按次计费", false], ["单标分析，低门槛获客", false], ["获客漏斗", true]],
    [["制造商 / 代理机构", false], ["项目制定制", false], ["私有部署 + 规则库定制 + 培训", false], ["高毛利", true]]
  ];
  const cols = [3.4, 2.0, 4.9, 1.6];
  let y = 1.8;
  s.addText("客户", { x: M + 0.25, y, w: cols[0], h: 0.35, fontSize: 12, fontFace: F, color: FAINT, charSpacing: 2, margin: 0 });
  s.addText("收费", { x: M + 0.25 + cols[0], y, w: cols[1], h: 0.35, fontSize: 12, fontFace: F, color: FAINT, charSpacing: 2, margin: 0 });
  s.addText("交付内容", { x: M + 0.25 + cols[0] + cols[1], y, w: cols[2], h: 0.35, fontSize: 12, fontFace: F, color: FAINT, charSpacing: 2, margin: 0 });
  s.addText("定位", { x: M + 0.25 + cols[0] + cols[1] + cols[2], y, w: cols[3], h: 0.35, fontSize: 12, fontFace: F, color: FAINT, charSpacing: 2, margin: 0 });
  y += 0.45;
  rows.forEach((r, i) => {
    card(s, M, y, 12.13, 1.15);
    s.addText(r[0][0], { x: M + 0.25, y: y + 0.18, w: cols[0], h: 0.45, fontSize: 17, fontFace: F, bold: true, color: i === 0 ? ACCENT : TXT, margin: 0 });
    s.addText(r[1][0], { x: M + 0.25 + cols[0], y: y + 0.18, w: cols[1], h: 0.45, fontSize: 15, fontFace: F, color: TXT, margin: 0 });
    s.addText(r[2][0], { x: M + 0.25 + cols[0] + cols[1], y: y + 0.18, w: cols[2], h: 0.45, fontSize: 13.5, fontFace: F, color: MUTED, margin: 0 });
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M + 0.25 + cols[0] + cols[1] + cols[2], y: y + 0.28, w: 1.35, h: 0.5, fill: { color: "1B2A45" }, line: { color: PRIMARY, width: 1 }, rectRadius: 0.25 });
    s.addText(r[3][0], { x: M + 0.25 + cols[0] + cols[1] + cols[2], y: y + 0.28, w: 1.35, h: 0.5, fontSize: 12.5, fontFace: F, color: ACCENT, align: "center", valign: "middle", margin: 0 });
    y += 1.35;
  });
  s.addText("定价★（示例）：席位年费 3,000–8,000 元 · 单次 99–299 元 · 定制项目 5 万起 —— 以试点验证后定价", { x: M, y: 6.35, w: 12.1, h: 0.4, fontSize: 12, fontFace: F, color: MUTED, margin: 0 });
  s.addNotes("定价是示例区间，答辩话术：先验证续费率，再锁价。");
}

/* ================= S10 竞争分析 ================= */
{
  const s = slide("COMPETITION", "竞争分析 · 我们赢在规则库与合规");
  const head = ["维度", "通用大模型", "传统标书软件", "标书快反"];
  const rows = [
    ["反幻觉合规", "会编造参数", "模板无判定", "白名单协议+占位符"],
    ["偏离判定规则库", "无行业规则", "无智能判定", "32类参数·上下限语义"],
    ["结论可审计", "黑盒输出", "不可追溯", "逐条对应原文片段"],
    ["离线可用", "需联网", "可离线", "规则引擎离线运行"]
  ];
  const cw = [2.5, 2.9, 2.9, 3.6];
  let x = M;
  head.forEach((h, i) => {
    const hi = i === 3;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: 1.75, w: cw[i] - 0.12, h: 0.62, fill: { color: hi ? PRIMARY : CARD }, line: { color: LINE, width: 1 }, rectRadius: 0.08 });
    s.addText(h, { x, y: 1.75, w: cw[i] - 0.12, h: 0.62, fontSize: 15, fontFace: F, bold: true, color: hi ? "FFFFFF" : MUTED, align: "center", valign: "middle", margin: 0 });
    x += cw[i];
  });
  rows.forEach((r, ri) => {
    let x = M;
    const y = 2.55 + ri * 1.02;
    r.forEach((cell, ci) => {
      const hi = ci === 3;
      s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: cw[ci] - 0.12, h: 0.86, fill: { color: hi ? "16233C" : CARD }, line: { color: hi ? PRIMARY : LINE, width: 1 }, rectRadius: 0.08 });
      s.addText(cell, { x: x + 0.12, y, w: cw[ci] - 0.36, h: 0.86, fontSize: ci === 0 ? 13.5 : 12.5, fontFace: F, bold: ci === 0 || hi, color: ci === 0 ? TXT : hi ? ACCENT : MUTED, valign: "middle", margin: 0 });
      x += cw[ci];
    });
  });
  s.addText("护城河 = 工程机械投标规则库（人工拆解积累）+ 反幻觉协议（合规刚需），大厂看不见、小厂抄不走。", { x: M, y: 6.7, w: 12.1, h: 0.4, fontSize: 13, fontFace: F, color: ACCENT, margin: 0 });
  s.addNotes("承认大模型能力强，但强调投标场景的第一约束是'不能编'。");
}

/* ================= S11 团队与进度 ================= */
{
  const s = slide("TEAM & ROADMAP", "团队与进度 · AI 原生开发方法论");
  const team = [
    ["队长 · 国际经济与贸易", "产品定义 / 商业模式 / 市场分析与答辩"],
    ["队员 A", "材料生产 / 演示录屏 / 数据整理"],
    ["队员 B", "客户访谈 / 答辩陈述 / 试点对接"]
  ];
  team.forEach((t, i) => {
    const y = 1.7 + i * 1.28;
    card(s, M, y, 5.6, 1.08);
    s.addText(t[0], { x: M + 0.25, y: y + 0.14, w: 5.1, h: 0.4, fontSize: 15.5, fontFace: F, bold: true, color: TXT, margin: 0 });
    s.addText(t[1], { x: M + 0.25, y: y + 0.56, w: 5.1, h: 0.4, fontSize: 12, fontFace: F, color: MUTED, margin: 0 });
  });
  card(s, M, 5.6, 5.6, 1.2);
  s.addText([
    { text: "AI 原生开发：", options: { bold: true, color: ACCENT } },
    { text: "两周交付传统团队一个月的活；140 项自动化测试 + CI徽章 + 审计日志 = 严谨看得见。", options: { color: MUTED } }
  ], { x: M + 0.25, y: 5.78, w: 5.1, h: 0.9, fontSize: 12.5, fontFace: F, margin: 0 });

  const tl = [
    ["已完成", "v1.0–v2.1.1 可运行产品：四大输出 / 32类参数7大机型 / ★▲风控 / 原文批注 / 置信度 / 审计日志 / 140项测试", GREEN],
    ["30 天内", "3–5 家经销商试点 · 50 份真实标书扩充规则库 · 续费率验证", PRIMARY],
    ["90 天内", "Coze 公开版上线 · 客户交互智能体（工程机械外贸询盘，衔接国贸专业）", ACCENT]
  ];
  tl.forEach((t, i) => {
    const y = 1.7 + i * 1.72;
    card(s, 6.7, y, 6.05, 1.5);
    s.addShape(p.shapes.OVAL, { x: 6.98, y: y + 0.24, w: 0.22, h: 0.22, fill: { color: t[2] } });
    if (i < 2) s.addShape(p.shapes.LINE, { x: 7.09, y: y + 0.5, w: 0, h: 1.24, line: { color: LINE, width: 1.5 } });
    s.addText(t[0], { x: 7.35, y: y + 0.14, w: 5.1, h: 0.4, fontSize: 16, fontFace: F, bold: true, color: t[2], margin: 0 });
    s.addText(t[1], { x: 7.35, y: y + 0.56, w: 5.15, h: 0.8, fontSize: 12, fontFace: F, color: MUTED, margin: 0 });
  });
  s.addNotes("进度页诚实：已完成的是可用产品，未完成的是试点——正是参赛要拿资源去做的事。");
}

/* ================= S12 结尾 ================= */
{
  const s = p.addSlide();
  s.background = { color: BG };
  s.addText("把 2–3 天的标书活儿\n压缩到 10 秒。", { x: M, y: 1.7, w: 11.5, h: 2.2, fontSize: 48, fontFace: F, bold: true, color: TXT, margin: 0 });
  s.addText("反幻觉 · 可回溯 · 双引擎 · 敢说不", { x: M, y: 4.1, w: 10, h: 0.55, fontSize: 20, fontFace: F, bold: true, color: ACCENT, margin: 0 });
  s.addText([
    { text: "标书快反 BidPilot — 工程机械投标文件 AI 智能体", options: { color: MUTED, breakLine: true } },
    { text: "在线演示：https://azzb66223944qq.github.io/bidpilot/ · 官方咨询：4001109999", options: { color: FAINT } }
  ], { x: M, y: 5.6, w: 10, h: 0.9, fontSize: 14, fontFace: F, margin: 0, paraSpaceAfter: 8 });
  s.addText("演示数据均为虚构 · AI 辅助分析不能替代人工复核", { x: M, y: H - 0.62, w: 10, h: 0.32, fontSize: 11, fontFace: F, color: FAINT, margin: 0 });
  s.addNotes("收尾回到第一句话，形成闭环。");
}

p.writeFile({ fileName: "docs/Roadshow-Deck-BidPilot.pptx" }).then(() => console.log("PPT done: docs/Roadshow-Deck-BidPilot.pptx"));
