const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "../../app.js"), "utf8");

module.exports = async function tracker(saved, options = {}) {
  const nodes = new Map();
  const storage = new Map();
  const documentEvents = new Map();
  const windowEvents = new Map();
  const directNotifications = [];
  if (saved) storage.set("fede-baby-tracker-v3", JSON.stringify(saved));
  const element = () => ({
    value: "", textContent: "", innerHTML: "", hidden: false, dataset: {},
    classList: { toggle() {}, add() {}, remove() {} },
    addEventListener() {}, setAttribute() {}, append() {}, focus() {},
    showModal() { this.open = true; }, close() { this.open = false; },
  });
  const document = {
    body: element(), hidden: false,
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, element());
      return nodes.get(selector);
    },
    querySelectorAll: () => [],
    createElement: element,
    addEventListener: (name, handler) => documentEvents.set(name, handler),
  };
  const navigator = options.registration || options.ready ? {
    serviceWorker: {
      ready: options.ready || Promise.resolve(options.registration),
      register: async () => ({ update() {} }),
      addEventListener() {},
    },
  } : {};
  const window = {
    navigator, location: { href: "http://localhost/" },
    addEventListener: (name, handler) => windowEvents.set(name, handler),
    setTimeout() {}, clearTimeout() {}, requestAnimationFrame() {},
    matchMedia: () => ({ matches: true }),
    isSecureContext: true,
  };
  const context = vm.createContext({
    document, navigator, window, structuredClone, URL, Intl,
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    setInterval() {},
  });
  if (options.permission) {
    class Notification {
      static permission = options.permission;
      constructor(title, notificationOptions) {
        this.close = () => {};
        directNotifications.push({ title, options: structuredClone(notificationOptions) });
      }
    }
    context.Notification = window.Notification = Notification;
  }
  const module = new vm.SourceTextModule(`${appSource}
    export { napDurationMs, napOverlapMs, napStatsForDate, napFormError, formatDuration,
      startNap, stopNap, cancelNap, eventsForDate, groupEventsByDate, exportMarkdown,
      backupPayload, normalizeState, historySummary, startFeed, stopFeed, cancelFeed,
      pauseFeed, resumeFeed, switchFeedSide, tick, showActiveFeedNotification,
      closeActiveFeedNotifications };
    export const harness = { getState: () => state, undo: () => pendingUndo?.() };
  `, { context });
  await module.link(() => new vm.SyntheticModule(["HISTORICAL_IMPORT"], function () {
    this.setExport("HISTORICAL_IMPORT", { events: [], version: "test", source: "Test", summary: { feed: 0, diaper: 0, weight: 0 } });
  }, { context }));
  await module.evaluate();
  return { api: module.namespace, nodes, storage, document, documentEvents, windowEvents, directNotifications };
};
