/* 标书快反 BidPilot · Service Worker
 * 策略：
 *   - 页面导航 / index.html：网络优先（保证更新及时到达），失败回退缓存（离线可用）
 *   - 其余同源静态资源：缓存优先（版本号内嵌于缓存名，升级即换新）
 * 版本号变更即触发旧缓存清理
 */
const CACHE = 'bidpilot-v5';
const ASSETS = [
  './',
  './index.html',
  './engine.js',
  './cases.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './pdfjs/pdf.min.js',
  './pdfjs/pdf.worker.min.js',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  // 统一网络优先：有网拿最新（保证更新及时到达），断网回退缓存（离线可用）
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, cp));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')))
  );
});
