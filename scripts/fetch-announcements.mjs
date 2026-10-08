#!/usr/bin/env node
/**
 * 公告采集脚本 — GitHub Actions 定时执行（路线A · 集中采集）
 * 来源：ccgp.gov.cn 中央/地方公告列表页（公开信息）
 *   - dfgg（地方公告）= 全国各省市通过政采平台发布的公告汇聚，一个源覆盖全国
 *   - v3.5 修正：旧 jztcg/zgyjgg 路径已 404，替换为现行分类结构
 * 输出：data/announcements.json（结构化公告列表，含 sourceKind/sourceScope 供客户端订阅过滤）
 * 原则：只抓公开标题与链接，不做登录、不绕验证、不二次分发全文；页间 2s 限速
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'data');
const OUT_FILE = join(OUT_DIR, 'announcements.json');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DELAY = 2000; // 页面间 2s 间隔，克制抓取

/* 工程机械品类关键词（与 engine.js DEVICE_CATS 对齐） */
const MACHINERY_KWS = [
  '装载机','挖掘机','起重机','泵车','压路机','洒水车','推土机','叉车',
  '高空作业','盾构','摊铺','凿岩','履带','工程机械','旋挖','预应力',
  '特种设备','施工升降','塔式起重','汽车起重'
];

/* 来源适配器（v3.5 · 2026-10-08 实测全部 200）
 * scope: 中央/地方 · kind: 公告性质（客户端订阅维度） */
const SOURCES = [
  { name: '中央·公开招标', path: 'zygg/gkzb/index.htm', scope: '中央', kind: '招标公告' },
  { name: '中央·竞争性磋商', path: 'zygg/jzxcs/index.htm', scope: '中央', kind: '磋商公告' },
  { name: '地方·公开招标', path: 'dfgg/gkzb/index.htm', scope: '地方', kind: '招标公告' },
  { name: '地方·公开招标第2页', path: 'dfgg/gkzb/index_1.htm', scope: '地方', kind: '招标公告' },
  { name: '地方·更正公告', path: 'dfgg/gzgg/index.htm', scope: '地方', kind: '更正公告' },
  { name: '地方·中标公告', path: 'dfgg/zbgg/index.htm', scope: '地方', kind: '中标公告' },
  { name: '地方·成交公告', path: 'dfgg/cjgg/index.htm', scope: '地方', kind: '成交公告' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'text/html' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries) throw err;
      await sleep(3000 * (i + 1)); // 指数退避重试
    }
  }
}

function extractAnnouncements(html, baseUrl, src) {
  const items = [];
  // ccgp 列表页链接格式：<a href="./YYYYMM/tYYYYMMDD_ID.htm">标题</a>
  const linkRe = /href="(\.\/\d{6}\/t\d{8}_\d+\.htm)"[^>]*>([^<]{12,120})<\/a>/g;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const url = new URL(m[1], baseUrl).href;
    const title = m[2].trim();
    // 日期从 URL 提取：t20260930 → 2026-09-30
    const dateM = m[1].match(/t(\d{4})(\d{2})(\d{2})_/);
    const pubDate = dateM ? `${dateM[1]}-${dateM[2]}-${dateM[3]}` : '';
    const matchedKw = MACHINERY_KWS.find(kw => title.includes(kw));
    items.push({
      title, url, pubDate,
      source: src.name,
      sourceScope: src.scope,
      sourceKind: src.kind,
      category: matchedKw || null,
      isMachinery: !!matchedKw,
    });
  }
  return items;
}

async function main() {
  console.log('🛠 开始采集政府采购公告（ccgp 中央+地方）…');
  const all = [];
  const errors = [];
  const perSource = [];

  for (const src of SOURCES) {
    const url = `http://www.ccgp.gov.cn/cggg/${src.path}`;
    const base = url.replace(/[^/]*$/, '');
    try {
      const html = await fetchPage(url);
      const items = extractAnnouncements(html, base, src);
      perSource.push({ source: src.name, count: items.length, machinery: items.filter(i => i.isMachinery).length });
      console.log(`  ✓ ${src.name}: ${items.length} 条（机械相关 ${items.filter(i => i.isMachinery).length}）`);
      all.push(...items);
    } catch (err) {
      console.warn(`  ✗ ${src.name}: ${err.message}`);
      errors.push({ source: src.name, error: err.message });
    }
    await sleep(DELAY);
  }

  // 去重（按 URL；index.htm 与 index_1.htm 首条可能重叠）
  const seen = new Set();
  const unique = all.filter(a => { if (seen.has(a.url)) return false; seen.add(a.url); return true; });
  unique.sort((a, b) => b.pubDate.localeCompare(a.pubDate));

  // 读取旧数据（增量合并，保留最近 7 天）
  let previous = [];
  if (existsSync(OUT_FILE)) {
    try {
      const old = JSON.parse(readFileSync(OUT_FILE, 'utf-8'));
      const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      previous = (old.announcements || []).filter(a => a.pubDate >= cutoff);
    } catch (e) { /* 忽略旧数据解析失败 */ }
  }

  const allSeen = new Set();
  const merged = [...unique, ...previous].filter(a => {
    if (allSeen.has(a.url)) return false; allSeen.add(a.url); return true;
  });

  const machineryCount = merged.filter(a => a.isMachinery).length;

  const output = {
    fetchedAt: new Date().toISOString(),
    source: 'ccgp.gov.cn 中央+地方',
    total: merged.length,
    machinery: machineryCount,
    perSource,
    errors: errors.length ? errors : undefined,
    announcements: merged,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ 采集完成: ${merged.length} 条公告（工程机械相关 ${machineryCount} 条）→ ${OUT_FILE}`);
  if (machineryCount > 0) {
    console.log('\n工程机械相关公告：');
    merged.filter(a => a.isMachinery).slice(0, 5).forEach(a => {
      console.log(`  [${a.pubDate}] ${a.title.slice(0, 60)} (${a.category})`);
    });
  }
}

main().catch(err => {
  console.error('❌ 采集失败:', err.message);
  process.exit(1);
});
