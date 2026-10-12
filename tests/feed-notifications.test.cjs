const assert = require("node:assert/strict");
const test = require("node:test");
const tracker = require("./helpers/tracker.cjs");

const settle = () => new Promise(setImmediate);
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const activeFeed = () => {
  const startISO = new Date().toISOString();
  return { id: "feeding", type: "feed", side: "left", startISO, segments: [{ side: "left", startISO, endISO: null }], tags: [] };
};

function notificationService() {
  const notices = [];
  const calls = [];
  return {
    notices, calls,
    async getNotifications({ tag }) {
      return notices.filter((notice) => !notice.closed && notice.tag === tag);
    },
    async showNotification(title, options) {
      calls.push({ title, options: structuredClone(options) });
      notices.forEach((notice) => { if (notice.tag === options.tag) notice.close(); });
      notices.push({ title, tag: options.tag, data: options.data, closed: false, close() { this.closed = true; } });
    },
  };
}

test("one quiet notice per toma despite timer ticks, locking, pausing, resuming and side changes", async () => {
  const registration = notificationService();
  const { api, document, documentEvents, windowEvents, storage, nodes } = await tracker(undefined, { registration, permission: "granted" });
  api.startFeed("left");
  await api.showActiveFeedNotification();
  const feed = api.harness.getState().activeFeed;
  assert.equal(registration.calls.length, 1);
  assert.equal(registration.calls[0].options.silent, true);
  assert.equal(registration.calls[0].options.renotify, false);
  assert.equal(registration.calls[0].options.actions[0].action, "finish-feed");
  assert.match(registration.calls[0].options.body, /^Empezó /);
  assert.ok(JSON.parse(storage.get("fede-baby-tracker-v3")).activeFeed.notificationSentISO);
  api.harness.getState().settings.medicines.forEach((medicine) => { medicine.reminder = false; });
  feed.segments[0].startISO = new Date(Date.now() - 45 * 60000).toISOString();
  for (let tick = 0; tick < 120; tick++) api.tick();
  assert.match(nodes.get("#activeFeedTimer").textContent, /^45:/);
  for (let lock = 0; lock < 5; lock++) {
    document.hidden = true;
    documentEvents.get("visibilitychange")();
    windowEvents.get("pagehide")();
    document.hidden = false;
    documentEvents.get("visibilitychange")();
    api.pauseFeed();
    api.resumeFeed();
    api.switchFeedSide(lock % 2 ? "left" : "right");
  }
  await settle();
  assert.equal(registration.calls.length, 1);
});

test("reopening or dismissing a notice does not create another for the same toma", async () => {
  const registration = notificationService();
  const initial = await tracker({ activeFeed: activeFeed() }, { registration, permission: "granted" });
  await initial.api.showActiveFeedNotification();
  registration.notices[0].close();
  const saved = JSON.parse(initial.storage.get("fede-baby-tracker-v3"));
  const reopened = await tracker(saved, { registration, permission: "granted" });
  await reopened.api.showActiveFeedNotification();
  assert.equal(registration.calls.length, 1);
});

test("an existing notice from the previous version is adopted without reposting", async () => {
  const registration = notificationService();
  const feed = activeFeed();
  await registration.showNotification("Toma en curso · 3 min", { tag: "fede-active-feed", data: { feedId: feed.id } });
  const { api } = await tracker({ activeFeed: feed }, { registration, permission: "granted" });
  await api.showActiveFeedNotification();
  assert.equal(registration.calls.length, 1);
  assert.ok(api.harness.getState().activeFeed.notificationSentISO);
});

test("overlapping lifecycle events share a single delivery while the service worker loads", async () => {
  const ready = deferred();
  const registration = notificationService();
  const { api } = await tracker({ activeFeed: activeFeed() }, { ready: ready.promise, permission: "granted" });
  const deliveries = [api.showActiveFeedNotification(), api.showActiveFeedNotification(), api.showActiveFeedNotification()];
  ready.resolve(registration);
  await Promise.all(deliveries);
  assert.equal(registration.calls.length, 1);
});

test("finishing before the service worker loads does not post a stale notice", async () => {
  const ready = deferred();
  const registration = notificationService();
  const { api } = await tracker({ activeFeed: activeFeed() }, { ready: ready.promise, permission: "granted" });
  const delivery = api.showActiveFeedNotification();
  api.stopFeed();
  ready.resolve(registration);
  await delivery;
  assert.equal(registration.calls.length, 0);
  assert.equal(api.harness.getState().events.length, 1);
});

test("a slow old delivery cannot overwrite the next toma's notification", async () => {
  const registration = notificationService();
  const gate = deferred();
  const show = registration.showNotification.bind(registration);
  let deliveries = 0;
  registration.showNotification = async (title, options) => {
    if (++deliveries === 1) await gate.promise;
    await show(title, options);
  };
  const { api } = await tracker({ activeFeed: activeFeed() }, { registration, permission: "granted" });
  const oldDelivery = api.showActiveFeedNotification();
  await settle();
  api.stopFeed();
  api.startFeed("right");
  const nextId = api.harness.getState().activeFeed.id;
  const nextDelivery = api.showActiveFeedNotification();
  gate.resolve();
  await Promise.all([oldDelivery, nextDelivery]);
  const visible = await registration.getNotifications({ tag: "fede-active-feed" });
  assert.equal(visible.length, 1);
  assert.equal(visible[0].data.feedId, nextId);
});

test("unsupported notification actions fall back once and retain the quiet options", async () => {
  const registration = notificationService();
  const show = registration.showNotification.bind(registration);
  let attempts = 0;
  registration.showNotification = async (title, options) => {
    attempts++;
    if (options.actions) throw new TypeError("Actions unavailable");
    await show(title, options);
  };
  const { api } = await tracker({ activeFeed: activeFeed() }, { registration, permission: "granted" });
  await api.showActiveFeedNotification();
  await api.showActiveFeedNotification();
  assert.equal(attempts, 2);
  assert.equal(registration.calls.length, 1);
  assert.equal(registration.calls[0].options.silent, true);
  assert.equal(registration.calls[0].options.renotify, false);
});

test("saving closes the notice, removes delivery metadata, and the next toma gets its own notice", async () => {
  const registration = notificationService();
  const { api } = await tracker({ activeFeed: activeFeed() }, { registration, permission: "granted" });
  await api.showActiveFeedNotification();
  api.stopFeed();
  await settle();
  assert.equal((await registration.getNotifications({ tag: "fede-active-feed" })).length, 0);
  assert.equal(api.harness.getState().events[0].notificationSentISO, undefined);
  api.startFeed("right");
  await api.showActiveFeedNotification();
  assert.equal(registration.calls.length, 2);
});

test("medicine reminders still fire once independently of the quiet feeding notice", async () => {
  const registration = notificationService();
  const { api, directNotifications } = await tracker({ settings: { medicines: [{ id: "test-med", name: "Test", dose: "Prescription", time: "00:00", reminder: true }] } }, { registration, permission: "granted" });
  api.startFeed("left");
  await api.showActiveFeedNotification();
  api.tick();
  api.tick();
  assert.equal(directNotifications.length, 1);
  assert.match(directNotifications[0].options.tag, /^fede-medicine-test-med-/);
  assert.equal(registration.calls.length, 1);
});
