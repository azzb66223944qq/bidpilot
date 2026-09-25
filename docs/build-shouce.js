/* 标书快反 · 使用说明书生成（V3.0）
 * 输出：docs/Manual-BidPilot.docx（佐证材料名：使用说明书）
 * 运行：在项目根目录执行 node docs/build-shouce.js
 */
const { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, PageNumber,
        BorderStyle, SectionType, NumberFormat } = require("docx");
const fs = require("fs");
const C = require("./common.js");
const SS = "docs/screenshots/";

const bodyChildren = [];

/* 一、获取与安装 */
bodyChildren.push(C.h1("一、获取与安装"));
bodyChildren.push(C.body("标书快反为纯前端单页应用，无需注册账号、无需安装客户端，业务数据仅存本机浏览器。三种运行方式如下："));
bodyChildren.push(C.tbl(["方式", "操作", "适用场景"], [
  ["在线版（推荐）", "浏览器打开 azzb66223944qq.github.io/bidpilot，即开即用", "日常使用，自动获取最新版本"],
  ["PWA 安装", "在线版打开后，浏览器菜单选择“添加到主屏幕/安装”，获得桌面/手机应用图标", "高频使用；安装后可离线运行"],
  ["本地单文件", "将 index.html、engine.js、cases.js 置于同一文件夹，双击 index.html 打开", "完全离线环境；此方式下 PWA 与在线更新不生效"],
], [2200, 4400, 3500]));
bodyChildren.push(C.caption("表 1-1 三种运行方式"));

/* 二、两段式工作流 */
bodyChildren.push(C.h1("二、两段式工作流（先读懂这一节）"));
bodyChildren.push(C.body("投标信息在两个阶段以两种形态出现，标书快反对应提供两级分析能力："));
bodyChildren.push(C.tbl(["阶段", "你能拿到什么", "用什么功能", "回答什么问题"], [
  ["公告期（报名前）", "公开招标公告：限价、时间表、资格要求、主要参数摘要", "商机雷达：多条公告批量预筛", "这一批公告里，哪个标值得报名？"],
  ["文件期（报名下载标书后、开标前）", "完整招标文件：第四章技术参数、评分标准、合同条款", "生成投标分析：可配合“导入采购文件PDF”自动定位技术参数章节", "完整参数逐条怎么响应？哪里会废标？"],
], [2400, 3400, 2400, 2900]));
bodyChildren.push(C.caption("表 2-1 公告期与文件期的对应能力"));
bodyChildren.push(C.body("两段衔接：公告期用商机雷达完成“该不该报名”的筛选；报名获取完整招标文件后，将文件文本粘贴至公告区（或使用 PDF 导入），运行完整分析获得四份成果。两段使用同一套设备资料库与判定规则。"));

/* 三、基础分析五步 */
bodyChildren.push(C.h1("三、基础分析五步"));
bodyChildren.push(C.bullet("第 1 步：", "在左侧①“本公司资料库”粘贴本公司资质、业绩与设备参数（首次可点演示场景体验）；"));
bodyChildren.push(C.bullet("第 2 步：", "在左侧②“招标公告”粘贴公告原文；若已获取完整招标文件 PDF，点击“导入采购文件PDF”，系统本地解析并自动定位技术参数章节追加至公告区（纯扫描件无文本层时将明确提示，请手动复制参数章节）；"));
bodyChildren.push(C.bullet("第 3 步：", "点击“▶ 生成投标分析”，本地引擎通常在数十毫秒内完成；"));
bodyChildren.push(C.bullet("第 4 步：", "阅读右侧四份成果（见第四节）；"));
bodyChildren.push(C.bullet("第 5 步：", "按需导出：下载 Markdown/HTML 完整报告、复制补料清单发给制造商、打印为 PDF。"));
bodyChildren.push(C.figure(SS + "shot-1-qual.png"));
bodyChildren.push(C.caption("图 3-1 生成分析后的资格自查页：项目速览卡、行动时间表与逐条自查"));

/* 四、四大成果怎么读 */
bodyChildren.push(C.h1("四、四大成果怎么读"));
bodyChildren.push(C.h2("4.1 资格自查"));
bodyChildren.push(C.body("顶部为项目速览卡（限价、预算、保证金、解密时限、报名/开标时间、距开标天数）与倒排行动时间表；下方逐条列明要求、依据与自查结论。“有据”代表资料库可支撑，“待人工核实”代表需补齐材料——它是待办清单，不是错误。"));
bodyChildren.push(C.h2("4.2 技术偏离表"));
bodyChildren.push(C.body("逐条判定招标参数：满足、正偏离（优于要求，可作加分亮点）、负偏离（不达标）、待人工核对、资料库无。★号参数为关键参数（负偏离通常直接否决投标），▲为重要条款（通常影响评分）；“●高/◐中”为判定置信度，单位口径冲突或经自定义词库匹配时会降为中置信并附说明。"));
bodyChildren.push(C.figure(SS + "shot-2-dev.png"));
bodyChildren.push(C.caption("图 4-1 技术偏离表：逐条判定、★▲标注与置信度"));
bodyChildren.push(C.h2("4.3 废标风险 TOP5（含判例引用）"));
bodyChildren.push(C.body("解密时限、同网络串标、保证金三查、授权书用印、限价与截止时间五大风险以白话呈现，每条附动作建议；V3.0 起按类别挂载真实官方判例（财政部指导性案例、省级财政厅处理决定等），附原文引句、法条依据与出处链接；无同类判例时诚实标注“暂无”。"));
bodyChildren.push(C.h2("4.4 结论与评分"));
bodyChildren.push(C.body("就绪度评分=100−负偏离×权重1−缺参数×权重2−待核对×权重3−缺证明×权重4，权重可在设置中按行业调整并随报告输出脚注。A≥85 建议投标，B 70-84 补料后可投，C 55-69 谨慎评估，D<55 暂缓；★关键参数负偏离触发废标级判定，评分压制至 15 分 D 级并全页红色警告。"));
bodyChildren.push(C.figure(SS + "shot-3-kill.png"));
bodyChildren.push(C.caption("图 4-2 ★关键参数负偏离场景：直接否决判定与 15 分 D 级"));

/* 五、商机雷达 */
bodyChildren.push(C.h1("五、商机雷达（公告期批量预筛）"));
bodyChildren.push(C.bullet("第 1 步：", "切换至“📡 商机雷达”标签页，在“参与预筛的设备”中勾选当前资料库或已保存的设备库（可多选）；"));
bodyChildren.push(C.bullet("第 2 步：", "将多条公告粘贴至输入框，每条之间用单独一行 ==== 分隔（或点“载入演示公告集”体验）；"));
bodyChildren.push(C.bullet("第 3 步：", "点击“📡 批量预筛”，系统输出四档分诊：可投 / 边缘 / 不可投 / 机型不符，附参数覆盖率、依据与截止时间；"));
bodyChildren.push(C.bullet("第 4 步：", "对目标公告点“载入分析”，自动回到完整分析流程。"));
bodyChildren.push(C.body("说明：预筛为确定性分诊，品类不符（如洒水车公告对装载机设备）自动沉底；“边缘”与“不可投”建议先补齐资料库再做完整分析，最终结论以完整分析页为准。"));
bodyChildren.push(C.figure(SS + "shot-5-radar.png"));
bodyChildren.push(C.caption("图 5-1 商机雷达：6 条公告批量预筛，可投 1 · 机型不符 5，按截止时间倒排"));

/* 六、公告变更检测 */
bodyChildren.push(C.h1("六、公告变更检测（补遗不怕漏看）"));
bodyChildren.push(C.body("招标人发布澄清/补遗后，切换至“🔀 公告对比”标签页：将旧版公告载入左侧、新版粘贴右侧（或点“载入对比演示”体验），点击“对比两版公告”。系统对限价、保证金、开标时间、报名截止、解密时限、资格审查方式、联合体条款及全部技术参数、★标注、证明材料要求逐项比对，高风险变更置顶并附处置建议。"));
bodyChildren.push(C.figure(SS + "shot-6-diff.png"));
bodyChildren.push(C.caption("图 6-1 公告对比：6 处高风险变更逐项列出并附处置建议"));

/* 七、原文批注 */
bodyChildren.push(C.h1("七、原文批注视图"));
bodyChildren.push(C.body("“🔍 原文批注”将判定结果投射回招标公告原文：★关键条款金色高亮、负偏离红色、正偏离蓝色、待核实虚线标注，悬停可查看对应判定。本视图与偏离表同源，不做任何额外推断——风险在哪里发光，一眼定位。"));
bodyChildren.push(C.figure(SS + "shot-4-anno.png"));
bodyChildren.push(C.caption("图 7-1 原文批注：判定结果在招标原文上定位"));

/* 八、进阶功能速查 */
bodyChildren.push(C.h1("八、进阶功能速查"));
bodyChildren.push(C.tbl(["功能", "入口", "说明"], [
  ["双设备对比选型", "输入区“🔀 对比选型模式”", "贴入第二台设备资料库，同一标输出 A/B 对比、雷达图与选型建议"],
  ["自定义词库", "顶部“📖 词库”", "登记设备表述别名（如“额定容积”→标准斗容），规则库随使用生长，匹配处诚实标注来源"],
  ["评分权重配置", "顶部“⚙ 设置”", "四项权重按行业调整，影响就绪度评分，报告随附权重脚注"],
  ["大模型模式（可选）", "顶部切换“接入大模型”", "填入 OpenAI 兼容 API（如智谱 GLM），受同一反幻觉提示词约束；推荐将系统提示词部署至扣子/Dify"],
  ["审计日志", "结论页底部", "每次分析自动留痕（时间、引擎版本、输入指纹、评分），支持 JSON 导出"],
  ["资产包", "⚙ 设置底部", "词库+设备库+权重+偏好一键导出/导入（不含 API 密钥），团队共享与换机迁移"],
], [2400, 3000, 4700]));
bodyChildren.push(C.caption("表 8-1 进阶功能速查"));

/* 九、常见问题 */
bodyChildren.push(C.h1("九、常见问题"));
bodyChildren.push(C.bullet("PDF 导入提示“疑似扫描件”？", "该 PDF 无文本层（纯扫描图），本地解析无法提取文字。请手动复制参数章节粘贴至公告区，或使用带文字层的电子版招标文件。"));
bodyChildren.push(C.bullet("大模型模式调用失败？", "浏览器直连部分 API 会遇跨域限制。可切回内置规则引擎（离线可用），或将系统提示词部署至扣子/Dify 平台。"));
bodyChildren.push(C.bullet("本地双击打开为何不能安装 PWA？", "file:// 方式下浏览器安全机制不启用 Service Worker，属正常现象，应用功能不受影响；在线版可正常安装。"));
bodyChildren.push(C.bullet("我的数据存在哪里？", "全部业务数据（资料库、设备库、词库、历史、审计日志）仅存本机浏览器 localStorage，不上传任何服务器。清除浏览器数据前请注意导出资产包备份。"));

/* 免责 */
bodyChildren.push(C.body("——"));
bodyChildren.push(C.body("数据声明：内置演示数据均为虚构；本工具不编造任何未提供的品牌、机型、参数、业绩与资质；AI 辅助分析不能替代人工复核，正式投标前必须逐条核对招标文件原文。"));

/* 组装 */
const pageSize = { width: 11906, height: 16838 };
const bodyMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };
const footerArabic = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.MUTED })] })] });
const headerBody = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.PAL.table.innerLine, space: 4 } },
  children: [new TextRun({ text: "标书快反 BidPilot · 使用说明书", size: 16, color: C.MUTED })] })] });

const doc = new Document({
  creator: "标书快反团队",
  title: "标书快反使用说明书",
  styles: { default: { document: {
    run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: C.BODY },
    paragraph: { spacing: { line: 312 } },
  }}},
  sections: [
    { properties: { page: { size: pageSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: C.buildCoverR2({
        palette: C.PAL,
        englishLabel: "USER GUIDE",
        title: "标书快反使用说明书",
        subtitle: "从招标公告到投标决策 · 快速上手手册",
        metaLines: ["适用版本 V3.0 · 2026年9月", "在线体验：azzb66223944qq.github.io/bidpilot"],
        footerRight: "BidPilot Team · 演示数据均为虚构",
      }) },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: pageSize, margin: bodyMargin,
        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: headerBody }, footers: { default: footerArabic },
      children: bodyChildren },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("docs/Manual-BidPilot.docx", buf);
  console.log("DOCX done: docs/Manual-BidPilot.docx");
});
