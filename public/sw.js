// public/sw.js
importScripts('/idb.js');

async function syncStories() {
  const db = await idb.openDB('cerita-db', 1);
  const allPending = await db.getAll('pending-stories');

  for (const story of allPending) {
    try {
      const formData = new FormData();
      formData.append("description", story.description || "");
      if (story.lat) formData.append("lat", story.lat);
      if (story.lon) formData.append("lon", story.lon);

      if (story.photoBuffer) {
        const blob = new Blob([story.photoBuffer], { type: story.photoType || "image/jpeg" });
        formData.append("photo", blob, "photo.jpg");
      }

      await fetch("https://story-api.dicoding.dev/v1/stories", {
        method: "POST",
        headers: { "Authorization": "Bearer " + (story.token || "") },
        body: formData,
      });

      await db.delete('pending-stories', story.id);
      console.log("✅ Synced story:", story.id);
    } catch (err) {
      console.error("❌ Gagal sync story:", story.id, err);
    }
  }
}

// ====== Cache Names ======
const CACHE_NAME = 'cerita-static-v2';
const API_CACHE = 'cerita-api-v2';

// ====== App Shell yang di-cache ======
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-72.png',
  '/fallback.png'   // fallback image
];

// ====== Install Event ======
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(STATIC_ASSETS))
      .catch((err) => console.error("❌ Cache gagal saat install:", err))
  );
  self.skipWaiting();
});

// ====== Activate Event ======
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ====== Fetch Handler ======
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API caching
  if (url.origin.includes('story-api.dicoding.dev')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const fresh = await fetch(event.request);
          cache.put(event.request, fresh.clone());
          return fresh;
        } catch {
          return cache.match(event.request);
        }
      })
    );
    return;
  }

  // Static & SPA fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) =>
          caches.open(CACHE_NAME).then((cache) => {
            if (event.request.url.match(/\.(js|css)$/)) {
              cache.put(event.request, res.clone());
            }
            return res;
          })
        )
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/index.html'); // SPA fallback
          }
          if (event.request.destination === 'image') {
            return caches.match('/fallback.png'); // image fallback
          }
        });
    })
  );
});

// ====== Push Notification ======
self.addEventListener("push", (event) => {
  console.log("📩 Push diterima:", event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.warn("⚠️ Data push bukan JSON:", event.data.text());
    }
  }

  const title = data.title || "Notifikasi Baru!";
  const options = data.options || {
    body: "Anda mendapat update cerita baru.",
    icon: "/icon-192.png",
    badge: "/icon-72.png",
    data: { url: "/" },
    actions: [
      { action: "open", title: "Lihat Detail" },
      { action: "close", title: "Tutup" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ====== Background Sync ======
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-new-story") {
    event.waitUntil(syncStories());
  }
});
