/* 标书快反 · 产品简介（精简公开版） */
const { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType,
        BorderStyle, HeadingLevel, PageNumber } = require("docx");
const fs = require("fs");
const C = require("./common.js");

const children = [];

children.push(new Paragraph({ spacing: { before: 300, after: 100 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "标书快反 BidPilot", bold: true, size: 52, color: C.PAL.primary, font: { eastAsia: "SimHei", ascii: "Arial" } })] }));
children.push(new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "工程机械投标文件 AI 智能体 · 产品简介（公开版）", size: 26, color: C.MUTED })] }));
children.push(new Paragraph({ spacing: { after: 260 }, alignment: AlignmentType.CENTER,
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.PAL.accent, space: 6 } },
  children: [new TextRun({ text: "在线体验：https://azzb66223944qq.github.io/bidpilot/", size: 21, color: C.PAL.primary })] }));

children.push(C.h1("一、产品是什么"));
children.push(C.body("标书快反是一款面向工程机械经销商的投标文件 AI 智能体。用户粘贴本公司资料库与招标公告原文，约十秒生成投标所需的四份核心成果：资格自查表、技术偏离表、废标风险TOP5清单、投标就绪度评分报告，并给出是否建议投标及前提条件清单，把传统流程中两到三天的标书自查工作压缩到数秒。"));

children.push(C.h1("二、四大核心输出"));
children.push(C.bullet("资格自查：", "对照招标资格要求逐条自查，标注有据与待人工核实，自动列出门槛类待办事项；"));
children.push(C.bullet("技术偏离表：", "对设备技术参数逐条响应，给出满足、正偏离、负偏离等明确结论；"));
children.push(C.bullet("废标风险TOP5：", "以业务员视角提示解密时限、保证金、授权用印等高发废标风险；"));
children.push(C.bullet("结论与评分：", "零到一百的就绪度评分与等级建议，评价口径可按行业配置并随报告输出。"));

children.push(C.h1("三、核心能力"));
children.push(C.bullet("反幻觉设计：", "只引用用户提供的资料与公告原文，缺失信息一律标注待人工核实，绝不编造参数、业绩与资质；"));
children.push(C.bullet("结论可回溯：", "每一项判定均可对应到公告原文片段，支持逐条审计；"));
children.push(C.bullet("关键条款风控：", "自动识别招标文件中的关键参数与重要条款分级，规避高发废标风险；"));
children.push(C.bullet("品类覆盖：", "参数库覆盖装载机、挖掘机、起重机、泵车、压路机、环卫车辆、叉车、旋挖钻机等七大机型族，支持单位自动换算；"));
children.push(C.bullet("公告变更检测：", "对澄清补遗前后的两版公告自动比对，按风险分级提示变化点与处置建议；"));
children.push(C.bullet("对比选型：", "两台设备同标段对比分析，输出选型建议；"));
children.push(C.bullet("双引擎架构：", "规则引擎离线可用、结论可回溯；可选接入大模型处理开放式问答。"));

children.push(C.h1("四、获取与体验"));
children.push(C.bullet("在线体验：", "https://azzb66223944qq.github.io/bidpilot/（手机与电脑浏览器均可打开，支持安装为应用）"));
children.push(C.bullet("适用对象：", "工程机械经销商投标团队、设备销售经理、投标咨询机构"));
children.push(C.bullet("联系方式：", "本页面所留群内同学，或通过书院转介"));

children.push(C.h1("五、声明"));
children.push(C.body("本简介为公开交流版本。产品内置演示数据均为虚构，仅用于功能演示；AI辅助分析结果不能替代人工复核，正式投标前必须逐条核对招标文件原文。"));
children.push(new Paragraph({ spacing: { before: 200, after: 80 },
  border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.PAL.table.innerLine, space: 6 } },
  children: [new TextRun({ text: "版权声明：本文档版权归标书快反团队所有，仅供交流评估使用，未经书面许可请勿转发至公开渠道或用于商业用途。", size: 20, color: C.MUTED, italics: true })] }));

const doc = new Document({
  creator: "标书快反团队",
  title: "标书快反产品简介（公开版）",
  styles: { default: { document: {
    run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: C.BODY },
    paragraph: { spacing: { line: 312 } },
  }}},
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1600, right: 1500 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "标书快反 BidPilot · 公开版简介", size: 16, color: C.MUTED })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "仅供交流评估 · 请勿外传 · 版权归标书快反团队所有", size: 16, color: C.MUTED })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("docs/产品简介-标书快反-公开版.docx", buf);
  console.log("done: docs/产品简介-标书快反-公开版.docx");
});
