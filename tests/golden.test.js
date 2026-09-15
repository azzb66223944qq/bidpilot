/* 标书快反 · 黄金快照测试（面级回归）
 * 用法：node tests/golden.test.js            → 比对6组黄金样本
 *       node tests/golden.test.js --update   → 重新生成黄金快照（改动引擎后主动更新）
 * 原理：固定输入 → 完整输出的稳定投影（剔除时间戳），与golden.json深度比对
 */
const E = require('../engine.js');
const fs = require('fs');
const path = require('path');
const GOLDEN = path.join(__dirname, 'golden.json');

function snapshot(lib, tender, opts) {
  const R = E.analyze(lib, tender, opts);
  return {
    meta: {
      priceLimit: R.meta.priceLimit, deposit: R.meta.deposit, decryptMin: R.meta.decryptMin,
      bidDeadline: R.meta.bidDeadline, consortium: R.meta.consortium, postQual: R.meta.postQual
    },
    score: R.conclusion.score, grade: R.conclusion.grade, verdict: R.conclusion.verdict,
    params: R.params.map(p => ({ id: p.id, status: p.status, conf: p.conf, mark: p.mark || null })),
    quals: R.quals.map(q => q.result),
    counts: R.conclusion.counts,
    timelineNodes: R.timeline.items.length
  };
}

const CASES = [
  ['loader', E.DEMOS.loader.lib, E.DEMOS.loader.tender, undefined],
  ['excavator', E.DEMOS.excavator.lib, E.DEMOS.excavator.tender, undefined],
  ['crane', E.DEMOS.crane.lib, E.DEMOS.crane.tender, undefined],
  ['pump', E.DEMOS.pump.lib, E.DEMOS.pump.tender, undefined],
  ['weights-pump', E.DEMOS.pump.lib, E.DEMOS.pump.tender, { weights: { minus: 5, missing: 2, pending: 2, cert: 1 } }],
  ['alias-bucket', '我方设备：额定容积 3.0m³。', '第四章：标准斗容 ≥2.7m³。', { aliases: [{ term: '额定容积', param: 'bucket' }] }]
];

if (process.argv.includes('--update')) {
  const golden = {};
  CASES.forEach(([name, lib, tender, opts]) => { golden[name] = snapshot(lib, tender, opts); });
  fs.writeFileSync(GOLDEN, JSON.stringify(golden, null, 2));
  console.log('✅ 黄金快照已更新:', GOLDEN);
  process.exit(0);
}

const golden = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
let fail = 0;
CASES.forEach(([name, lib, tender, opts]) => {
  const now = JSON.stringify(snapshot(lib, tender, opts));
  const base = JSON.stringify(golden[name], null, 0);
  if (now !== base) { console.log('❌ 快照不一致:', name); fail++; }
  else console.log('✅ 快照一致:', name);
});
console.log(fail ? '❌ ' + fail + ' 组快照漂移——检查是否为预期变更（是则 --update 刷新）' : '✅ 全部快照一致');
process.exit(fail ? 1 : 0);
