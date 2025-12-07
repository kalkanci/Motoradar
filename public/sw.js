/*
 * Basit bir servis çalışanı (service worker) uygulaması.
 * Bu dosya, uygulamanın çevrimdışı olarak da açılabilmesi için temel sayfa ve varlıkları önbelleğe alır.
 */

const CACHE_NAME = 'radar-app-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/sw.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  // Kurulum aşamasında önbelleğe almak istediğimiz dosyaları ekleyelim
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Eski önbellekleri temizle
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ağ isteklerini yakala ve önbellekten cevap ver
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((res) => {
        // Dinamik olarak alınan yanıtları önbelleğe koymaya çalış
        const clone = res.clone();
        if (event.request.method === 'GET' && res.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return res;
      }).catch(() => {
        // Çevrimdışı durumda istenilen içerik bulunamazsa basit bir geri dönüş yap
        return caches.match('/');
      });
    })
  );
});