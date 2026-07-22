/**
 * Fitness Tracker — Service Worker
 * 策略：
 *  - 靜態資源 (HTML/CSS/JS/icons): cache-first，加速並支援離線
 *  - 跨網域 (Google Apps Script): 不快取，必須走網路
 *  - 版本更新時刪除舊快取
 */

const CACHE_VERSION = "ft-v2.5.0";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./anatomy.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  // 只攔截 GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 跨來源（Apps Script、Google 任何 API）一律走網路
  if (url.origin !== self.location.origin) return;

  // 同來源：cache-first，失敗回退網路
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // 背景重新驗證
        fetch(req).then(res => {
          if (res && res.ok) {
            caches.open(CACHE_VERSION).then(cache => cache.put(req, res.clone()));
          }
        }).catch(() => { /* offline */ });
        return cached;
      }
      return fetch(req).then(res => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // 離線 + 沒快取 → 嘗試回退到首頁 (SPA-like)
        if (req.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});

// 接收主執行緒的訊息（例如要求強制更新）
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
