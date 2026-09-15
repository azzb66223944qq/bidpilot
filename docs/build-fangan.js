/* 标书快反 · 参赛方案文档生成 */
const { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, PageNumber,
        BorderStyle, SectionType, NumberFormat, TableOfContents, PageBreak } = require("docx");
const fs = require("fs");
const C = require("./common.js");

const SS = "docs/screenshots/";
const bodyChildren = [];

/* 一、项目背景与痛点 */
bodyChildren.push(C.h1("一、项目背景与痛点"));
bodyChildren.push(C.body("工程机械经销商参与设备采购投标频繁，一份标书的资格自查与技术偏离表制作通常耗时2至3天。投标规则复杂：32类以上技术参数、★关键条款、在线解密时限、保证金账户要求，任一疏漏即导致废标——保证金没收、订单旁落、信用受损。更深层的问题是：老师傅的避坑经验存在于个人头脑中，难以沉淀为组织能力，新人每次都要重新交学费。"));
bodyChildren.push(C.body("与此同时，通用大语言模型直接用于投标场景存在致命缺陷：会编造参数。在招投标语境下，编造即废标并可能引发法律责任。因此，本领域需要的不是更强的生成能力，而是确定、可审计、不编造的判定能力。"));

/* 二、解决方案 */
bodyChildren.push(C.h1("二、解决方案"));
bodyChildren.push(C.body("标书快反（BidPilot）是一款面向工程机械经销商的投标文件AI智能体。用户粘贴本公司资料库与招标公告原文，10秒内生成四份投标必备成果：资格自查表、技术偏离表、废标风险TOP5清单、投标就绪度评分报告（0至100分，A/B/C/D四级），并给出是否建议投标及前提条件清单。"));
bodyChildren.push(C.bullet("资格自查：", "逐条对照资格要求，输出有据/待人工核实双色标注，自动列出保证金、CA证书等平台待办；"));
bodyChildren.push(C.bullet("技术偏离表：", "32类技术参数逐条响应，标注满足/正偏离/负偏离/资料库无/待人工补充五态；"));
bodyChildren.push(C.bullet("废标风险TOP5：", "以业务员可读的白话提示解密时限、同网络串标、保证金账户、授权书用印、限价与截止时间五大高危项；"));
bodyChildren.push(C.bullet("结论与评分：", "就绪度评分、等级结论与前提条件清单，权重可配置且随报告输出脚注。"));
bodyChildren.push(C.body("围绕核心判定，产品提供公告变更检测（澄清/补遗前后两版自动比对，六类变更按风险分级）、对比选型（双评分环对决与A/B双列偏离对照）、投标行动时间表（报名、保证金、开标三节点倒排）、一键补料清单、报告三路导出（Markdown/HTML/打印PDF）、我的设备库与中英文界面等运营辅助能力，并支持PWA一键安装为桌面及移动应用。"));

/* 三、技术方案 */
bodyChildren.push(C.h1("三、技术方案与总体架构"));
bodyChildren.push(C.h2("3.1 双引擎架构"));
bodyChildren.push(C.body("规则引擎（engine.js，纯函数模块，浏览器与Node双端运行）承担参数提取、单位换算、偏离判定、评分计算等确定性工作，离线可用、结论可回溯、可单元测试；大模型引擎兼容OpenAI协议接口，亦可部署于扣子、Dify平台，承担开放式问答。两引擎共用同一反幻觉系统提示词。总体策略为：规则引擎保底、大模型增强、人工复核兜底。"));
bodyChildren.push(C.h2("3.2 反幻觉三层防线"));
bodyChildren.push(C.bullet("输入层·白名单协议：", "仅允许引用资料库与招标公告两份输入；"));
bodyChildren.push(C.bullet("判定层·确定性代码：", "全部数值比较由代码完成，绕开模型自由发挥；"));
bodyChildren.push(C.bullet("输出层·占位符协议：", "缺失信息强制输出固定提示，业务员拿到的是补料清单而非错误答案。"));
bodyChildren.push(C.h2("3.3 行业规则库与判定语义"));
bodyChildren.push(C.body("规则库覆盖32类技术参数，支持大于等于、不超过、区间等中文数值写法解析与三套单位自动换算（毫米↔米、马力↔千瓦、吨↔千克）；对无法安全换算的口径冲突拒绝自动换算、转人工核对。偏离判定区分下限型与上限型语义：下限型超限标正偏离，上限型达标即为满足。★关键参数采用段级定位算法精确识别归属，★参数负偏离触发废标级判定（评分压制至15分D级、全页红色警告），★参数缺失输出琥珀色预警。"));
bodyChildren.push(C.h2("3.4 公告变更检测与可生长规则库"));
bodyChildren.push(C.body("公告变更检测对澄清/补遗前后的两版公告分别做结构化提取后逐项对照，覆盖限价、保证金、时间节点、参数要求、★标注、证明材料六类变更，按风险分级输出并附处置建议；比对全程为确定性提取加对照，不做任何猜测。自定义词库允许用户登记设备表述别名并归属到具体参数，判定时自动并入关键词，且在偏离表诚实标注匹配来源；规则库随使用持续生长，形成数据资产。"));
bodyChildren.push(C.figure(SS + "1-qual-loader.png"));
bodyChildren.push(C.caption("图3-1 资格自查页与投标行动时间表（产品实拍，演示数据为虚构）"));

/* 四、创新点 */
bodyChildren.push(C.h1("四、创新点"));
bodyChildren.push(C.bullet("反幻觉工程化：", "以白名单、确定性判定、占位符输出三层协议系统性压制大模型幻觉，契合投标场景零编造要求；"));
bodyChildren.push(C.bullet("可解释评分模型：", "扣分制权重模型（负偏离/缺参数/待核对/缺证明四项可配置），脚注随报告输出，权重即业务价值观；"));
bodyChildren.push(C.bullet("★关键参数段级识别：", "将招标惯例中的一票否决条款工程化，自动区分废标级风险与普通扣分；"));
bodyChildren.push(C.bullet("公告变更检测：", "面向澄清/补遗场景的新旧公告结构化比对，属行业内少见的落地功能；"));
bodyChildren.push(C.bullet("AI原生开发方法论：", "以提示词工程、规则库与140项自动化测试替代传统编码，快速交付可验证产品。"));

/* 五、实施计划 */
bodyChildren.push(C.h1("五、实施计划与里程碑"));
bodyChildren.push(C.tbl(["阶段", "时间", "目标与交付"], [
  ["已完成", "至今", "V2.1.1可运行产品并已部署上线（在线体验：https://azzb66223944qq.github.io/bidpilot/）：四大输出、32类参数7大机型族、对比选型、★▲双级风控、公告变更检测、自定义词库、PWA；140项自动化测试+6组黄金快照全绿（GitHub Actions徽章）"],
  ["试点验证", "30天内", "3至5家经销商试点，收集50份真实标书扩充规则库，验证续费意愿"],
  ["公开部署", "90天内", "Coze公开版智能体上线，GitHub开源仓库运营，微信小程序立项"],
  ["能力扩展", "180天内", "商务条款与评分办法核对、客户交互智能体（外贸询盘）"],
], [1600, 1500, 7000]));
bodyChildren.push(C.caption("表5-1 实施里程碑"));

/* 六、商业模式 */
bodyChildren.push(C.h1("六、商业模式与市场"));
bodyChildren.push(C.body("采用三档收费：经销商SaaS席位年费（主力营收）、小散用户按次计费（获客漏斗）、制造商与代理机构项目制定制（私有部署与规则库定制，高毛利）。付费动因清晰：一次废标损失约等于数年SaaS年费。获客走行业协会与厂商渠道——产品帮助厂商的经销商提高中标率，厂商具备推荐动力。市场规模测算（示例口径，提交前以公开数据核校）：全国工程机械经销商超10万家，按年投标5至20次、年费3000至8000元测算，可服务市场约5至10亿元每年。"));

/* 七、团队分工 */
bodyChildren.push(C.h1("七、团队与分工"));
bodyChildren.push(C.tbl(["角色", "职责"], [
  ["队长（国际经济与贸易专业）", "产品定义、商业模式与市场分析、商业计划书与答辩"],
  ["队员A", "材料生产、演示录屏、数据整理"],
  ["队员B", "客户访谈、答辩陈述、试点对接"],
], [3800, 6300]));
bodyChildren.push(C.caption("表7-1 团队分工"));
bodyChildren.push(C.body("团队采用AI原生开发方法论：以业务规则拆解、提示词工程与自动化测试体系替代传统手写编码，两周内完成传统团队约一个月的工作量，且全部判定逻辑均有测试锁定。"));

/* 八、风险与对策 */
bodyChildren.push(C.h1("八、风险与对策"));
bodyChildren.push(C.tbl(["风险", "对策"], [
  ["招标文件格式千差万别", "规则引擎保底、大模型增强、人工复核兜底三层递进；认不出的表述诚实标注待核对，绝不硬判"],
  ["通用大模型厂商下场", "壁垒在行业规则库与反幻觉协议而非模型本身；规则库随使用生长形成数据资产"],
  ["早期客户信任", "演示数据全虚构声明、密钥与数据仅存本机、结论可回溯原文，以合规与透明建立信任"],
  ["团队工程经验不足", "140项自动化测试锁定行为；重大变更先写测试再改代码"],
], [3400, 6700]));
bodyChildren.push(C.caption("表8-1 风险与对策"));

/* 九、合规声明 */
bodyChildren.push(C.h1("九、合规与数据声明"));
bodyChildren.push(C.body("产品内置演示数据均为虚构，仅用于功能演示；输出不能替代人工复核，正式投标前必须逐条核对招标文件原文。用户数据（历史记录、设备库、API密钥）仅保存在本机浏览器，不上传任何服务器。因使用本工具造成的任何投标损失由使用者自行承担。"));

/* 组装 */
const pageSize = { width: 11906, height: 16838 };
const bodyMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };
const footerArabic = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.MUTED })] })] });
const footerRoman = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.MUTED })] })] });
const headerBody = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.PAL.table.innerLine, space: 4 } },
  children: [new TextRun({ text: "标书快反 BidPilot · 参赛项目方案文档", size: 16, color: C.MUTED })] })] });

const doc = new Document({
  creator: "标书快反团队",
  title: "标书快反参赛项目方案文档",
  features: { updateFields: true },
  styles: { default: { document: {
    run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: C.BODY },
    paragraph: { spacing: { line: 312 } },
  }}},
  sections: [
    { properties: { page: { size: pageSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: C.buildCoverR2({
        palette: C.PAL,
        englishLabel: "PROJECT PROPOSAL",
        title: "标书快反项目方案文档",
        subtitle: "基于反幻觉双引擎的工程机械投标文件智能生成系统 · V2.1.1",
        metaLines: ["第十五届中国创新创业大赛 AI+工程机械专业赛", "AI+运营方向 · 2026年9月"],
        footerRight: "BidPilot Team · 演示数据均为虚构",
      }) },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: pageSize, margin: bodyMargin,
        pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } },
      footers: { default: footerRoman },
      children: [
        new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "目  录", bold: true, size: 32, color: C.PAL.primary, font: { eastAsia: "SimHei" } })] }),
        new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({ spacing: { before: 200 },
          children: [new TextRun({ text: "提示：在 Word 中右键目录并选择更新域，可刷新页码。", size: 18, color: "909090", italics: true })] }),
        new Paragraph({ children: [new PageBreak()] }),
      ] },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: pageSize, margin: bodyMargin,
        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: headerBody }, footers: { default: footerArabic },
      children: bodyChildren },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("docs/Proposal-BidPilot.docx", buf);
  console.log("DOCX done: docs/Proposal-BidPilot.docx");
});
