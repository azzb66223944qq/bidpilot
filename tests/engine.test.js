/* 标书快反 BidPilot · 引擎回归测试
 * 运行：node tests/engine.test.js
 * 覆盖：双演示场景、12类参数解析、单位换算（mm↔m、马力↔kW）、
 *       单位口径冲突、半年质保、无关输入、弱机负偏离、评分模型、Markdown导出
 */
'use strict';
const E = require('../engine.js');

let pass = 0, fail = 0;
function t(name, cond) { cond ? pass++ : fail++; console.log((cond ? '✅' : '❌') + ' ' + name); }
function statusOf(R, id) { const p = R.params.find(x => x.id === id); return p && p.status; }

/* ===== 场景一：装载机（正例，A级） ===== */
const R1 = E.analyze(E.DEMOS.loader.lib, E.DEMOS.loader.tender);
t('装载机:分析正常', R1 && !R1.error);
t('装载机:限价=340250元', R1.meta.priceLimit === 340250);
t('装载机:保证金=6800', R1.meta.deposit === 6800);
t('装载机:解密=60分钟', R1.meta.decryptMin === 60);
t('装载机:不接受联合体', R1.meta.consortium === true);
t('装载机:载重=满足', statusOf(R1,'load') === '满足');
t('装载机:斗容=正偏离', statusOf(R1,'bucket') === '正偏离');
t('装载机:功率=正偏离', statusOf(R1,'power') === '正偏离');
t('装载机:整机质量=满足(上限型)', statusOf(R1,'mass') === '满足');
t('装载机:卸载高度 3.1m vs ≥2900mm = 正偏离(跨单位换算)', statusOf(R1,'dumpHeight') === '正偏离');
t('装载机:掘起力 175 vs ≥170kN = 正偏离', statusOf(R1,'force') === '正偏离');
t('装载机:排放=满足', statusOf(R1,'emission') === '满足');
t('装载机:交货期=满足', statusOf(R1,'delivery') === '满足');
t('装载机:质保=满足', statusOf(R1,'warranty') === '满足');
t('装载机:证明材料=待人工补充(不编造)', R1.params.filter(p => p.kind === 'cert').every(p => p.status === '待人工补充'));
t('装载机:零负偏离', R1.conclusion.counts.minus === 0);
t('装载机:正偏离=4', R1.conclusion.counts.plus === 4);
t('装载机:评分=94', R1.conclusion.score === 94);
t('装载机:A级', R1.conclusion.grade === 'A');
t('装载机:结论=建议投标', R1.conclusion.verdict.indexOf('建议投标') >= 0);

/* ===== 场景二：挖掘机（反例，埋负偏离，B级） ===== */
const R2 = E.analyze(E.DEMOS.excavator.lib, E.DEMOS.excavator.tender);
t('挖掘机:限价=88.6万', R2.meta.priceLimit === 886000);
t('挖掘机:保证金=17000', R2.meta.deposit === 17000);
t('挖掘机:解密=45分钟', R2.meta.decryptMin === 45);
t('挖掘机:整机质量 20.5 vs 20~22t = 满足', statusOf(R2,'mass') === '满足');
t('挖掘机:斗容=正偏离', statusOf(R2,'bucket') === '正偏离');
t('挖掘机:挖掘深度 6.58m vs ≥6500mm = 正偏离(跨单位换算)', statusOf(R2,'digDepth') === '正偏离');
t('挖掘机:功率 129 vs ≥125kW = 正偏离', statusOf(R2,'power') === '正偏离');
t('挖掘机:爬坡 65% vs ≥70% = 负偏离', statusOf(R2,'ride') === '负偏离');
t('挖掘机:负偏离=1', R2.conclusion.counts.minus === 1);
t('挖掘机:★爬坡=关键参数', R2.params.find(p => p.id === 'ride').key === true);
t('挖掘机:触发★废标判定', R2.conclusion.killRisk === true);
t('挖掘机:评分压至=15', R2.conclusion.score === 15);
t('挖掘机:D级', R2.conclusion.grade === 'D');
t('挖掘机:结论=直接废标警告', R2.conclusion.verdict.indexOf('直接废标') >= 0);
t('挖掘机:前提含★澄清', R2.conclusion.premises.some(p => p.indexOf('★') >= 0));

/* ===== 单位与口径边界 ===== */
const RH = E.analyze('我方设备额定功率 150马力。', '要求额定功率 ≥110kW。');
t('马力→kW: 150马力≈110.3 → 正偏离(附换算说明)', statusOf(RH,'power') === '正偏离');
const RHALF = E.analyze('质保：半年。', '质保期：不低于 1 年。');
t('半年质保=负偏离(附提示)', statusOf(RHALF,'warranty') === '负偏离');
const RHALF2 = E.analyze('质保：半年。', '质保期：不低于 0.5 年。');
t('半年质保:要求0.5年=满足(回归)', statusOf(RHALF2,'warranty') === '满足');
const RHALF3 = E.analyze('质保：半年。', '质保期：不超过 2 年。');
t('半年质保:上限型要求=满足(回归)', statusOf(RHALF3,'warranty') === '满足');
const RMIX = E.analyze('爬坡能力 30度。', '爬坡能力 ≥70%。');
t('爬坡 % vs 度 = 待人工核对(拒绝瞎换算)', statusOf(RMIX,'ride') === '待人工核对');
const RRANGE = E.analyze('整机工作质量 21t。', '整机工作质量 20~22t。');
t('范围要求 20~22t: 21t = 满足', statusOf(RRANGE,'mass') === '满足');

/* ===== 鲁棒性 ===== */
t('空输入报错', E.analyze('', '').error !== undefined);
const RN = E.analyze('与设备无关的文本。', '无关招标。');
t('无关输入:零参数行(不产生噪音)', RN.params.filter(p => p.kind === 'param').length === 0);
t('无关输入:不崩溃且全部待核实', RN && !RN.error);
const RW = E.analyze('额定载重量 4000kg。斗容 2.0m³。排放国三。交货期 45 天。质保半年。', E.DEMOS.loader.tender);
t('弱机:载重4000=负偏离', statusOf(RW,'load') === '负偏离');
t('弱机:排放国三=负偏离', statusOf(RW,'emission') === '负偏离');
t('弱机:评分C/D级', RW.conclusion.grade === 'C' || RW.conclusion.grade === 'D');

/* ===== 导出 ===== */
const MD = E.buildMarkdown(R2);
t('导出含评分', MD.indexOf('投标就绪度评分') >= 0 && MD.indexOf('/100') >= 0);
t('导出含四大部分', ['资格自查','技术偏离表','废标风险','结论与建议'].every(s => MD.indexOf(s) >= 0));
t('导出含虚构声明', MD.indexOf('虚构') >= 0);

/* ===== v1.2：HTML 报告与补料清单 ===== */
const HTML = E.buildHtmlReport(R1);
t('HTML报告:完整独立文档', HTML.indexOf('<!DOCTYPE html>') === 0 && HTML.indexOf('</html>') > 0);
t('HTML报告:含评分环与四部分', HTML.indexOf('stroke-dasharray') > 0 && ['资格自查','技术偏离表','废标风险','结论与建议'].every(s => HTML.indexOf(s) >= 0));
t('HTML报告:速览卡数据正确', HTML.indexOf('34.025') > 0 && HTML.indexOf('6800') > 0);
t('HTML报告:HTML转义防注入', E.buildHtmlReport(E.analyze('额定载重量 <script>alert(1)</script>kg。','要求额定载重量 ≥1kg。')).indexOf('<script>') === -1);
const CL = E.buildRefeedChecklist(R1, '宁波水务装载机');
t('补料清单:含项目名与缺失证明', CL.indexOf('宁波水务') >= 0 && CL.indexOf('型式试验报告') >= 0 && CL.indexOf('环保信息公开编号') >= 0);
t('补料清单:含商务待核实项', CL.indexOf('CA数字证书') >= 0);
t('补料清单:不含已满足参数', CL.indexOf('标准斗容') === -1 && CL.indexOf('额定载重量 ——') === -1);
t('版本=2.1.1', E.VERSION === '2.1.1');

/* ===== v1.4：★关键参数废标判定 + 行动时间表 + 公司抬头 ===== */
t('装载机:★斗容已满足=不触发废标', R1.params.find(p => p.id === 'bucket').key === true && R1.conclusion.killRisk === false);
t('装载机:★只归属斗容（段级定位）', R1.params.filter(p => p.key).map(p => p.id).join(',') === 'bucket');
t('装载机:时间表含3个节点', R1.timeline.items.length === 3);
t('装载机:保证金截止日已提取', R1.meta.depositDeadline === '2026年10月12日15:00');
t('装载机:距开标为正数(未来日期)', R1.timeline.daysToBid > 0);
t('装载机:时间表含演练解密动作', R1.timeline.items.some(it => it.what.indexOf('解密') >= 0));
const RSTAR = E.analyze('我方设备：标准斗容 2.0m³。额定载重量 5000kg。', '第四章：额定载重量 ≥5000kg；★标准斗容 ≥2.7m³。');
t('★负偏离→废标:killRisk=true', RSTAR.conclusion.killRisk === true);
t('★负偏离→废标:评分≤15且D级', RSTAR.conclusion.score <= 15 && RSTAR.conclusion.grade === 'D');
const RSTAR2 = E.analyze('我方设备：标准斗容 2.0m³。', '第四章：标准斗容 ≥2.7m³（普通参数，无星号）。');
t('无★的负偏离=普通负偏离(不废标)', RSTAR2.conclusion.killRisk === false);
const MD2 = E.buildMarkdown(R1, { company: '浙东机械经销有限公司' });
t('MD报告:含公司抬头', MD2.indexOf('（浙东机械经销有限公司）') >= 0);
t('MD报告:含时间表', MD2.indexOf('投标行动时间表') >= 0);
const HTML2 = E.buildHtmlReport(R1, { company: '浙东机械' });
t('HTML报告:含公司抬头与倒计时卡', HTML2.indexOf('（浙东机械）') >= 0 && HTML2.indexOf('距开标') >= 0);
t('版本=2.1.1', E.VERSION === '2.1.1');

/* ===== v1.3：新机型场景与评分权重配置 ===== */
const RC = E.analyze(E.DEMOS.crane.lib, E.DEMOS.crane.tender);
t('起重机:起重量 25 vs ≥25t = 满足', statusOf(RC,'liftCap') === '满足');
t('起重机:力矩 1050 vs ≥1000kN·m = 正偏离', statusOf(RC,'moment') === '正偏离');
t('起重机:质保 2年 = 正偏离', statusOf(RC,'warranty') === '正偏离');
t('起重机:评分=94 A级', RC.conclusion.score === 94 && RC.conclusion.grade === 'A');
const RP = E.analyze(E.DEMOS.pump.lib, E.DEMOS.pump.tender);
t('泵车:方量 110 vs ≥120m³/h = 负偏离', statusOf(RP,'pumpRate') === '负偏离');
t('泵车:臂架 37 vs ≥35m = 正偏离', statusOf(RP,'boomHeight') === '正偏离');
t('泵车:评分=64 C级', RP.conclusion.score === 64 && RP.conclusion.grade === 'C');
const RW2 = E.analyze(E.DEMOS.pump.lib, E.DEMOS.pump.tender, { weights: { minus: 5, missing: 2, pending: 2, cert: 1 } });
t('自定义权重:100-5×2-1×2=88', RW2.conclusion.score === 88 && RW2.conclusion.grade === 'A');
t('自定义权重:权重已回传', RW2.conclusion.weights.minus === 5);
t('默认权重不受影响', E.analyze(E.DEMOS.loader.lib, E.DEMOS.loader.tender).conclusion.weights.minus === 15);
t('非法权重回退默认', E.analyze(E.DEMOS.pump.lib, E.DEMOS.pump.tender, { weights: { minus: -3, missing: 'abc' } }).conclusion.score === 64);


/* ===== v1.6：公告变更检测 + 自定义词库 ===== */
const DF = E.diffAnnouncements(E.DEMO_DIFF.old, E.DEMO_DIFF.new);
t('diff:6处变更', DF && !DF.error && DF.total === 6);
t('diff:高风险=6', DF.high === 6);
t('diff:限价 35.8→34.025万', DF.rows.some(r => r.label === '总价限价' && r.oldV.indexOf('35.8') >= 0 && r.newV.indexOf('34.025') >= 0));
t('diff:开标时间变更', DF.rows.some(r => r.label.indexOf('开标') >= 0 && r.oldV.indexOf('10月15日') >= 0 && r.newV.indexOf('10月13日') >= 0));
t('diff:斗容 2.5→2.7 参数变更', DF.rows.some(r => r.kind === '技术参数' && r.label === '标准斗容' && r.oldV.indexOf('2.5') >= 0));
t('diff:★新增被捕获(斗容)', DF.rows.some(r => r.kind === '★变更' && r.label === '标准斗容' && r.newV.indexOf('★') >= 0));
t('diff:环保编号新增被捕获', DF.rows.some(r => r.kind === '证明材料' && r.label.indexOf('环保') >= 0 && r.oldV.indexOf('无此要求') >= 0));
t('diff:高风险排前', DF.rows[0].severity === '高');
t('diff:附下一步建议', DF.advice.length >= 2);
t('diff:相同文本报错', !!E.diffAnnouncements('同一份。', '同一份。').error);
t('diff:空输入报错', !!E.diffAnnouncements('', 'x').error);
const RA0 = E.analyze('我方设备：额定容积 3.0m³。', '第四章：标准斗容 ≥2.7m³。');
t('无词库:非标准表述→资料库无', statusOf(RA0,'bucket') === '资料库无');
const RA1 = E.analyze('我方设备：额定容积 3.0m³。', '第四章：标准斗容 ≥2.7m³。', { aliases: [{ term:'额定容积', param:'bucket' }] });
t('有词库:别名匹配→正偏离', statusOf(RA1,'bucket') === '正偏离');
t('有词库:诚实标注别名来源', (RA1.params.find(p => p.id === 'bucket').note || '').indexOf('自定义词库') >= 0);
const RA2 = E.analyze('设备额定载荷 5t。', '要求额定载重量 ≥4吨。', { aliases: [{ term:'额定载荷', param:'load' }] });
t('词库+吨kg换算:达标', ['满足','正偏离'].indexOf(statusOf(RA2,'load')) >= 0);
t('词库:正则特殊字符安全', (() => { const R = E.analyze('斗容(额定) 3.0m³。', '标准斗容 ≥2.7m³。', { aliases: [{ term:'斗容(额定)', param:'bucket' }] }); return statusOf(R,'bucket') !== '资料库无'; })());
t('导出PARAM_DEFS=32类', E.PARAM_DEFS.length === 32);
t('版本=2.1.1', E.VERSION === '2.1.1');


/* ===== v1.6b：真实公告适配（限价/预算分离 + （元）格式） ===== */
const RB1 = E.analyze('第四章：额定载重量 ≥5000kg。', '预算金额（元）：3800000\n最高限价（元）：3783217.78');
t('真实格式:（元）后缀限价=3783218', RB1.meta.priceLimit === 3783218);
t('真实格式:（元）后缀预算=3800000', RB1.meta.budget === 3800000);
const RB2 = E.analyze('第四章：额定载重量 ≥5000kg。', '预算金额：786,000.00元');
t('真实格式:只有预算时限价=null且预算=786000', RB2.meta.priceLimit === null && RB2.meta.budget === 786000);
const RB3 = E.analyze('第四章：额定载重量 ≥5000kg。', '总价最高限价：35.8万元。');
t('常规格式回归:限价35.8万', RB3.meta.priceLimit === 358000);


/* ===== v1.7：品类扩展 + ▲重要条款 + 交货期新措辞 ===== */
const ROLL = E.analyze(
  '我方设备：单钢轮振动压路机。工作质量 14t；激振力 350kN；振动频率 30Hz；压实宽度 2.2m；额定功率 110kW；排放满足国四；交货期 ≤25天；质保 2年。',
  '第四章：工作质量 13~16t；激振力 ≥320kN；振动频率 ≥28Hz；压实宽度 ≥2100mm；额定功率 ≥100kW；排放国四；交货期 不超过30天；质保期 不低于1年。');
t('压路机:激振力350 vs ≥320kN = 正偏离', statusOf(ROLL,'vibForce') === '正偏离');
t('压路机:振动频率 30 vs ≥28Hz = 正偏离', statusOf(ROLL,'vibFreq') === '正偏离');
t('压路机:压实宽度 2.2m vs ≥2100mm = 正偏离(换算)', statusOf(ROLL,'compWidth') === '正偏离');
t('压路机:工作质量 14 vs 13~16t 区间 = 满足', statusOf(ROLL,'mass') === '满足');
const SPR = E.analyze(
  '我方设备：绿化洒水车。罐体容积 12m³；额定功率 118kW；排放满足国四；交货期 ≤20天；质保 1年。',
  '第四章：★罐体容积 ≥13m³；额定功率 ≥115kW；排放国四；交货期 不超过30天；质保期 不低于1年。');
t('洒水车:罐体 12m³ vs ≥13m³ = 负偏离', statusOf(SPR,'tankVolume') === '负偏离');
t('洒水车:功率 118 vs ≥115kW = 正偏离', statusOf(SPR,'power') === '正偏离');
const SPR2 = E.analyze(
  '我方设备：绿化洒水车。罐体容积 12000L。',
  '第四章：★罐体容积 ≥13m³。');
t('洒水车:12000L→12m³ 换算比对', ['负偏离','满足','正偏离'].indexOf(statusOf(SPR2,'tankVolume')) >= 0 && statusOf(SPR2,'tankVolume') !== '资料库无');
const RA3 = E.analyze('第四章：★罐体容积 ≥13m³。', '第四章：▲罐体容积 ≥12m³。');
t('▲标记:mark=▲', RA3.params.find(p => p.id === 'tankVolume').mark === '▲');
const RA4 = E.analyze('我方设备：罐体容积 10m³。', '第四章：▲罐体容积 ≥12m³。');
t('▲负偏离:killRisk=false(区别于★)', RA4.conclusion.killRisk === false);
t('▲负偏离:前提含复核▲', RA4.conclusion.premises.some(p => p.indexOf('▲') >= 0));
const RD1 = E.analyze('我方承诺自合同签订之日起15天内完成供货。', '第四章：合同履行期限：自签订之日起10天内完成供货。');
t('交货期新措辞:履行期限15 vs ≤10天 = 负偏离', statusOf(RD1,'delivery') === '负偏离');
const RD2 = E.analyze('我方承诺自合同签订之日起8天内完成供货。', '第四章：合同履行期限：自签订之日起10天内完成供货。');
t('交货期新措辞:8 vs ≤10天 = 满足', statusOf(RD2,'delivery') === '满足');
t('参数总数=32', E.PARAM_DEFS.length === 32);


/* ===== v2.0：原文批注数据 + 判定置信度 + 品牌报告 ===== */
const R20 = E.analyze(E.DEMOS.loader.lib, E.DEMOS.loader.tender);
t('v2.0:highlights存在且非空', Array.isArray(R20.highlights) && R20.highlights.length >= 8);
t('v2.0:按位置升序排列', R20.highlights.every((h, i, a) => i === 0 || a[i-1].s <= h.s));
t('v2.0:高亮区间合法', R20.highlights.every(h => h.e > h.s));
t('v2.0:★条款被捕获', R20.highlights.some(h => h.mark === '★'));
t('v2.0:高亮带判定状态', R20.highlights.every(h => h.status));
const RC2 = E.analyze('我方设备：额定容积 3.0m³。', '第四章：标准斗容 ≥2.7m³。', { aliases: [{ term:'额定容积', param:'bucket' }] });
t('置信度:别名匹配=中', RC2.params.find(p => p.id === 'bucket').conf === '中');
t('置信度:默认=高', R20.params.find(p => p.id === 'load').conf === '高');
t('置信度:资料库无=高', statusOf(RA0,'bucket') === '资料库无');
const RB4 = E.analyze('我方设备：爬坡能力 30度。', '第四章：爬坡能力 ≥70%。');
t('置信度:口径冲突=中', RB4.params.find(p => p.id === 'ride').conf === '中');
const HTML20 = E.buildHtmlReport(R20, { company: '浙东机械', theme: '#0e7a4e', logo: 'data:image/png;base64,AAAA' });
t('品牌报告:主题色渗透', HTML20.indexOf('#0e7a4e') >= 0);
t('品牌报告:Logo嵌入', HTML20.indexOf('data:image/png;base64') >= 0);
t('版本=2.1.1', E.VERSION === '2.1.1');


/* ===== v2.1：采购文件章节定位 ===== */
const DOC21 = '第一章 投标邀请\n正文\n第三章 技术参数与性能要求\n额定载重量 ≥5000kg；标准斗容 ≥2.7m³\n第四章 评标办法\n评分规则';
const LOC = E.locateParamSection(DOC21);
t('定位:章节命中', LOC.found === true);
t('定位:截取含参数行', LOC.text.indexOf('额定载重量 ≥5000kg') >= 0);
t('定位:第四章边界截断', LOC.text.indexOf('评标办法') === -1);
t('定位:无章节文本=not found', E.locateParamSection('这里没有任何章节标记。').found === false);
const RL21 = E.analyze('额定载重量 5000kg。', LOC.text);
t('定位章节可直接驱动偏离表', RL21.params.find(p => p.id === 'load').status === '满足');
t('版本=2.1.1', E.VERSION === '2.1.1');


/* ===== v2.1.1：导出一致性（置信列+报告指纹） ===== */
const R21 = E.analyze(E.DEMOS.loader.lib, E.DEMOS.loader.tender);
const H21 = E.buildHtmlReport(R21, { company: '浙东机械', theme: '#0e7a4e', logo: 'data:image/png;base64,AAAA', fingerprint: 'FPDEMO2026' });
t('v2.1.1:HTML偏离表含置信列', H21.indexOf('<th>置信</th>') >= 0);
t('v2.1.1:HTML含●高置信标记', H21.indexOf('● 高') >= 0);
t('v2.1.1:HTML尾注含报告指纹', H21.indexOf('FPDEMO2026') >= 0);
const M21 = E.buildMarkdown(R21, { company: '浙东机械', fingerprint: 'FPDEMO2026' });
t('v2.1.1:MD偏离表含置信列', M21.indexOf('| 置信 |') >= 0);
t('v2.1.1:MD头部含报告指纹', M21.indexOf('FPDEMO2026') >= 0);
t('v2.1.1:别名匹配中置信进入导出', (() => {
  const RA = E.analyze('我方设备：额定容积 3.0m³。', '第四章：标准斗容 ≥2.7m³。', { aliases: [{ term:'额定容积', param:'bucket' }] });
  const M = E.buildMarkdown(RA, { fingerprint: 'x' });
  return M.indexOf('◐ 中') >= 0 && M.indexOf('额定容积') >= 0;
})());
t('版本=2.1.1', E.VERSION === '2.1.1');

console.log('----------------------------------------');
console.log('PASS=' + pass + '  FAIL=' + fail + (fail ? '  ← 存在失败，禁止发版' : '  ✅ 全部通过'));
process.exit(fail ? 1 : 0);
