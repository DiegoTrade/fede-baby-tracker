const CACHE_NAME = "mateo-baby-tracker-v1";
const ACTIVE_FEED_NOTIFICATION_TAG = "mateo-active-feed";
const ACTIVE_FEED_FINISH_ACTION = "finish-feed";
const PENDING_DB_NAME = "mateo-baby-tracker-pending-actions";
const PENDING_DB_VERSION = 1;
const PENDING_STORE = "actions";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=1",
  "./app.js?v=1",
  "./historical-data.js?v=1",
  "./app-icon.png",
  "./app-icon-512.png",
  "./app-icon-192.png",
  "./apple-touch-icon.png",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener("notificationclick", (event) => {
  if (event.notification.tag !== ACTIVE_FEED_NOTIFICATION_TAG) return;
  event.notification.close();

  const action = event.action === ACTIVE_FEED_FINISH_ACTION ? ACTIVE_FEED_FINISH_ACTION : "open";
  const target = new URL("./index.html", self.location.href);
  target.searchParams.set("from", "feed-notification");
  target.searchParams.set("feedAction", action);
  if (action === ACTIVE_FEED_FINISH_ACTION) target.searchParams.set("finishFeed", "1");

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      const endISO = new Date().toISOString();
      if (action === ACTIVE_FEED_FINISH_ACTION) {
        try {
          await queuePendingAction({
            id: `${ACTIVE_FEED_FINISH_ACTION}-${Date.now()}`,
            type: ACTIVE_FEED_FINISH_ACTION,
            feedId: event.notification.data?.feedId || "",
            endISO,
            createdISO: endISO,
          });
        } catch {
          // The app will still receive the message if it is alive; persistence is best-effort.
        }
      }
      const appClient = clientList.find((client) => new URL(client.url).origin === self.location.origin);
      if (appClient) {
        appClient.postMessage({ type: "feed-notification-click", action, endISO });
        if (action === ACTIVE_FEED_FINISH_ACTION) return undefined;
        if ("focus" in appClient) return appClient.focus();
      }
      if (action === ACTIVE_FEED_FINISH_ACTION) return undefined;
      if (clients.openWindow) return clients.openWindow(target.href);
      return undefined;
    })
  );
});

function openPendingDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PENDING_DB_NAME, PENDING_DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PENDING_STORE)) {
        request.result.createObjectStore(PENDING_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queuePendingAction(action) {
  const db = await openPendingDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(PENDING_STORE, "readwrite");
    transaction.objectStore(PENDING_STORE).put(action);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}
