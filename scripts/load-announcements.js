/**
 * 产品端公告加载模块（v3.5 · 路线A 客户端订阅）
 * 从 data/announcements.json 读取实时公告 + 按客户订阅（品类/关键词）过滤
 * 零服务器：fetch 相对路径即可（GitHub Pages 部署后自动工作）
 * 降级：JSON 不存在时静默隐藏实时区，不影响手动粘贴功能
 */
(function(){
  'use strict';

  /* 订阅可选品类（chips 展示；与采集端 MACHINERY_KWS 对齐的高频项） */
  var SUB_CATS = ['装载机','挖掘机','起重机','泵车','压路机','洒水车','推土机','叉车','高空作业','盾构','摊铺','旋挖'];
  var SUBS_KEY = 'bidpilot_feed_subs';

  function getSubs(){
    try {
      var d = JSON.parse(localStorage.getItem(SUBS_KEY) || 'null');
      if (d && Array.isArray(d.cats)) return { cats: d.cats, kw: String(d.kw || '') };
    } catch(e){}
    return { cats: [], kw: '' };
  }
  function setSubs(s){ localStorage.setItem(SUBS_KEY, JSON.stringify(s)); }

  /* 过滤：默认只看工程机械相关；品类多选（空=全部）；关键词空格/逗号分多个（任一命中） */
  function filterFeed(announcements, subs){
    var kws = subs.kw.split(/[\s,，、]+/).map(function(k){ return k.trim(); }).filter(Boolean);
    return announcements.filter(function(a){
      if (!a.isMachinery) return false;
      if (subs.cats.length && subs.cats.indexOf(a.category) === -1) return false;
      if (kws.length){
        var hit = kws.some(function(k){ return a.title.indexOf(k) !== -1; });
        if (!hit) return false;
      }
      return true;
    });
  }

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function loadAnnouncements(){
    fetch('data/announcements.json?v=2')
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(data){
        if (!data || !data.announcements || !data.announcements.length) return;
        window.__bpFeedData = data; // 供订阅交互重渲
        renderAnnouncementFeed(data);
      })
      .catch(function(){ /* JSON 不存在时静默忽略 */ });
  }

  function kindPill(kind){
    var map = {
      '招标公告': 'background:rgba(240,160,48,.12);color:var(--acc2)',
      '磋商公告': 'background:rgba(240,160,48,.12);color:var(--acc2)',
      '更正公告': 'background:rgba(240,176,64,.12);color:var(--warn)',
      '中标公告': 'background:rgba(255,255,255,.06);color:var(--sub)',
      '成交公告': 'background:rgba(255,255,255,.06);color:var(--sub)'
    };
    return '<span style="font-size:10px;padding:1px 7px;border-radius:8px;font-weight:600;flex-shrink:0;' +
      (map[kind] || 'background:rgba(255,255,255,.06);color:var(--sub)') + '">' + esc(kind || '公告') + '</span>';
  }

  function renderAnnouncementFeed(data, subsOverride){
    var wrap = document.getElementById('realtimeFeed');
    if (!wrap) return;
    var subs = subsOverride || getSubs();
    var machinery = data.announcements.filter(function(a){ return a.isMachinery; });
    var hits = filterFeed(data.announcements, subs);

    var fetchedDate = data.fetchedAt ? data.fetchedAt.slice(0, 10) : '';
    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px">' +
      '<h3 style="font-size:14px;font-weight:700;color:var(--txt);margin:0">📡 实时公告 <span style="font-size:11px;color:var(--faint);font-weight:400">· 更新于 ' + fetchedDate + ' · ccgp 中央+地方</span></h3>' +
      '<span style="font-size:11px;color:var(--acc2)">命中订阅 <b>' + hits.length + '</b> 条 · 机械相关 ' + machinery.length + ' / 共 ' + data.total + '</span></div>';

    /* ── 订阅设置行 ── */
    html += '<div style="border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:10px;background:var(--panel-2)">';
    html += '<div style="font-size:11px;color:var(--faint);margin-bottom:7px">🔔 我的订阅 — 勾选品类、填关键词，公告清单只给你看命中项（保存在本机）</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center">';
    html += '<button class="demo-chip' + (subs.cats.length ? '' : ' on') + '" data-subcat="" style="padding:3px 11px;font-size:11px">全部</button>';
    SUB_CATS.forEach(function(c){
      var on = subs.cats.indexOf(c) !== -1;
      html += '<button class="demo-chip' + (on ? ' on' : '') + '" data-subcat="' + esc(c) + '" style="padding:3px 11px;font-size:11px">' + esc(c) + '</button>';
    });
    html += '</div>';
    html += '<div style="display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap">';
    html += '<input id="feedKw" value="' + esc(subs.kw) + '" placeholder="关键词，空格分隔多个（如：水务 环卫）" style="flex:1;min-width:160px;background:var(--card);border:1px solid var(--line);border-radius:9px;color:var(--txt);padding:6px 10px;font-size:12px">';
    html += '<button class="tb-btn" id="feedKwClear" style="font-size:11px;padding:5px 11px">清空订阅</button>';
    html += '</div></div>';

    /* ── 公告列表（过滤后） ── */
    var noSubs = !subs.cats.length && !subs.kw.trim();
    html += '<div style="max-height:280px;overflow-y:auto">';
    if (!hits.length && !noSubs){
      html += '<div style="font-size:12px;color:var(--faint);text-align:center;padding:22px 0">没有命中订阅的公告 — 放宽品类/关键词，或等下一轮采集（每 2 小时）。</div>';
    } else {
      var list = hits.length ? hits.slice(0, 30) : data.announcements.slice(0, 10);
      if (!hits.length){
        html += '<div style="font-size:11px;color:var(--warn);padding:4px 0 8px">今日暂无工程机械相关命中 — 以下为最新全量公告（中央/地方 · 招标/磋商/更正/中标/成交）供参考：</div>';
      }
      list.forEach(function(a){
        var date = a.pubDate || '';
        html += '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px">' +
          kindPill(a.sourceKind) +
          '<span style="font-size:10px;padding:1px 7px;border-radius:8px;font-weight:600;background:rgba(240,160,48,.1);color:var(--acc2);flex-shrink:0">' + esc(a.category || '机械') + '</span>' +
          '<a href="' + a.url + '" target="_blank" rel="noopener" style="color:var(--txt);text-decoration:none;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(a.title) + '">' + esc(a.title.slice(0, 52)) + '</a>' +
          '<span style="font-size:10.5px;color:var(--faint);flex-shrink:0">' + date + '</span>' +
          '</div>';
      });
      if (hits.length > 30) html += '<div style="font-size:10.5px;color:var(--faint);padding:8px 0;text-align:center">仅显示前 30 条 · 共命中 ' + hits.length + ' 条</div>';
    }
    html += '</div>';

    if (data.errors && data.errors.length){
      html += '<div style="font-size:10.5px;color:var(--faint);margin-top:8px">⚠ ' + data.errors.length + ' 个来源本轮暂不可用（下轮自动重试）</div>';
    }

    wrap.innerHTML = html;
    wrap.style.display = '';

    /* 侧栏徽章 = 命中订阅数 */
    try {
      var nb = document.getElementById('navRadarCnt');
      if (nb && hits.length){ nb.textContent = hits.length; nb.style.display = ''; }
    } catch(e){}

    /* ── 订阅交互 ── */
    wrap.querySelectorAll('[data-subcat]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var c = btn.getAttribute('data-subcat');
        var s = getSubs();
        if (!c){ s.cats = []; }
        else {
          var i = s.cats.indexOf(c);
          if (i === -1) s.cats.push(c); else s.cats.splice(i, 1);
        }
        setSubs(s);
        renderAnnouncementFeed(data, s);
      });
    });
    var kwInput = wrap.querySelector('#feedKw');
    if (kwInput){
      var timer = null;
      kwInput.addEventListener('input', function(){
        clearTimeout(timer);
        timer = setTimeout(function(){
          var s = getSubs(); s.kw = kwInput.value; setSubs(s);
          renderAnnouncementFeed(data, s);
          var again = wrap.querySelector('#feedKw');
          if (again){ again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
        }, 400);
      });
    }
    var clearBtn = wrap.querySelector('#feedKwClear');
    if (clearBtn) clearBtn.addEventListener('click', function(){ setSubs({ cats: [], kw: '' }); renderAnnouncementFeed(data, { cats: [], kw: '' }); });
  }

  // DOM ready 后加载
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadAnnouncements);
  } else {
    loadAnnouncements();
  }
})();
