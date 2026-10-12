const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const tracker = require("./helpers/tracker.cjs");

const iso = (local) => new Date(local).toISOString();
const overnight = { id: "overnight", type: "nap", startISO: iso("2026-10-11T23:40:00"), endISO: iso("2026-10-12T00:30:00"), note: "" };

test("ongoing nap survives reload and is independent of an ongoing feed", async () => {
  const feed = { id: "feed", type: "feed", startISO: new Date().toISOString(), side: "left", segments: [], tags: [] };
  const { api, storage } = await tracker({ activeFeed: feed });
  api.startNap();
  const started = api.harness.getState().activeNap;
  api.startNap();
  assert.equal(api.harness.getState().activeNap.id, started.id);
  assert.equal(api.harness.getState().activeFeed.id, "feed");
  const reloaded = await tracker(JSON.parse(storage.get("fede-baby-tracker-v3")));
  assert.equal(reloaded.api.harness.getState().activeNap.id, started.id);
  assert.equal(reloaded.nodes.get("#napTimer").hidden, false);
});

test("saving and undoing wake-up restores the original timer without duplicate records", async () => {
  const { api } = await tracker();
  api.startNap();
  const id = api.harness.getState().activeNap.id;
  api.stopNap();
  api.stopNap();
  assert.equal(api.harness.getState().events.length, 1);
  assert.equal(api.harness.getState().activeNap, null);
  api.harness.undo();
  assert.equal(api.harness.getState().events.length, 0);
  assert.equal(api.harness.getState().activeNap.id, id);
});

test("cancelling a nap can be undone", async () => {
  const { api } = await tracker();
  api.startNap();
  const id = api.harness.getState().activeNap.id;
  api.cancelNap();
  assert.equal(api.harness.getState().activeNap, null);
  api.harness.undo();
  assert.equal(api.harness.getState().activeNap.id, id);
  assert.equal(api.harness.getState().events.length, 0);
});

test("overnight naps appear on both days and daily durations do not double count", async () => {
  const { api } = await tracker({ events: [overnight] });
  assert.equal(api.napDurationMs(overnight), 50 * 60000);
  assert.equal(api.napStatsForDate("2026-10-11", false).durationMs, 20 * 60000);
  assert.equal(api.napStatsForDate("2026-10-12", false).durationMs, 30 * 60000);
  assert.equal(api.eventsForDate("2026-10-12").length, 1);
  assert.equal(api.groupEventsByDate().length, 2);
  assert.match(api.exportMarkdown(), /Siestas · 20 min/);
  assert.match(api.exportMarkdown(), /Siestas · 30 min/);
});

test("ending exactly at midnight creates no extra nap on the next day", async () => {
  const { api } = await tracker({ events: [{ ...overnight, endISO: iso("2026-10-12T00:00:00") }] });
  assert.equal(api.eventsForDate("2026-10-12").length, 0);
  assert.equal(api.groupEventsByDate().length, 1);
});

test("daily sleep totals use elapsed time across the daylight-saving clock change", async () => {
  const nap = { ...overnight, startISO: iso("2026-10-25T00:30:00"), endISO: iso("2026-10-25T03:30:00") };
  const { api } = await tracker({ events: [nap] });
  const elapsed = Date.parse(nap.endISO) - Date.parse(nap.startISO);
  assert.equal(api.napOverlapMs(nap, "2026-10-25"), elapsed);
  assert.equal(api.napStatsForDate("2026-10-25", false).durationMs, elapsed);
});

test("invalid nap times are rejected and short naps are never inflated to a minute", async () => {
  const { api } = await tracker();
  assert.ok(api.napFormError(new Date(NaN), new Date()));
  assert.ok(api.napFormError(new Date(), new Date(0)));
  assert.ok(api.napFormError(new Date(), new Date(Date.now() + 3600000)));
  assert.equal(api.napFormError(new Date(Date.now() - 120000), new Date(Date.now() - 60000)), "");
  assert.equal(api.formatDuration(12000), "<1 min");
});

test("backups include completed naps and do not resurrect a running timer", async () => {
  const { api } = await tracker({ events: [overnight] });
  api.startNap();
  const backup = api.backupPayload();
  assert.equal(backup.state.events[0].type, "nap");
  assert.equal(backup.state.activeNap, null);
  assert.equal(api.normalizeState(backup.state).events[0].id, "overnight");
  assert.equal(api.normalizeState({ events: [] }).activeNap, null);
});

test("Federico's update preserves Mateo's offline cache", async () => {
  const handlers = new Map();
  const deleted = [];
  let activation;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8"), {
    self: { addEventListener: (name, handler) => handlers.set(name, handler), clients: { claim() {} } },
    caches: { keys: async () => ["fede-baby-tracker-v65", "fede-baby-tracker-v66", "fede-baby-tracker-v67", "mateo-baby-tracker-v1"], delete: async (key) => deleted.push(key) },
  });
  handlers.get("activate")({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ["fede-baby-tracker-v65", "fede-baby-tracker-v66"]);
});
