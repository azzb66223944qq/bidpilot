/* ============================================================
 * 标书快反 (BidPilot) · 核心解析引擎 v1.1
 * 纯函数模块：浏览器与 Node 均可运行（无 DOM 依赖）
 * 设计原则（反幻觉铁律）：
 *   1. 只允许使用【资料库】与【招标公告】两份输入中的信息；
 *   2. 任一方缺失的信息，一律输出待核实占位符，严禁编造；
 *   3. 所有结论可回溯到命中的原文片段（raw 字段）。
 * v1.1 新增：6类扩展参数（挖掘深度/卸载高度/爬坡/掘起力/行走速度/动臂时间）、
 *            单位自动换算（mm↔m、马力↔kW）、单位口径冲突检测、
 *            投标就绪度评分、双演示场景（装载机/挖掘机）、半年质保识别
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.BidEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MISSING_LIB = '该信息不在本公司资料库中，请核实后补充';
  var CN = ['零', '一', '二', '三', '四', '五', '六'];

  /* ---------- 演示数据（虚构，仅用于产品演示） ---------- */

  var DEMO_LIBRARY = [
    '【本公司资料库 · 浙东机械经销有限公司】（演示用虚构数据）',
    '公司身份：中国境内依法注册的独立法人，代理某国产品牌 5t 级轮式装载机（代理商）。',
    '制造商授权书：在手（是否已按标书要求加盖投标人公章，请人工复核）。',
    '体系认证：持有 ISO9001 质量管理体系认证（证书编号与有效期请人工核实）。',
    '同类业绩：2024 年向某市政国企交付同型号装载机 2 台，已正常验收（合同复印件与验收单是否在档，请人工核实）。',
    '设备官方参数表：额定载重量 5000kg；标准斗容 3.0m³；额定功率 162kW；整机工作质量 17.5t；',
    '最大卸载高度 3.1m；最大掘起力 175kN；发动机排放：满足国四；交货期：≤30天；质保：1年或2000小时；',
    '售后：含原厂售后承诺（服务方案正文请人工补充）。',
    '缺失项提示：营业执照副本、法定代表人身份证明、CA数字证书、投标保证金缴纳记录 —— 以上不在资料库中，请核实后补充。'
  ].join('\n');

  var DEMO_TENDER = [
    '【招标公告 · 宁波市水务环境集团轮式装载机采购项目】（演示用虚构数据，依据真实公告改写）',
    '招标人：宁波市水务环境集团股份有限公司（自筹资金100%）；代理机构：宁波市国际招标有限公司。',
    '标段：轮式装载机 5t 级，1 个标段；本项目为非依法必招项目，资格后审，不接受联合体投标。',
    '总价最高限价：34.025 万元。',
    '时间安排：报名/下载标书 2026年9月28日9:00 至 2026年10月9日23:59；投标保证金 6800 元须于 2026年10月12日15:00 前由投标人基本账户一次性汇入平台虚拟子账号；投标截止/开标 2026年10月13日09:30。',
    '开标后 60 分钟内须完成投标文件在线解密，逾期未解密的投标文件按无效投标处理。',
    '投标人资格要求：中国境内依法注册、具有独立法人资格的制造商或授权代理商；代理商投标必须附制造商授权书并加盖投标人公章。',
    '（标注★的为关键参数，不满足即否决投标）',
    '第四章 招标要求（设备主要技术参数）：额定载重量 ≥5000kg；★标准斗容 ≥2.7m³；额定功率 ≥160kW；',
    '整机工作质量 ≤18t；最大卸载高度 ≥2900mm；最大掘起力 ≥170kN；发动机排放：满足非道路移动机械国四排放；',
    '交货期：不超过 30 天；质保期：不低于 1 年；售后服务：须提供原厂售后服务承诺。',
    '投标人须提供设备型式试验报告及环保信息公开编号作为证明材料。',
    '（演示提示：正式投标时请以招标文件第四章原文逐条复核。）'
  ].join('\n');

  var DEMO2_LIBRARY = [
    '【本公司资料库 · 北岭工程设备有限公司】（演示用虚构数据）',
    '公司身份：中国境内依法注册的独立法人，代理某国产品牌 20t 级液压挖掘机（代理商）。',
    '制造商授权书：在手（用印情况请人工复核）。',
    '体系认证：持有 ISO9001 与 ISO14001 认证（证书编号与有效期请人工核实）。',
    '同类业绩：2023 年向某高速公路施工项目交付同型号挖掘机 3 台，已正常验收（合同与验收单是否在档，请人工核实）。',
    '设备官方参数表：整机工作质量 20.5t；标准斗容 1.0m³；额定功率 129kW；最大挖掘深度 6.58m；',
    '最大卸载高度 6.35m；爬坡能力 65%；最大掘起力 178kN；发动机排放：满足国四；',
    '交货期：≤25天；质保：1年或2000小时；售后：含原厂售后承诺（服务方案正文请人工补充）。',
    '缺失项提示：营业执照副本、CA数字证书、投标保证金缴纳记录 —— 以上不在资料库中，请核实后补充。'
  ].join('\n');

  var DEMO2_TENDER = [
    '【招标公告 · 某交通建设集团液压挖掘机采购项目】（演示用虚构数据）',
    '招标人：某交通建设集团有限公司；资金来源：企业自筹；资格后审；不接受联合体投标。',
    '标段：20t 级液压挖掘机 2 台；总价最高限价：88.6 万元。',
    '时间安排：投标截止/开标 2026年10月16日10:00；投标保证金 17000 元须于 2026年10月15日16:00 前到账。',
    '开标后 45 分钟内须完成在线解密，逾期按无效投标处理。',
    '投标人资格要求：独立法人制造商或授权代理商；代理商须附制造商授权书并加盖投标人公章。',
    '（标注★的为关键参数，不满足即否决投标）',
    '第四章 招标要求（设备主要技术参数）：整机工作质量 20~22t；标准斗容 ≥0.9m³；额定功率 ≥125kW；',
    '最大挖掘深度 ≥6500mm；最大卸载高度 ≥6.2m；★爬坡能力 ≥70%；最大掘起力 ≥170kN；',
    '发动机排放：满足国四；交货期：不超过 40 天；质保期：不低于 1 年；售后服务：须提供原厂售后服务方案。',
    '投标人须提供设备型式试验报告及环保信息公开编号作为证明材料。'
  ].join('\n');

  var DEMO3_LIBRARY = [
    '【本公司资料库 · 北方吊装设备有限公司】（演示用虚构数据）',
    '公司身份：中国境内依法注册的独立法人，代理某国产品牌 25t 级汽车起重机（代理商）。',
    '制造商授权书：在手（用印情况请人工复核）。',
    '体系认证：持有 ISO9001 认证（证书编号与有效期请人工核实）。',
    '同类业绩：2023 年向某电力建设工程交付同型号起重机 1 台，已正常验收（合同与验收单是否在档，请人工核实）。',
    '设备官方参数表：最大额定起重量 25t；额定起重力矩 1050kN·m；整机工作质量 32.5t；额定功率 258kW；',
    '发动机排放：满足国四；交货期：≤40天；质保：2年或2400小时；售后：含原厂售后承诺（服务方案正文请人工补充）。',
    '缺失项提示：营业执照副本、CA数字证书、投标保证金缴纳记录 —— 以上不在资料库中，请核实后补充。'
  ].join('\n');

  var DEMO3_TENDER = [
    '【招标公告 · 某电力建设集团汽车起重机采购项目】（演示用虚构数据）',
    '招标人：某电力建设集团有限公司；资金来源：企业自筹；资格后审；不接受联合体投标。',
    '标段：25t 级汽车起重机 1 台；总价最高限价：96.8 万元。',
    '时间安排：投标截止/开标 2026年10月20日09:30；投标保证金 20000 元须于 2026年10月19日17:00 前到账。',
    '开标后 30 分钟内须完成在线解密，逾期按无效投标处理。',
    '投标人资格要求：独立法人制造商或授权代理商；代理商须附制造商授权书并加盖投标人公章。',
    '第四章 招标要求（设备主要技术参数）：最大额定起重量 ≥25t；额定起重力矩 ≥1000kN·m；整机工作质量 ≤34t；',
    '额定功率 ≥250kW；发动机排放：满足国四；交货期：不超过 45 天；质保期：不低于 1 年；',
    '售后服务：须提供原厂售后服务承诺。投标人须提供设备型式试验报告及环保信息公开编号作为证明材料。'
  ].join('\n');

  var DEMO4_LIBRARY = [
    '【本公司资料库 · 南方混凝土设备有限公司】（演示用虚构数据）',
    '公司身份：中国境内依法注册的独立法人，代理某国产品牌 37m 臂架式混凝土泵车（代理商）。',
    '制造商授权书：在手（用印情况请人工复核）。',
    '体系认证：持有 ISO9001 认证（证书编号与有效期请人工核实）。',
    '同类业绩：2024 年向某商品混凝土公司交付同型号泵车 1 台，已正常验收（合同与验收单是否在档，请人工核实）。',
    '设备官方参数表：理论泵送方量 110m³/h；臂架高度 37m；整机工作质量 35t；额定功率 294kW；',
    '发动机排放：满足国四；交货期：≤55天；质保：1年或2000小时；售后：含原厂售后承诺（服务方案正文请人工补充）。',
    '缺失项提示：营业执照副本、CA数字证书、投标保证金缴纳记录 —— 以上不在资料库中，请核实后补充。'
  ].join('\n');

  var DEMO4_TENDER = [
    '【招标公告 · 某建筑工程集团混凝土泵车采购项目】（演示用虚构数据）',
    '招标人：某建筑工程集团有限公司；资金来源：企业自筹；资格后审；不接受联合体投标。',
    '标段：37m 臂架式混凝土泵车 1 台；总价最高限价：128 万元。',
    '时间安排：投标截止/开标 2026年10月25日14:00；投标保证金 25000 元须于 2026年10月24日16:00 前到账。',
    '开标后 60 分钟内须完成在线解密，逾期按无效投标处理。',
    '投标人资格要求：独立法人制造商或授权代理商；代理商须附制造商授权书并加盖投标人公章。',
    '第四章 招标要求（设备主要技术参数）：理论泵送方量 ≥120m³/h；臂架高度 ≥35m；整机工作质量 ≤36t；',
    '额定功率 ≥300kW；发动机排放：满足国四；交货期：不超过 60 天；质保期：不低于 1 年；',
    '售后服务：须提供原厂售后服务方案。投标人须提供设备型式试验报告及环保信息公开编号作为证明材料。'
  ].join('\n');

  var DEMO5_LIBRARY = [
    '【本公司资料库 · 北疆路桥设备有限公司】（演示用虚构数据）',
    '公司身份：中国境内依法注册的独立法人，代理某国产品牌单钢轮振动压路机（代理商）。',
    '制造商授权书：在手（用印情况请人工复核）。',
    '体系认证：持有 ISO9001 认证（证书编号与有效期请人工核实）。',
    '同类业绩：2024 年向某市政工程处交付同型号压路机 2 台，已正常验收（合同与验收单是否在档，请人工核实）。',
    '设备官方参数表：工作质量 14t；激振力 350kN；振动频率 30Hz；压实宽度 2.2m；额定功率 110kW；',
    '发动机排放：满足国四；交货期：≤25天；质保：2年或2000小时；售后：含原厂售后承诺（服务方案正文请人工补充）。',
    '缺失项提示：营业执照副本、CA数字证书、投标保证金缴纳记录 —— 以上不在资料库中，请核实后补充。'
  ].join('\n');

  var DEMO5_TENDER = [
    '【招标公告 · 某市政建设集团振动压路机采购项目】（演示用虚构数据）',
    '招标人：某市政建设集团有限公司；资金来源：企业自筹；资格后审；不接受联合体投标。',
    '标段：单钢轮振动压路机 1 台；总价最高限价：38.6 万元。',
    '时间安排：投标截止/开标 2026年10月18日09:30；投标保证金 8000 元须于 2026年10月17日16:00 前到账。',
    '开标后 30 分钟内须完成在线解密，逾期按无效投标处理。',
    '投标人资格要求：独立法人制造商或授权代理商；代理商须附制造商授权书并加盖投标人公章。',
    '第四章 招标要求（设备主要技术参数）：工作质量 13~16t；激振力 ≥320kN；振动频率 ≥28Hz；压实宽度 ≥2100mm；',
    '额定功率 ≥100kW；发动机排放：满足国四；交货期：不超过 30 天；质保期：不低于 1 年；',
    '售后服务：须提供原厂售后服务承诺。投标人须提供设备型式试验报告及环保信息公开编号作为证明材料。'
  ].join('\n');

  var DEMO6_LIBRARY = [
    '【本公司资料库 · 绿源环卫设备有限公司】（演示用虚构数据）',
    '公司身份：中国境内依法注册的独立法人，代理某国产品牌绿化洒水车（代理商）。',
    '制造商授权书：在手（用印情况请人工复核）。',
    '体系认证：持有 ISO9001 认证（证书编号与有效期请人工核实）。',
    '同类业绩：2025 年向某区环卫所交付同型号洒水车 3 台，已正常验收（合同与验收单是否在档，请人工核实）。',
    '设备官方参数表：罐体容积 12m³；额定功率 118kW；发动机排放：满足国四；交货期：≤20天；质保：1年；',
    '售后：含原厂售后承诺（服务方案正文请人工补充）。',
    '缺失项提示：营业执照副本、CA数字证书、投标保证金缴纳记录 —— 以上不在资料库中，请核实后补充。'
  ].join('\n');

  var DEMO6_TENDER = [
    '【招标公告 · 某县城管局绿化洒水车采购项目】（演示用虚构数据）',
    '招标人：某县住房和城乡建设局；资金来源：财政资金；资格后审；不接受联合体投标。',
    '标段：绿化洒水车 2 台；采购预算：59.6 万元；最高限价（元）：590000。',
    '时间安排：投标截止/开标 2026年10月22日10:00；投标保证金 12000 元须于 2026年10月21日16:00 前到账。',
    '开标后 60 分钟内须完成在线解密，逾期按无效投标处理。',
    '投标人资格要求：独立法人制造商或授权代理商；代理商须附制造商授权书并加盖投标人公章。',
    '第四章 招标要求（设备主要技术参数）：★罐体容积 ≥13m³；额定功率 ≥115kW；发动机排放：满足国四；',
    '交货期：不超过 30 天；质保期：不低于 1 年；售后服务：须提供原厂售后服务承诺。',
    '投标人须提供设备型式试验报告及环保信息公开编号作为证明材料。'
  ].join('\n');

  var DEMOS = {
    loader:    { key: 'loader',    name: '🚜 演示一：装载机（浙东机械）', lib: DEMO_LIBRARY, tender: DEMO_TENDER },
    excavator: { key: 'excavator', name: '⛏ 演示二：挖掘机（北岭设备）',  lib: DEMO2_LIBRARY, tender: DEMO2_TENDER },
    crane:     { key: 'crane',     name: '🏗 演示三：起重机（北方吊装）', lib: DEMO3_LIBRARY, tender: DEMO3_TENDER },
    pump:      { key: 'pump',      name: '🚧 演示四：泵车（南方混凝土）', lib: DEMO4_LIBRARY, tender: DEMO4_TENDER },
    roller:    { key: 'roller',    name: '🛣 演示五：压路机（北疆路桥）', lib: DEMO5_LIBRARY, tender: DEMO5_TENDER },
    sprinkler: { key: 'sprinkler', name: '🚿 演示六：洒水车（绿源环卫）', lib: DEMO6_LIBRARY, tender: DEMO6_TENDER }
  };

  /* 公告对比演示：旧版（澄清/补遗前）vs 新版（即 DEMO_TENDER） */
  var DEMO_DIFF_OLD = [
    '【招标公告 · 宁波市水务环境集团轮式装载机采购项目（原发布版）】（演示用虚构数据）',
    '招标人：宁波市水务环境集团股份有限公司（自筹资金100%）；代理机构：宁波市国际招标有限公司。',
    '标段：轮式装载机 5t 级，1 个标段；本项目为非依法必招项目，资格后审，不接受联合体投标。',
    '总价最高限价：35.8 万元。',
    '时间安排：报名/下载标书 2026年9月28日9:00 至 2026年10月9日23:59；投标保证金 7000 元须于 2026年10月12日15:00 前由投标人基本账户一次性汇入平台虚拟子账号；投标截止/开标 2026年10月15日09:30。',
    '开标后 60 分钟内须完成投标文件在线解密，逾期未解密的投标文件按无效投标处理。',
    '投标人资格要求：中国境内依法注册、具有独立法人资格的制造商或授权代理商；代理商投标必须附制造商授权书并加盖投标人公章。',
    '第四章 招标要求（设备主要技术参数）：额定载重量 ≥5000kg；标准斗容 ≥2.5m³；额定功率 ≥160kW；',
    '整机工作质量 ≤18t；最大卸载高度 ≥2900mm；最大掘起力 ≥170kN；发动机排放：满足非道路移动机械国四排放；',
    '交货期：不超过 30 天；质保期：不低于 1 年；售后服务：须提供原厂售后服务承诺。',
    '投标人须提供设备型式试验报告作为证明材料。',
    '（演示提示：本版本为对比演示用的"澄清/补遗前"旧版公告。）'
  ].join('\n');

  /* ---------- 智能体系统提示词（内置引擎与 Coze/GLM 共用） ---------- */
  var SYSTEM_PROMPT = [
    '你是"标书快反"，一家工程机械经销商的投标助手。严格遵守以下规则：',
    '1. 用户会提供两部分输入：【资料库】（公司资质、业绩、设备参数）和【招标公告/招标要求】。',
    '2. 你只允许使用资料库和招标公告原文中的信息作答。',
    '3. 凡是两边都没有的信息，必须原样输出"该信息不在本公司资料库中，请核实后补充"，',
    '   严禁编造任何品牌、机型、参数、业绩、资质、报告编号。',
    '4. 输出固定四部分：',
    '   ①【资格自查】逐条列出：能投/缺什么/需人工核实项；',
    '   ②【技术偏离表】逐条响应招标参数，标注"满足/正偏离/负偏离/资料库无/待人工补充"；',
    '   ③【废标风险TOP5】用业务员能听懂的白话写，重点覆盖：解密时限、同网络串标、保证金、授权书用印、限价与截止时间；',
    '   ④【结论与建议】一句话给出是否建议投标及前提条件。',
    '5. 所有表格用 Markdown 表格输出；最后注明"以上为AI辅助分析，投标前必须人工逐条复核"。'
  ].join('\n');

  /* ================= 工具函数 ================= */

  function cnToNum(ch) {
    var i = CN.indexOf(ch);
    return i > 0 ? i : null;
  }

  /*
   * 通用数值提取：在 text 中找 "关键词…(前缀)数值(范围数值)单位"
   * 返回 { value, min, max, prefix, raw, unit } 或 null
   * prefix: 'min'(≥) | 'max'(≤) | 'range'(x~y) | 'none'
   */
  function extractNum(text, kwRe, unitRe, defaultMode) {
    var re = new RegExp(
      '(' + kwRe.source + ')' +                    // 1 关键词
      '([^0-9\\n]{0,10}?)' +                       // 2 间隙
      '(\\d+(?:\\.\\d+)?)' +                       // 3 数值1
      '(?:\\s*[~～—]\\s*(\\d+(?:\\.\\d+)?))?' +    // 4 数值2（范围）
      '\\s*(' + unitRe.source + ')',               // 5 单位
      'i'
    );
    var m = text.match(re);
    if (!m) return null;
    var v1 = parseFloat(m[3]);
    var v2 = m[4] !== undefined ? parseFloat(m[4]) : null;
    var gap = m[2];
    var prefix = 'none';
    if (v2 !== null) prefix = 'range';
    else if (/≤|<=|不超过|不高于|小于等于/.test(gap)) prefix = 'max';
    else if (/≥|>=|大于等于|不低于|不少于/.test(gap)) prefix = 'min';
    else if (defaultMode === 'max') prefix = 'max';
    else if (defaultMode === 'min') prefix = 'min';
    return { value: v1, min: v1, max: v2, prefix: prefix, raw: m[0], unit: m[5], gap: gap, idx: m.index };
  }

  /* ★归属判定：★只属于其所在"参数段"（以行内 ；;。 分隔），而非整行 */
  function markForParam(text, idx) {
    if (idx == null) return null;
    var ls = text.lastIndexOf('\n', idx);
    var le = text.indexOf('\n', idx); if (le < 0) le = text.length;
    var line = text.slice(ls + 1, le);
    var pos = idx - (ls + 1);
    var segStart = 0, m; var seps = /[；;。]/g;
    while ((m = seps.exec(line))) { if (m.index < pos) segStart = m.index + 1; else break; }
    var segEnd = line.length;
    ['；', ';', '。'].forEach(function (sep) { var v = line.indexOf(sep, pos); if (v >= 0 && v < segEnd) segEnd = v; });
    var seg = line.slice(segStart, segEnd);
    if (seg.indexOf('★') >= 0) return '★';
    if (seg.indexOf('▲') >= 0) return '▲';
    return null;
  }

  function starForParam(text, idx) {
    if (idx == null) return false;
    var ls = text.lastIndexOf('\n', idx);
    var le = text.indexOf('\n', idx);
    if (le < 0) le = text.length;
    var line = text.slice(ls + 1, le);
    var pos = idx - (ls + 1);
    var segStart = 0, m;
    var seps = /[；;。]/g;
    while ((m = seps.exec(line))) { if (m.index < pos) segStart = m.index + 1; else break; }
    var segEnd = line.length;
    ['；', ';', '。'].forEach(function (sep) {
      var v = line.indexOf(sep, pos);
      if (v >= 0 && v < segEnd) segEnd = v;
    });
    return line.slice(segStart, segEnd).indexOf('★') >= 0;
  }

  /* 单位口径归类：同类可比较，异类标"待人工核对" */
  function unitClass(def, u) {
    u = (u || '').toLowerCase();
    switch (def.id) {
      case 'ride':   return /%/.test(u) ? 'pct' : (/°|度/.test(u) ? 'deg' : '?');
      case 'force':
      case 'vibForce': return /kn|千牛/.test(u) ? 'kn' : (/吨/.test(u) ? 'tf' : '?');
      case 'groundPress': return /mpa/.test(u) ? 'mpa' : (/kpa|千帕/.test(u) ? 'kpa' : '?');
      case 'speed':  return /km|公里/.test(u) ? 'kmh' : '?';
      case 'lift':   return /秒|^s$/.test(u) ? 'sec' : '?';
      case 'digDepth':
      case 'dumpHeight': return /mm|毫米/.test(u) ? 'mm' : (/m|米/.test(u) ? 'm' : '?');
      case 'power':  return /kw|千瓦/.test(u) ? 'kw' : (/马力/.test(u) ? 'hp' : '?');
      default: return 'std';
    }
  }

  /* 按参数定义归一化到标准单位 */
  function normalizeValue(def, v, unit) {
    var u = (unit || '').toLowerCase();
    switch (def.id) {
      case 'load':       return /吨/.test(u) || (/^t$|^t\b/.test(u) && !/kg/.test(u)) ? v * 1000 : v;   // → kg
      case 'mass':       return /kg/.test(u) ? v / 1000 : v;                                            // → t
      case 'power':      return /马力/.test(u) ? Math.round(v * 0.7355 * 10) / 10 : v;                  // → kW
      case 'digDepth':
      case 'dumpHeight':
      case 'compWidth':
      case 'paveWidth':
      case 'millWidth':
      case 'millDepth':
      case 'liftHeight':
      case 'drillDia':
      case 'drillDepth2':
      case 'workHeight': return /mm|毫米/.test(u) ? v / 1000 : v;                               // → m
      case 'tankVolume':
      case 'compVolume': return (/l|升/.test(u) && !/m³|m3|立方/.test(u)) ? v / 1000 : v; // → m³
      default:           return v;
    }
  }

  /* 比较判定：返回 '满足' | '正偏离' | '负偏离' */
  function compare(libVal, req, defMode) {
    var mode = req.prefix === 'min' ? 'min' : req.prefix === 'max' ? 'max' : defMode;
    if (req.prefix === 'range' && req.max !== null) {
      return (libVal >= req.min && libVal <= req.max) ? '满足' : '负偏离';
    }
    if (mode === 'min') {
      if (libVal >= req.value) return libVal > req.value ? '正偏离' : '满足';
      return '负偏离';
    }
    if (mode === 'max') {
      // 上限型要求（如"整机质量 ≤18t"）：低于上限即为合规，不标正偏离
      return libVal <= req.value ? '满足' : '负偏离';
    }
    // approx（默认 ±20% 容差）
    return Math.abs(libVal - req.value) <= Math.abs(req.value) * 0.2 ? '满足' : '负偏离';
  }

  /* ================= 技术参数定义 ================= */
  var PARAM_DEFS = [
    { id: 'load', name: '额定载重量', kw: /额定载重[量]?/, unit: /kg|千克|吨|t(?![a-z])/i, mode: 'min' },
    { id: 'bucket', name: '标准斗容', kw: /斗容|铲斗容量/, unit: /m³|m3|立方米/, mode: 'min' },
    { id: 'power', name: '额定功率', kw: /额定功率|发动机功率/, unit: /kW|千瓦|马力/i, mode: 'min' },
    { id: 'mass', name: '整机工作质量', kw: /整机工作质量|整机质量|操作质量|工作质量/, unit: /吨|t(?![a-z])|kg/i, mode: 'approx' },
    { id: 'digDepth', name: '最大挖掘深度', kw: /挖掘深度|挖深/, unit: /mm|毫米|m(?![a-z])|米/i, mode: 'min' },
    { id: 'dumpHeight', name: '最大卸载高度', kw: /卸载高度|卸料高度/, unit: /mm|毫米|m(?![a-z])|米/i, mode: 'min' },
    { id: 'ride', name: '爬坡能力', kw: /爬坡/, unit: /%|°|度/, mode: 'min', unitStrict: true },
    { id: 'force', name: '最大掘起力', kw: /掘起力|铲掘力|掘削力/, unit: /kN|千牛|吨/i, mode: 'min', unitStrict: true },
    { id: 'speed', name: '行走速度', kw: /行走速度/, unit: /km\/h|公里\/小时/i, mode: 'min', unitStrict: true },
    { id: 'lift', name: '动臂提升时间', kw: /动臂提升时间|提升时间/, unit: /s(?![a-z])|秒/i, mode: 'max', unitStrict: true },
    { id: 'liftCap', name: '最大额定起重量', kw: /额定起重量|最大起重量|起重量/, unit: /吨|t(?![a-z])/i, mode: 'min' },
    { id: 'moment', name: '额定起重力矩', kw: /起重力矩/, unit: /kN\s*[·•]?\s*m|千牛米/i, mode: 'min' },
    { id: 'pumpRate', name: '理论泵送方量', kw: /泵送方量|泵送量|泵送能力/, unit: /m³\/h|m3\/h|立方米\/小时/i, mode: 'min' },
    { id: 'boomHeight', name: '臂架高度', kw: /臂架高度|臂架长度|布料高度/, unit: /m(?![a-z])|米/i, mode: 'min' },
    /* —— 品类扩展（v1.7 · 依据ccgp真实公告样本研究）—— */
    { id: 'vibForce', name: '激振力', kw: /激振力/, unit: /kN|千牛|吨/i, mode: 'min', unitStrict: true },
    { id: 'vibFreq', name: '振动频率', kw: /振动频率|激振频率/, unit: /Hz|赫兹/i, mode: 'approx' },
    { id: 'compWidth', name: '压实宽度', kw: /压实宽度|碾压宽度/, unit: /mm|毫米|m(?![a-z])|米/i, mode: 'min' },
    { id: 'paveWidth', name: '摊铺宽度', kw: /摊铺宽度/, unit: /mm|毫米|m(?![a-z])|米/i, mode: 'min' },
    { id: 'millWidth', name: '铣创宽度', kw: /铣创宽度/, unit: /mm|毫米|m(?![a-z])|米/i, mode: 'min' },
    { id: 'millDepth', name: '铣创深度', kw: /铣创深度/, unit: /mm|毫米|m(?![a-z])|米/i, mode: 'min' },
    { id: 'tankVolume', name: '罐体容积', kw: /罐体容积|水罐容积|罐容积/, unit: /m³|m3|立方米|L|升/i, mode: 'min' },
    { id: 'compVolume', name: '压缩容积', kw: /压缩容积|填装容积/, unit: /m³|m3|立方米|L|升/i, mode: 'min' },
    { id: 'bladeCap', name: '铲刀容量', kw: /铲刀容量|推土铲容量/, unit: /m³|m3|立方米/i, mode: 'min' },
    { id: 'groundPress', name: '接地比压', kw: /接地比压/, unit: /kPa|千帕|MPa/i, mode: 'max', unitStrict: true },
    { id: 'liftHeight', name: '起升高度', kw: /起升高度|提升高度/, unit: /m(?![a-z])|米|mm|毫米/i, mode: 'min' },
    { id: 'ratedLoad', name: '额定载荷', kw: /额定载荷/, unit: /kg|千克|吨|t(?![a-z])/i, mode: 'min' },
    { id: 'drillDia', name: '最大钻孔直径', kw: /钻孔直径|成孔直径/, unit: /mm|毫米|m(?![a-z])|米/i, mode: 'min' },
    { id: 'drillDepth2', name: '最大钻孔深度', kw: /钻孔深度|成孔深度/, unit: /m(?![a-z])|米|mm|毫米/i, mode: 'min' },
    { id: 'outputTorque', name: '额定输出扭矩', kw: /输出扭矩|额定扭矩/, unit: /kN\s*[·•]?\s*m|千牛米/i, mode: 'min', unitStrict: true },
    { id: 'workHeight', name: '作业高度', kw: /作业高度|平台高度/, unit: /m(?![a-z])|米|mm|毫米/i, mode: 'min' },
    { id: 'delivery', name: '交货期', kw: /交货期|供货期|履行期限|履约期限|签订之日/, unit: /天|日/, mode: 'max' },
    { id: 'warranty', name: '质保期', kw: /质保期?|保修期?/, unit: /年/, mode: 'min' }
  ];

  function parseEmission(text) {
    var m = text.match(/国\s*([一二三四五六])|([一二三四五六])\s*阶段/);
    if (!m) return null;
    return cnToNum(m[1] || m[2]);
  }

  function stageName(n) { return '国' + CN[n]; }

  /* ================= 主流程 ================= */

  function analyze(libText, tenderText, opts) {
    libText = (libText || '').trim();
    tenderText = (tenderText || '').trim();
    if (!libText || !tenderText) return { error: '资料库与招标公告均不能为空。' };

    var meta = extractMeta(tenderText);
    var aliases = opts && opts.aliases;
    var params = analyzeParams(libText, tenderText, aliases);
    var quals = analyzeQuals(libText, tenderText, meta);
    var risks = buildRisks(meta, libText);
    var conclusion = buildConclusion(params, meta, opts && opts.weights);
    var timeline = buildTimeline(meta);

    return { meta: meta, params: params, quals: quals, risks: risks, conclusion: conclusion, timeline: timeline, highlights: params.highlights || [], generatedAt: new Date() };
  }

  /* ---------- 投标行动时间表（倒排） ---------- */
  function parseCnDate(s) {
    var m = (s || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s?(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  }
  function buildTimeline(meta) {
    var now = new Date();
    function days(d) { return d ? Math.ceil((d - now) / 86400000) : null; }
    var items = [];
    if (meta.enrollDeadline) items.push({ when: meta.enrollDeadline, at: parseCnDate(meta.enrollDeadline), what: '报名/下载标书截止（新账号办CA需2-5个工作日，倒排安排）' });
    if (meta.depositDeadline) items.push({ when: meta.depositDeadline, at: parseCnDate(meta.depositDeadline), what: '保证金到账截止（基本账户一次性汇入，别卡点）' });
    if (meta.bidDeadline) items.push({ when: meta.bidDeadline, at: parseCnDate(meta.bidDeadline), what: '投标截止/开标（提前一天完整演练在线解密）' });
    items.sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
    items.forEach(function (it) { it.daysLeft = days(it.at); });
    return { items: items, daysToBid: meta.bidDeadline ? days(parseCnDate(meta.bidDeadline)) : null };
  }

  /* ---------- 招标元信息 ---------- */
  function extractMeta(t) {
    var meta = { priceLimit: null, priceLimitText: null, deposit: null, decryptMin: null,
                 enrollDeadline: null, bidDeadline: null, consortium: false, postQual: false };

    /* 兼容两种真实写法：①"最高限价：35.8万元"（数字在前单位在后） ②"最高限价（元）：3783217.78"（单位在括号内） */
    var mPrice = t.match(/(最高限价|最高投标限价|总价最高限价|上限价)[^\d\n]{0,10}?([\d,，]+(?:\.\d+)?)(?:\s*(万元|万|元))?/);
    if (mPrice) {
      var pv = parseFloat(mPrice[2].replace(/[,，]/g, ''));
      meta.priceLimit = mPrice[3] === '万元' || mPrice[3] === '万' ? Math.round(pv * 10000) : Math.round(pv);
      meta.priceLimitText = mPrice[0];
    }
    /* 采购预算≠最高限价：预算是采购人的计划金额，报价仍须以明确限价为准（真实公告常见只有预算） */
    var mBudget = t.match(/(采购预算|项目预算|预算金额|总预算|预算)[^\d\n]{0,10}?([\d,，]+(?:\.\d+)?)(?:\s*(万元|万|元))?/);
    if (mBudget) {
      var bv = parseFloat(mBudget[2].replace(/[,，]/g, ''));
      meta.budget = mBudget[3] === '万元' || mBudget[3] === '万' ? Math.round(bv * 10000) : Math.round(bv);
    }
    var mDep = t.match(/(?:投标)?保证金[^\d\n]{0,12}([\d,，]+)\s*元/);
    if (mDep) meta.deposit = parseInt(mDep[1].replace(/[,，]/g, ''), 10);
    meta.depositDeadline = (t.match(/保证金[^。\n]{0,60}?(\d{4}年\d{1,2}月\d{1,2}日\s?\d{1,2}:\d{2})/) || [])[1] || null;

    var mDec = t.match(/(\d+)\s*分钟[^。\n；]{0,14}解密|解密[^。\d\n；]{0,8}(\d+)\s*分钟/);
    if (mDec) meta.decryptMin = parseInt(mDec[1] || mDec[2], 10);

    meta.enrollDeadline = (t.match(/(?:报名|下载标书)[^。\n]{0,80}?(\d{4}年\d{1,2}月\d{1,2}日\s?\d{1,2}:\d{2})/) || [])[1] || null;
    meta.bidDeadline = (t.match(/(?:投标截止|开标)[^。\n]{0,40}?(\d{4}年\d{1,2}月\d{1,2}日\s?\d{1,2}:\d{2})/) || [])[1] || null;
    meta.consortium = /不接受联合体/.test(t);
    meta.postQual = /资格后审/.test(t);
    return meta;
  }

  /* ---------- 技术偏离表 ---------- */
  function analyzeParams(libText, tenderText, aliases) {
    var rows = [];

    PARAM_DEFS.forEach(function (def) {
      var kw = kwWithAliases(def, aliases);
      var req = extractNum(tenderText, kw, def.unit, def.mode);
      var lib = extractNum(libText, kw, def.unit, def.mode);
      if (!req && !lib) return; // 双方都未提及该参数 → 不产生噪音行

      var row = { id: def.id, name: def.name, kind: 'param', conf: '高' };

      if (!req) {
        row.reqText = '原文未检索到该参数，请以招标文件第四章原文核对';
        row.respText = lib ? lib.raw + '（资料库）' : MISSING_LIB;
        row.status = '待人工核对';
        row.proof = lib ? '官方参数表（资料库）' : MISSING_LIB;
        rows.push(row);
        return;
      }
      row.reqText = req.raw;
      row.mark = markForParam(tenderText, req.idx);
      row.key = row.mark === '★';
      row.reqIdx = req.idx; row.reqLen = req.raw.length;

      if (!lib) {
        // 半年质保特殊识别（无数值可提取时）
        if (def.id === 'warranty' && /质保[^。\n]{0,8}半年|保修[^。\n]{0,8}半年/.test(libText)) {
          row.respText = '质保：半年（资料库）';
          var reqYears = req.prefix === 'range' ? req.min : req.value;
          var halfOk = req.prefix === 'max' || 0.5 >= reqYears;
          row.status = halfOk ? '满足' : '负偏离';
          row.note = halfOk ? null : '半年质保不满足"不低于' + reqYears + '年"的公告要求';
          row.proof = '官方参数表（资料库）';
          rows.push(row);
          return;
        }
        row.respText = MISSING_LIB;
        row.status = '资料库无';
        row.proof = MISSING_LIB;
        rows.push(row);
        return;
      }
      row.respText = lib.raw;

      /* 单位口径冲突检测（如爬坡 % 与 °、掘起力 kN 与 吨） */
      if (def.unitStrict && unitClass(def, lib.unit) !== unitClass(def, req.unit)) {
        row.status = '待人工核对'; row.conf = '中';
        row.note = '双方单位口径不同（' + lib.unit + ' 与 ' + req.unit + '），系统不做自动换算，请人工核对';
        row.proof = '官方参数表（资料库）';
        rows.push(row);
        return;
      }

      /* 双侧数值统一归一化到标准单位后再比对（mm→m、马力→kW、吨→kg 等） */
      var libVal = normalizeValue(def, lib.value, lib.unit);
      var reqN = {
        value: normalizeValue(def, req.value, req.unit),
        min: req.min, max: req.max, prefix: req.prefix
      };
      if (reqN.max !== null) reqN.max = normalizeValue(def, reqN.max, req.unit);
      var reqVal = reqN.prefix === 'range' ? reqN.max : reqN.value;
      var hitTerm = aliasHit(def, aliases, lib.raw);
      if (hitTerm) row.conf = '中';
      if (hitTerm && !row.note) row.note = '资料库以「' + hitTerm + '」表述，依自定义词库匹配为「' + def.name + '」';

      if (def.id === 'warranty') {
        row.status = libVal >= reqVal ? (libVal > reqVal ? '正偏离' : '满足') : '负偏离';
        var hrs = libText.match(/(\d+)\s*小时/);
        if (hrs && parseInt(hrs[1], 10) !== 2000) row.note = '小时口径与常见"2000小时"不同，请人工确认';
      } else {
        row.status = compare(libVal, reqN, def.mode);
        if (def.id === 'power' && /马力/.test(lib.unit)) row.note = '资料库以马力标注，已按 1马力=0.7355kW 换算';
        if ((def.id === 'digDepth' || def.id === 'dumpHeight') && /mm|毫米/.test(lib.unit) !== /mm|毫米/.test(req.unit)) row.note = '双方单位不同（m/mm），已自动换算为米比对';
      }
      row.proof = '官方参数表（资料库）';
      rows.push(row);
    });

    /* 排放阶段 */
    var reqStage = parseEmission(tenderText);
    var libStage = parseEmission(libText);
    var eRow = { id: 'emission', name: '发动机排放阶段', kind: 'param' };
    if (reqStage || libStage) {
      eRow.reqText = reqStage ? '满足' + stageName(reqStage) + '排放' : '原文未检索到，请以第四章原文核对';
      if (reqStage && libStage) {
        eRow.respText = '满足' + stageName(libStage) + '排放';
        eRow.status = libStage > reqStage ? '正偏离' : (libStage === reqStage ? '满足' : '负偏离');
        eRow.proof = '官方参数表（资料库）';
      } else if (libStage && !reqStage) {
        eRow.respText = '满足' + stageName(libStage) + '排放';
        eRow.status = '待人工核对';
        eRow.proof = '官方参数表（资料库）';
      } else {
        eRow.respText = MISSING_LIB;
        eRow.status = '资料库无';
        eRow.proof = MISSING_LIB;
      }
      rows.push(eRow);
    }

    /* 售后服务（文本类） */
    var libAfter = /售后/.test(libText);
    var reqAfter = /售后/.test(tenderText);
    if (libAfter || reqAfter) {
      rows.push({
        id: 'service', name: '原厂售后服务', kind: 'param',
        reqText: reqAfter ? '原文有售后服务要求' : '原文未检索到，请以第四章原文核对',
        respText: libAfter ? '资料库载明：含原厂售后承诺' : MISSING_LIB,
        status: libAfter ? '满足（框架性）' : '资料库无',
        proof: libAfter ? '服务承诺原文与服务方案正文：' + MISSING_LIB : MISSING_LIB
      });
    }

    /* 证明材料类：只认资料库中的"正向记载"，绝不编造 */
    ['型式试验报告', '质检报告', '环保信息公开编号'].forEach(function (item) {
      var reqIt = tenderText.indexOf(item) >= 0;
      var libIt = new RegExp(item + '[^。\\n]{0,8}(有|已|在档|编号[:：]\\s*\\S+)').test(libText);
      if (!reqIt && !libIt) return;
      rows.push({
        id: 'cert:' + item, name: '证明材料：' + item, kind: 'cert',
        reqText: reqIt ? '原文要求提供' : '原文未检索到（是否要求请核对第四章）',
        respText: libIt ? '资料库有记载' : MISSING_LIB,
        status: libIt ? '有记载' : '待人工补充',
        proof: MISSING_LIB
      });
    });

    /* 原文批注数据（v2.0）：按位置排序供批注视图渲染 */
    var highlights = [];
    rows.forEach(function (r) {
      if (r.reqIdx != null) highlights.push({ s: r.reqIdx, e: r.reqIdx + r.reqLen, mark: r.mark || null, status: r.status, name: r.name });
    });
    highlights.sort(function (a, b) { return a.s - b.s; });
    rows.highlights = highlights;
    return rows;
  }

  /* ---------- 资格自查 ---------- */
  function analyzeQuals(libText, tenderText, meta) {
    var rows = [];
    function row(req, basis, hit, okText, todoText) {
      rows.push({
        req: req, basis: basis,
        result: hit ? '有据' : '待人工核实',
        detail: hit ? okText : (todoText || MISSING_LIB)
      });
    }

    var hasBiz  = /营业执照|独立法人/.test(libText);
    var hasAuth = /授权书/.test(libText);
    var hasSeal = /公章/.test(libText);
    var hasIso  = /ISO\s?9001/i.test(libText);
    var hasIso14 = /ISO\s?14001/i.test(libText);
    var hasPerf = /交付|验收|业绩/.test(libText);

    row('独立法人资格', tenderText.indexOf('独立法人') >= 0 ? '原文要求独立法人' : '通行要求', hasBiz,
      '资料库载明具备独立法人身份。⚠️ 营业执照副本是否在库、经营范围是否覆盖，请人工核实',
      '营业执照副本是否在库？经营范围是否覆盖设备销售？');
    row('制造商授权书（代理商投标）', tenderText.indexOf('授权书') >= 0 ? '原文要求附授权书' : '通行要求', hasAuth,
      '授权书在手。⚠️ 请人工复核：① 是否已加盖投标人公章；② 授权型号与本标段机型是否一致',
      '代理商投标必须有制造商授权书，且按原文要求加盖投标人公章');
    row('投标人公章', hasAuth ? '配合授权书及投标文件用印' : '投标文件用印', hasSeal,
      '资料库载明公章在手，用印前请复核印文清晰、与授权书一致', '公章是否在库？');
    row('体系认证（常为评分项）', '非强制，常作加分项', hasIso || hasIso14,
      (hasIso ? '持ISO9001' : '') + (hasIso && hasIso14 ? '、' : '') + (hasIso14 ? '持ISO14001' : '') + '。⚠️ 证书编号与有效期请人工核实（过期证书=无效证明）');
    row('同类业绩', tenderText.match(/业绩|交付/) ? '原文或评分项涉及业绩' : '可能为评分项', hasPerf,
      '资料库载明有同型号交付验收业绩。⚠️ 合同复印件与验收单是否在档，请人工核实',
      '如需业绩证明，合同与验收单为必备支撑材料');
    row('联合体投标', meta && meta.consortium ? '原文不接受联合体' : '', true, '本公司独立投标，无冲突');
    row('资格审查方式', meta && meta.postQual ? '资格后审' : '', true,
      '资格后审：全部证明材料须随投标文件一次提交齐全，缺一项即可能被认定不通过');

    rows.push({
      req: '投标保证金', basis: meta && meta.deposit ? '原文要求保证金' : '平台通行要求',
      result: '待人工核实',
      detail: (meta && meta.deposit
        ? '金额 ' + meta.deposit + ' 元。必须由投标人【基本账户】一次性汇入平台虚拟子账号，且到账截止早于开标。'
        : MISSING_LIB + '（金额与到账截止时间请核对公告原文）')
        + ' 资料库未载明本公司基本账户信息与付款安排，请人工确认。'
    });
    rows.push({
      req: 'CA数字证书 / 电子投标平台账号', basis: '电子标必备',
      result: '待人工核实',
      detail: MISSING_LIB + '（新办CA通常需2-5个工作日，请立即确认）'
    });
    rows.push({
      req: '法定代表人身份证明 / 授权委托书', basis: '投标文件必备',
      result: '待人工核实',
      detail: MISSING_LIB + '（资料库仅载明公章在手，未载明法人证明文件与被授权人信息）'
    });
    rows.push({
      req: '报价与最高限价', basis: meta && meta.priceLimit ? '原文设总价最高限价' : '请核对原文',
      result: '待人工核实',
      detail: (meta && meta.priceLimit
        ? '总价上限 ' + (meta.priceLimit / 10000) + ' 万元（含全部费用），报价不得超出。'
        : MISSING_LIB)
        + ' 具体报价方案不在资料库中，请补充测算。'
    });
    return rows;
  }

  /* ---------- 废标风险 TOP5 ---------- */
  function buildRisks(meta, libText) {
    var risks = [];
    var decMin = meta.decryptMin || 60;
    risks.push({
      rank: 1, level: '高',
      title: '解密时限 —— 提前一天演练',
      body: '本单要求' + (meta.decryptMin ? '开标后 ' + decMin + ' 分钟内' : '限时（原文未检索到具体分钟数，按通行 ' + decMin + ' 分钟准备）') +
        '完成在线解密，失败即无效投标。CA锁过期、密码遗忘、驱动不兼容是电子标废标第一大原因。动作：提前一天用做标的这台电脑、这把锁完整试解密一次。'
    });
    risks.push({
      rank: 2, level: '高',
      title: '同网络制作/上传 = 疑似串标',
      body: '两家投标人在同一办公室、同一WiFi下制作或上传标书，平台会抓到相同IP/MAC/硬盘序列号，直接拒收——不是扣分，是当场出局。动作：做这单的人用自己的电脑、自己的网络，别让其他投标人"搭把手"。'
    });
    risks.push({
      rank: 3, level: '高',
      title: '保证金：账户、金额、时点三查',
      body: (meta.deposit ? '保证金 ' + meta.deposit + ' 元' : '保证金金额请核对原文') +
        '，必须由本公司【基本账户】一次性汇入平台虚拟子账号——个人卡转、关联公司转、分两笔转都可能无效；' +
        (meta.enrollDeadline || meta.bidDeadline ? '到账截止早于开标' + (meta.bidDeadline ? '（本单开标 ' + meta.bidDeadline + '）' : '') + '，别卡点，银行延迟一分钟都没得救。' : '。') +
        ' 动作：今天确认基本账户可对外付款，汇款回执截图存档。'
    });
    risks.push({
      rank: 4, level: /授权书/.test(libText) ? '中' : '高',
      title: '授权书与用印复核',
      body: /授权书/.test(libText)
        ? '授权书在手，但标书普遍要求【加盖投标人公章】，且授权型号须与本标段机型一致——差一样就是废标。动作：拿出来肉眼复核盖章、型号、有效期三件事。'
        : '资料库未载明制造商授权书。代理商投标缺授权书=直接废标。动作：立即向制造商调取并按原文要求用印。'
    });
    risks.push({
      rank: 5, level: '中',
      title: '限价与截止时间：两个数字别碰',
      body: (meta.priceLimit ? '总价一分都不能超 ' + (meta.priceLimit / 10000) + ' 万元（含运输调试等全部费用）；' : '总价限价请核对原文；') +
        (meta.enrollDeadline ? '报名/下载标书 ' + meta.enrollDeadline + ' 截止，' : '') +
        (meta.bidDeadline ? '开标 ' + meta.bidDeadline + '。' : '各节点时间请核对原文。') +
        ' 动作：倒排时间表，新账号办CA要2-5个工作日，别拖到最后一天。'
    });
    return risks;
  }

  /* ---------- 结论与建议 + 就绪度评分 ---------- */
  var DEFAULT_WEIGHTS = { minus: 15, missing: 6, pending: 5, cert: 3 };

  function buildConclusion(params, meta, weights) {
    var W = {};
    Object.keys(DEFAULT_WEIGHTS).forEach(function (k) {
      var v = weights ? parseFloat(weights[k]) : NaN;
      W[k] = isNaN(v) || v < 0 ? DEFAULT_WEIGHTS[k] : v;
    });
    var core = params.filter(function (r) { return r.kind === 'param'; });
    var certs = params.filter(function (r) { return r.kind === 'cert'; });
    var c = { satisfy: 0, plus: 0, minus: 0, missing: 0, pending: 0 };
    core.forEach(function (r) {
      if (r.status === '满足' || r.status === '满足（框架性）') c.satisfy++;
      else if (r.status === '正偏离') c.plus++;
      else if (r.status === '负偏离') c.minus++;
      else if (r.status === '资料库无') c.missing++;
      else c.pending++;
    });
    var certPending = certs.filter(function (r) { return r.status !== '有记载'; }).length;

    /* ★关键参数废标判定：招标惯例★号参数负偏离=直接废标 */
    var killRisk = core.some(function (r) { return r.key && r.status === '负偏离'; });
    /* ▲重要条款（v1.7）：通常影响评分，负偏离或缺失时提示人工复核 */
    var markA = core.filter(function (r) { return r.mark === '▲' && (r.status === '负偏离' || r.status === '资料库无'); }).length;
    /* ★关键参数缺失：资料库里没有该参数——不构成废标判定，但未确认前不可投 */
    var starMissing = core.filter(function (r) { return r.key && (r.status === '资料库无' || r.status === '待人工核对'); }).length;

    /* 投标就绪度评分（0-100）：权重可配置，负偏离默认重罚 */
    var score = 100 - W.minus * c.minus - W.missing * c.missing - W.pending * c.pending - W.cert * certPending;
    if (killRisk) score = Math.min(score, 15);
    if (score < 5) score = 5;
    if (score > 100) score = 100;
    var grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';
    var gradeText = { A: 'A级 · 建议投标', B: 'B级 · 补料后可投', C: 'C级 · 谨慎评估', D: 'D级 · 暂缓' }[grade];

    var verdict;
    if (killRisk) {
      verdict = '🚨 ★关键参数存在负偏离——按招标惯例★号参数不满足即直接废标（不是扣分），本标不可投；除非与招标人书面澄清放宽该参数，或更换机型。';
    } else if (starMissing > 0) {
      verdict = '⚠ ' + starMissing + ' 项★关键参数未在资料库中确认——未确认前不具备投标条件；其余核心参数零负偏离' +
        (c.plus > 0 ? '、' + c.plus + ' 项正偏离' : '') + '，补齐并核实后即可评估投标。';
    } else if (c.minus > 0) {
      verdict = '存在 ' + c.minus + ' 项负偏离，按现行资料不建议直接投标；先解决负偏离参数（换机型或与招标人澄清）后再评估。';
    } else if (c.missing + c.pending + certPending > 0) {
      verdict = '核心参数零负偏离' + (c.plus > 0 ? '、' + c.plus + ' 项正偏离可作加分亮点' : '') +
        '，技术响应处于第一梯队水平，建议投标 —— 前提：补齐 ' + (c.missing + c.pending + certPending) +
        ' 项待人工核实/待补充材料，且总价控制在限价之内。';
    } else {
      verdict = '全部参数满足且零负偏离' + (c.plus > 0 ? '，含 ' + c.plus + ' 项正偏离亮点' : '') +
        '，建议投标 —— 前提：商务材料齐全且总价不超限价。';
    }

    var premises = [];
    if (killRisk) premises.push('解决★关键参数负偏离（或取得招标人书面澄清）——否则投标即废标');
    if (markA > 0) premises.push('复核' + markA + '项▲重要条款（▲负偏离通常影响评分，请核对招标原文的评分约定）');
    if (starMissing > 0) premises.push('确认' + starMissing + '项★关键参数（资料库缺失，未确认前不具备投标条件）');
    if (meta.priceLimit) premises.push('总价 ≤ ' + (meta.priceLimit / 10000) + ' 万元');
    if (certPending) premises.push('补齐' + certPending + '项证明材料（报告/编号类）');
    if (c.missing + c.pending - certPending > 0) premises.push('回填' + Math.max(0, c.missing + c.pending - certPending) + '项待核实参数');
    if (c.minus) premises.push('解决' + c.minus + '项负偏离参数（或与招标人书面澄清）');
    premises.push('授权书用印、保证金、CA三项人工确认');

    return { counts: c, certPending: certPending, score: score, grade: grade, gradeText: gradeText,
             weights: W, killRisk: killRisk, starMissing: starMissing, markA: markA, verdict: verdict, premises: premises };
  }

  /* ---------- Markdown 导出 ---------- */
  function buildMarkdown(R, opts) {
    if (!R || R.error) return '';
    var company = opts && opts.company;
    var L = [];
    L.push('# 标书快反 · 投标分析报告' + (company ? '（' + company + '）' : ''));
    L.push('');
    L.push('> 生成时间：' + new Date(R.generatedAt).toLocaleString('zh-CN') +
      ' ｜ 投标就绪度评分：**' + R.conclusion.score + '/100（' + R.conclusion.gradeText + '）** ｜ 报告指纹：' + (opts && opts.fingerprint ? opts.fingerprint : '—') +
      ' ｜ 本报告由规则引擎基于所提供资料生成，所有"待核实"项必须人工复核后方可用于投标。');
    if (R.conclusion.killRisk) {
      L.push('');
      L.push('> 🚨 **★关键参数负偏离：按招标惯例直接否决投标——本标不可投，除非书面澄清或更换机型。**');
    }
    if (R.timeline && R.timeline.items.length) {
      L.push('');
      L.push('**投标行动时间表（倒排）**：');
      R.timeline.items.forEach(function (it) {
        L.push('- ' + it.when + '（' + (it.daysLeft > 0 ? '距今 ' + it.daysLeft + ' 天' : '已过期，请核对公告时效') + '）—— ' + it.what);
      });
    }
    L.push('');
    L.push('## 一、资格自查');
    L.push('');
    L.push('| 要求 | 依据 | 自查结论 | 说明 |');
    L.push('| --- | --- | --- | --- |');
    R.quals.forEach(function (q) {
      L.push('| ' + q.req + ' | ' + (q.basis || '—') + ' | ' + q.result + ' | ' + q.detail + ' |');
    });
    L.push('');
    L.push('## 二、技术偏离表');
    L.push('');
    L.push('| # | 参数项 | 招标要求 | 投标响应 | 偏离结论 | 置信 | 证明材料 |');
    L.push('| --- | --- | --- | --- | --- | --- | --- |');
    R.params.forEach(function (p, i) {
      L.push('| ' + (i + 1) + ' | ' + (p.key ? '★' : (p.mark === '▲' ? '▲' : '')) + p.name + ' | ' + p.reqText + ' | ' + p.respText +
        (p.note ? '（' + p.note + '）' : '') + ' | ' + p.status + ' | ' + (p.conf === '中' ? '◐ 中' : '● 高') + ' | ' + p.proof + ' |');
    });
    L.push('');
    L.push('## 三、废标风险 TOP5');
    L.push('');
    R.risks.forEach(function (r) {
      L.push('**TOP' + r.rank + '（风险等级：' + r.level + '）' + r.title + '**');
      L.push('');
      L.push(r.body);
      L.push('');
    });
    L.push('## 四、结论与建议');
    L.push('');
    L.push('**投标就绪度评分：' + R.conclusion.score + '/100（' + R.conclusion.gradeText + '）**');
    L.push('');
    L.push(R.conclusion.verdict);
    L.push('');
    L.push('前提条件：' + R.conclusion.premises.map(function (p) { return '①' + p; }).join(' '));
    if (opts && opts.resultB && !opts.resultB.error) {
      var B = opts.resultB;
      L.push('');
      L.push('## 五、对比分析（A设备 vs B设备）');
      L.push('');
      L.push('| 设备 | 就绪度评分 | 等级 | 满足 | 正偏离 | 负偏离 | 待人工核实 |');
      L.push('| --- | --- | --- | --- | --- | --- | --- |');
      var ab = [['A设备（主资料库）', R.conclusion], ['B设备（对比库）', B.conclusion]].map(function (x) {
        var k = x[1].counts, s = x[1];
        return '| ' + x[0] + ' | ' + s.score + '/100 | ' + s.gradeText + ' | ' + k.satisfy + ' | ' + k.plus + ' | ' + k.minus + ' | ' + (k.missing + k.pending + s.certPending) + ' |';
      });
      L.push(ab[0]); L.push(ab[1]);
      L.push('');
      L.push('**B设备结论**：' + B.conclusion.verdict);
      L.push('');
      L.push('**选型建议**：' + (R.conclusion.score > B.conclusion.score
        ? 'A设备综合就绪度更高，优先以A设备投本标。'
        : R.conclusion.score < B.conclusion.score
          ? 'B设备综合就绪度更高，优先以B设备投本标。'
          : '两台设备就绪度相当，按商务报价与库存周期取舍。'));
    }
    L.push('');
    L.push('---');
    L.push('*数据声明：内置演示数据为虚构；本工具不编造任何未提供的品牌、机型、参数、业绩与资质。*');
    return L.join('\n');
  }

  /* ---------- 补料清单（纯文本，一键发给制造商/同事） ---------- */
  function buildRefeedChecklist(R, projectName) {
    if (!R || R.error) return '';
    var L = [], seen = {};
    function add(k, line) { if (!seen[k]) { seen[k] = 1; L.push(line); } }
    L.push('【标书快反 · 投标补料清单】' + (projectName || ''));
    L.push('以下资料不在资料库中，请核实后补充（共 ' + (R.params.filter(function (p) { return p.status !== '满足' && p.status !== '正偏离' && p.status !== '满足（框架性）' && p.status !== '负偏离' && p.status !== '有记载'; }).length + R.quals.filter(function (q) { return q.result !== '有据'; }).length) + ' 项）：');
    L.push('');
    L.push('◆ 设备参数与证明材料（技术偏离表）：');
    var n = 0;
    R.params.forEach(function (p) {
      if (p.status === '资料库无' || p.status === '待人工补充' || p.status === '待人工核对') {
        n++;
        add(p.id, '  ' + n + '. ' + p.name + ' —— ' + (p.status === '待人工核对' ? '单位口径待统一，请提供标准单位数值' : '资料库缺该项') + '（招标要求：' + p.reqText + '）');
      }
    });
    L.push('');
    L.push('◆ 商务与资质（资格自查）：');
    n = 0;
    R.quals.forEach(function (q) {
      if (q.result !== '有据') { n++; add('q' + q.req, '  ' + n + '. ' + q.req); }
    });
    L.push('');
    L.push('（本清单由规则引擎自动生成，补充后请重新运行分析）');
    return L.join('\n');
  }

  /* ---------- 独立 HTML 报告（单文件，可直接转发/打印） ---------- */
  function buildHtmlReport(R, opts) {
    if (!R || R.error) return '';
    var company = opts && opts.company;
    var T = (opts && opts.theme) || null;
    var logo = (opts && opts.logo) || null;
    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    var conf = function (c) { return c === '中' ? '◐ 中' : '● 高'; };
    var c = R.conclusion, cc = c.counts;
    var CIRC = 2 * Math.PI * 52;
    var ringColor = { A: '#0ea472', B: '#2f6fe0', C: '#c07b12', D: '#cf3f3f' }[c.grade] || '#2f6fe0';
    var pillCls = function (s) {
      if (s.indexOf('满足') === 0) return 'ok'; if (s === '正偏离') return 'plus';
      return s === '负偏离' ? 'bad' : 'miss';
    };
    var H = [];
    H.push('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>标书快反 · 投标分析报告</title><style>');
    H.push('body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:#1a2233;margin:0;background:#f4f6fa}');
    H.push('.wrap{max-width:960px;margin:0 auto;padding:32px 24px}');
    H.push('h1{font-size:22px;border-bottom:3px solid ' + (T || '#2f6fe0') + ';padding-bottom:10px}');
    H.push('h2{font-size:16px;margin:26px 0 10px;color:' + (T || '#2f6fe0') + '}');
    H.push('table{width:100%;border-collapse:collapse;font-size:12.5px;background:#fff}');
    H.push('th,td{border:1px solid #dde3ee;padding:7px 10px;text-align:left;line-height:1.65;vertical-align:top}');
    H.push('th{background:#eef3fc;color:#3a4a66}');
    H.push('.pill{padding:1px 9px;border-radius:10px;font-size:11px;font-weight:700;white-space:nowrap}');
    H.push('.ok{background:#e2f7ef;color:#0b8a61}.plus{background:#e7effd;color:#2456b3}.bad{background:#fdeaea;color:#b32424}.miss{background:#fdf3e2;color:#9a6a0a}');
    H.push('.meta{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}');
    H.push('.mc{background:#fff;border:1px solid #dde3ee;border-radius:9px;padding:8px 14px;font-size:12px}');
    H.push('.mc b{display:block;font-size:14px;color:#1a2233}.mc span{color:#7a88a3}');
    H.push('.head{display:flex;gap:28px;align-items:center;background:#fff;border:1px solid #dde3ee;border-radius:14px;padding:18px;margin:12px 0}');
    H.push('.note{color:#9a6a0a;font-size:11.5px;display:block}');
    H.push('.risk{background:#fff;border:1px solid #dde3ee;border-left:4px solid #cf3f3f;border-radius:9px;padding:10px 14px;margin:8px 0;font-size:12.5px}');
    H.push('.risk.mid{border-left-color:#c07b12}');
    H.push('.verdict{background:#eef3fc;border:1px solid #b9cdf2;border-radius:10px;padding:12px 16px;font-size:13.5px;line-height:1.9}');
    H.push('.foot{color:#8896b3;font-size:11px;margin-top:24px;border-top:1px solid #dde3ee;padding-top:10px}');
    H.push('@media print{body{background:#fff}.wrap{padding:0}}');
    H.push('</style></head><body><div class="wrap">');
    if (logo) H.push('<div style="text-align:center;margin-bottom:6px"><img src="' + logo + '" style="height:56px" alt="logo"></div>');
    H.push('<h1 style="' + (T ? 'border-bottom-color:' + T + ';' : '') + '">⚙️ 标书快反 · 投标分析报告' + (company ? '（' + esc(company) + '）' : '') + '</h1>');
    H.push('<p style="color:#7a88a3;font-size:12px">生成时间：' + new Date(R.generatedAt).toLocaleString('zh-CN') + '</p>');

    H.push('<div class="meta">');
    H.push('<div class="mc"><span>总价限价</span><b>' + (R.meta.priceLimit ? (R.meta.priceLimit / 10000) + ' 万元' : '待核实') + '</b></div>');
    H.push('<div class="mc"><span>采购预算</span><b>' + (R.meta.budget ? (R.meta.budget / 10000) + ' 万元' : '未标注') + '</b></div>');
    H.push('<div class="mc"><span>投标保证金</span><b>' + (R.meta.deposit ? R.meta.deposit + ' 元' : '待核实') + '</b></div>');
    H.push('<div class="mc"><span>在线解密</span><b>开标后 ' + (R.meta.decryptMin || 60) + ' 分钟内</b></div>');
    H.push('<div class="mc"><span>报名截止</span><b>' + esc(R.meta.enrollDeadline || '待核实') + '</b></div>');
    H.push('<div class="mc"><span>开标时间</span><b>' + esc(R.meta.bidDeadline || '待核实') + '</b></div>');
    H.push('<div class="mc"><span>审查方式</span><b>' + (R.meta.postQual ? '资格后审' : '待核实') + '</b></div>');
    H.push('<div class="mc"><span>距开标</span><b>' + (R.timeline && R.timeline.daysToBid != null ? (R.timeline.daysToBid > 0 ? R.timeline.daysToBid + ' 天' : '已过期') : '待核实') + '</b></div>');
    H.push('</div>');

    if (R.conclusion.killRisk) {
      H.push('<div style="background:#fdeaea;border:1px solid #e5a3a3;color:#b32424;border-radius:9px;padding:10px 14px;font-weight:700;margin:8px 0">🚨 ★关键参数负偏离：按招标惯例直接否决投标——本标不可投，除非书面澄清或更换机型。</div>');
    }
    if (R.timeline && R.timeline.items.length) {
      H.push('<div style="background:#fff;border:1px solid #dde3ee;border-radius:9px;padding:10px 14px;margin:8px 0;font-size:12.5px"><b>📅 投标行动时间表（倒排）</b><br>' +
        R.timeline.items.map(function (it) {
          return esc(it.when) + '（' + (it.daysLeft > 0 ? '距今 ' + it.daysLeft + ' 天' : '已过期') + '）—— ' + esc(it.what);
        }).join('<br>') + '</div>');
    }

    H.push('<div class="head"><svg width="120" height="120" viewBox="0 0 132 132" style="transform:rotate(-90deg)">' +
      '<circle cx="66" cy="66" r="52" fill="none" stroke="#e8edf6" stroke-width="11"/>' +
      '<circle cx="66" cy="66" r="52" fill="none" stroke="' + ringColor + '" stroke-width="11" stroke-linecap="round" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + (CIRC * (1 - c.score / 100)).toFixed(1) + '"/></svg>' +
      '<div><div style="font-size:30px;font-weight:800;color:' + ringColor + '">' + c.score + '<span style="font-size:13px;color:#8896b3">/100</span></div>' +
      '<div style="font-size:14px;font-weight:700;color:' + ringColor + '">' + esc(c.gradeText) + '</div>' +
      '<div style="font-size:12px;color:#7a88a3;margin-top:4px">满足 ' + cc.satisfy + ' · 正偏离 ' + cc.plus + ' · 负偏离 ' + cc.minus + ' · 待人工核实 ' + (cc.missing + cc.pending + c.certPending) + '</div></div></div>');

    H.push('<h2>一、资格自查</h2><table><tr><th>要求</th><th>依据</th><th>结论</th><th>说明</th></tr>');
    R.quals.forEach(function (q) {
      H.push('<tr><td><b>' + esc(q.req) + '</b></td><td>' + esc(q.basis || '—') + '</td><td><span class="pill ' + (q.result === '有据' ? 'ok' : 'miss') + '">' + q.result + '</span></td><td>' + esc(q.detail) + '</td></tr>');
    });
    H.push('</table>');

    var hasB = opts && opts.resultB && !opts.resultB.error;
    var bp = {};
    if (hasB) opts.resultB.params.forEach(function (p) { bp[p.id] = p; });
    H.push('<h2>二、技术偏离表</h2><table><tr><th>#</th><th>参数项</th><th>招标要求</th><th>投标响应（A）</th><th>A结论</th><th>置信</th>' +
      (hasB ? '<th>投标响应（B）</th><th>B结论</th><th>置信</th>' : '') + '<th>证明材料</th></tr>');
    R.params.forEach(function (p, i) {
      var b = hasB ? bp[p.id] : null;
      H.push('<tr><td>' + (i + 1) + '</td><td><b>' + (p.key ? '★' : (p.mark === '▲' ? '▲' : '')) + esc(p.name) + '</b></td><td>' + esc(p.reqText) + '</td><td>' + esc(p.respText) + (p.note ? '<span class="note">⚠ ' + esc(p.note) + '</span>' : '') + '</td><td><span class="pill ' + pillCls(p.status) + '">' + esc(p.status) + '</span></td><td>' + conf(p.conf || '高') + '</td>' +
        (hasB ? '<td>' + (b ? esc(b.respText) + (b.note ? '<span class="note">⚠ ' + esc(b.note) + '</span>' : '') : '—（未检索到）') + '</td><td><span class="pill ' + pillCls(b ? b.status : '—') + '">' + (b ? esc(b.status) : '—') + '</span></td><td>' + conf(b ? b.conf || '高' : '高') + '</td>' : '') +
        '<td>' + esc(p.proof) + '</td></tr>');
    });
    H.push('</table>');

    H.push('<h2>三、废标风险 TOP5</h2>');
    R.risks.forEach(function (r) {
      H.push('<div class="risk' + (r.level === '中' ? ' mid' : '') + '"><b>TOP' + r.rank + ' · ' + esc(r.title) + '</b>（风险' + esc(r.level) + '）<br><span style="color:#5a6a88">' + esc(r.body) + '</span></div>');
    });

    H.push('<h2>四、结论与建议</h2><div class="verdict" style="' + (T ? 'border-color:' + T + ';' : '') + '"><b>' + c.score + '/100（' + esc(c.gradeText) + '）</b><br>' + esc(c.verdict) + '<br><span style="font-size:12px;color:#5a6a88">前提：' + esc(c.premises.join('；')) + '</span></div>');
    if (hasB) {
      var Bc = opts.resultB.conclusion, Bk = Bc.counts;
      H.push('<h2>五、对比分析（A设备 vs B设备）</h2>');
      H.push('<div class="verdict" style="background:#f6f8fc"><b>A设备：</b>' + c.score + '/100（' + esc(c.gradeText) + '）—— 满足 ' + cc.satisfy + ' · 正偏离 ' + cc.plus + ' · 负偏离 ' + cc.minus + '<br>' +
        '<b>B设备：</b>' + Bc.score + '/100（' + esc(Bc.gradeText) + '）—— 满足 ' + Bk.satisfy + ' · 正偏离 ' + Bk.plus + ' · 负偏离 ' + Bk.minus + '<br>' +
        '<span style="font-size:12px;color:#5a6a88">' + esc(Bc.verdict) + '</span><br>' +
        '<b>选型建议</b>：' + (c.score > Bc.score ? 'A设备综合就绪度更高，优先以A设备投本标。' : c.score < Bc.score ? 'B设备综合就绪度更高，优先以B设备投本标。' : '两台设备就绪度相当，按商务报价与库存周期取舍。') + '</div>');
    }
    H.push('<p class="foot">报告指纹 ' + (opts && opts.fingerprint ? esc(opts.fingerprint) : '—') + ' · 引擎 v2.1.1 · 数据声明：本报告由标书快反规则引擎基于所提供资料生成，内置演示数据为虚构；不编造任何未提供的品牌、机型、参数、业绩与资质。AI辅助分析不能替代人工复核，投标前必须逐条核对招标文件原文。</p>');
    H.push('</div></body></html>');
    return H.join('');
  }

  /* ---------- 自定义词库（v1.6）：把用户别名并入参数关键词 ---------- */
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function kwWithAliases(def, aliases) {
    if (!aliases || !aliases.length) return def.kw;
    var terms = [];
    aliases.forEach(function (a) { if (a && a.param === def.id && a.term) { var t = String(a.term).trim(); if (t) terms.push(escRe(t)); } });
    if (!terms.length) return def.kw;
    return new RegExp(def.kw.source + '|' + terms.join('|'), 'i');
  }
  function aliasHit(def, aliases, raw) {
    if (!aliases || !raw) return null;
    for (var i = 0; i < aliases.length; i++) {
      var a = aliases[i];
      if (a && a.param === def.id && a.term && raw.indexOf(a.term.trim()) >= 0) return a.term.trim();
    }
    return null;
  }

  /* ---------- 公告变更检测（v1.6）：旧版 vs 新版（澄清/补遗） ---------- */
  function collectParams(t) {
    var map = {};
    PARAM_DEFS.forEach(function (def) {
      var m = extractNum(t, def.kw, def.unit, def.mode);
      if (m) map[def.id] = { name: def.name, raw: m.raw, key: starForParam(t, m.idx) };
    });
    var st = parseEmission(t);
    if (st) map['emission'] = { name: '发动机排放阶段', raw: '国' + CN[st], key: false };
    return map;
  }

  function diffAnnouncements(oldT, newT) {
    oldT = (oldT || '').trim(); newT = (newT || '').trim();
    if (!oldT || !newT) return { error: '请分别粘贴旧版与新版公告。' };
    if (oldT === newT) return { error: '两版公告内容完全一致，无差异。' };

    var A = extractMeta(oldT), B = extractMeta(newT);
    var rows = [];
    function fmtWan(v) { return v ? (v / 10000) + ' 万元' : null; }
    function cmp(label, a, b, sev, hint, f) {
      var av = (a === null || a === undefined || a === '') ? '（未提取到）' : (f ? f(a) : String(a));
      var bv = (b === null || b === undefined || b === '') ? '（未提取到）' : (f ? f(b) : String(b));
      if (av !== bv) rows.push({ kind: '关键信息', label: label, oldV: av, newV: bv, severity: sev, hint: hint });
    }
    cmp('总价限价', A.priceLimit, B.priceLimit, '高', '报价上限变化，立即调整报价测算', fmtWan);
    cmp('投标保证金', A.deposit, B.deposit, '高', '金额变化，重新安排基本账户汇款（注意到账时限）');
    cmp('开标 / 投标截止', A.bidDeadline, B.bidDeadline, '高', '时间变更，重排行动时间表并通知全员');
    cmp('报名 / 下载标书截止', A.enrollDeadline, B.enrollDeadline, '中', '报名节点变化，确认已完成报名与标书下载');
    cmp('在线解密时限', A.decryptMin, B.decryptMin, '中', '按新时限重做解密演练', function (v) { return v ? '开标后 ' + v + ' 分钟内' : v; });
    cmp('资格审查方式', A.postQual, B.postQual, '中', '审查方式变化，调整材料提交策略', function (v) { return v ? '资格后审' : '（未标注）'; });
    cmp('联合体条款', A.consortium, B.consortium, '中', '组队政策变化', function (v) { return v ? '不接受联合体' : '（未标注）'; });

    var PA = collectParams(oldT), PB = collectParams(newT);
    Object.keys(PB).forEach(function (id) {
      var b = PB[id], a = PA[id];
      if (!a) {
        rows.push({ kind: '技术参数', label: b.name, oldV: '（无此参数）', newV: b.raw + (b.key ? ' ★' : ''), severity: b.key ? '高' : '中', hint: '新增参数要求，回填偏离表核对' });
      } else if (a.raw !== b.raw) {
        rows.push({ kind: '技术参数', label: b.name, oldV: a.raw, newV: b.raw, severity: '高', hint: '参数要求变化，重新生成偏离表逐条核对' });
      }
      if (a && !a.key && b.key) rows.push({ kind: '★变更', label: b.name, oldV: '普通参数', newV: '★关键参数', severity: '高', hint: '新增★标注：不满足即废标，务必确认我方参数' });
      if (a && a.key && !b.key) rows.push({ kind: '★变更', label: b.name, oldV: '★关键参数', newV: '普通参数', severity: '中', hint: '★已取消，废标风险解除（仍建议满足）' });
    });
    Object.keys(PA).forEach(function (id) {
      if (!PB[id]) rows.push({ kind: '技术参数', label: PA[id].name, oldV: PA[id].raw, newV: '（已删除）', severity: '中', hint: '参数要求被移除' });
    });

    /* 证明材料要求增删（澄清/补遗常见变更点） */
    ['型式试验报告', '质检报告', '环保信息公开编号'].forEach(function (item) {
      var inA = oldT.indexOf(item) >= 0, inB = newT.indexOf(item) >= 0;
      if (inA && !inB) rows.push({ kind: '证明材料', label: item, oldV: '原文要求提供', newV: '（已删除）', severity: '中', hint: '证明材料要求被移除，按新版清单准备' });
      if (!inA && inB) rows.push({ kind: '证明材料', label: item, oldV: '（无此要求）', newV: '原文要求提供', severity: '高', hint: '新增证明材料要求，立即向制造商调取' });
    });

    var order = { '高': 0, '中': 1 };
    rows.sort(function (x, y) { return order[x.severity] - order[y.severity]; });
    var high = rows.filter(function (r) { return r.severity === '高'; }).length;
    var advice = [];
    if (high > 0) advice.push('存在 ' + high + ' 项高风险变更，建议暂停当前标书制作，先逐条消化变更内容');
    advice.push('以新版公告为基准重新运行「生成投标分析」，刷新偏离表与就绪度评分');
    advice.push('将本对比结果转发团队，确认时间表、保证金、报价同步更新');
    return { rows: rows, total: rows.length, high: high, advice: advice };
  }

  /* ---------- 采购文件技术参数章节定位（v2.1）----------
   * 输入：采购文件全文（或公告+采购文件拼接文本）
   * 输出：{ found, text, start } —— 定位失败时 found=false（如扫描件/无文本层）
   * 策略：优先命中明确章节标题，其次命中参数关键词密集段；不做任何内容改写
   */
  function locateParamSection(text) {
    text = (text || '').replace(/\r\n?/g, '\n');
    if (!text.trim()) return { found: false, text: '', start: -1 };
    var starts = [
      /第[一二三四五六七八九十\d]+[章节][^\n]{0,40}(技术参数|采购需求|招标要求|技术要求)/,
      /(技术参数与性能指标|主要技术参数|技术参数要求|技术规格要求)/,
      /(采购需求|项目需求)[^\n]{0,20}(及技术参数|参数要求)/
    ];
    var start = -1;
    for (var i = 0; i < starts.length && start < 0; i++) {
      var m = text.match(starts[i]);
      if (m) start = m.index;
    }
    if (start < 0) return { found: false, text: '', start: -1 };
    // 章节终点：下一个"第X章/附件/其他章标题"或文末（上限2万字符防失控）
    var ends = [/\n\s*第[一二三四五六七八九十\d]+[章节]/, /\n\s*附件/, /\n\s*(资格审查|评标办法|合同条款|商务要求)/];
    var end = Math.min(text.length, start + 20000);
    ends.forEach(function (re) {
      var em = text.slice(start + 10).match(re);
      if (em) { var e = start + 10 + em.index; if (e > start + 10) end = Math.min(end, e); }
    });
    return { found: true, text: text.slice(start, end), start: start, end: end };
  }

  /* ---------- 导出 ---------- */
  return {
    VERSION: '2.1.1',
    DEFAULT_WEIGHTS: DEFAULT_WEIGHTS,
    MISSING_LIB: MISSING_LIB,
    DEMO_LIBRARY: DEMO_LIBRARY,
    DEMO_TENDER: DEMO_TENDER,
    DEMOS: DEMOS,
    DEMO_DIFF: { old: DEMO_DIFF_OLD, new: DEMO_TENDER },
    PARAM_DEFS: PARAM_DEFS,
    SYSTEM_PROMPT: SYSTEM_PROMPT,
    analyze: analyze,
    diffAnnouncements: diffAnnouncements,
    locateParamSection: locateParamSection,
    extractMeta: extractMeta,
    analyzeParams: analyzeParams,
    analyzeQuals: analyzeQuals,
    buildRisks: buildRisks,
    buildConclusion: buildConclusion,
    buildMarkdown: buildMarkdown,
    buildRefeedChecklist: buildRefeedChecklist,
    buildHtmlReport: buildHtmlReport
  };
});
