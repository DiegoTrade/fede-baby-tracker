import { HISTORICAL_IMPORT } from "./historical-data.js?v=23";

const STORAGE_KEY = "fede-baby-tracker-v3";

const SIDE_LABELS = {
  left: "Izquierda",
  right: "Derecha",
  both: "Ambas",
  pump: "Extracción",
  snack: "Snack",
};

const SIDE_EXPORT = {
  left: "IZQUIERDA",
  right: "DERECHA",
  both: "AMBAS",
  pump: "EXTRACCIÓN",
  snack: "SNACK",
};

const SIDE_SHORT = {
  left: "←",
  right: "→",
  both: "↔",
  pump: "⇣",
  snack: "•",
};

const DIAPER_PRESETS = {
  pee: { pee: true, poop: false, gas: false, label: "Pis", icon: "💧" },
  poop: { pee: false, poop: true, gas: false, label: "Popó", icon: "💩" },
  mixed: { pee: true, poop: true, gas: false, label: "Mixto", icon: "💧💩" },
  gas: { pee: false, poop: false, gas: true, label: "Gases", icon: "💨" },
};

const TAG_ICON = {
  poop: "💩",
  pee: "💧",
  gas: "💨",
  sleep: "💤",
  vomit: "🤮",
};

const MEDICINES = {
  vitaminD: {
    short: "D",
    name: "Vitamina D",
    dose: "2 gotas",
    toast: "Vitamina D lista",
  },
  biogaia: {
    short: "B",
    name: "BioGaia Reuteri",
    dose: "5 gotas",
    toast: "BioGaia listo",
  },
};

const LOVE_NOTE_EMOJIS = ["💛", "💖", "💕", "❤️", "🫶", "💗"];

const LOVE_NOTES = [
  "Gracias, mami. Eres la mejor por darme tu tetica. Te amo.",
  "Deliciosa tu tetica, mami. Te amooo.",
  "Voy a pedirte más en un ratito. Te amo.",
  "Mami, tu tetica está 10/10. Atentamente: tu bebé favorito.",
  "Gracias por mi lechita, mami. Me hace feliz y me da sueñito rico.",
  "Perdón si pido otra ronda en cinco minutos. Es que estaba buenísima.",
  "Mami, servicio excelente. Voy a volver pronto. Te amo.",
  "Tu tetica es mi lugar favorito del mundo mundial.",
  "Gracias por cuidarme tanto, mami. Yo sé que a veces pido mucho, pero te amo más.",
  "Mami, no es por presionar, pero creo que en un ratito voy a querer postre.",
];

const DEFAULT_STATE = {
  settings: {
    babyName: "Federico",
    birthDate: "2026-05-01",
    vitaminTime: "09:00",
    colicMedicineName: "BioGaia Reuteri",
    colicDose: "5 gotas",
    nightMode: false,
  },
  events: [],
  vitaminDByDate: {},
  imports: {},
  loveNotesSeen: {},
  lastExportISO: "",
  activeFeed: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

let state = loadState();
let deferredInstallPrompt = null;
let toastTimer = null;
let pendingUndo = null;
let historyRangeDays = 7;
let historyFilter = "all";
let historySearch = "";
let selectedHistoryDate = "";

const els = {
  themeColorMeta: $("#themeColorMeta"),
  todayLabel: $("#todayLabel"),
  babyNameTitle: $("#babyNameTitle"),
  nightModeButton: $("#nightModeButton"),
  sinceLastFeed: $("#sinceLastFeed"),
  lastSide: $("#lastSide"),
  feedCount: $("#feedCount"),
  diaperCount: $("#diaperCount"),
  diaperBreakdown: $("#diaperBreakdown"),
  vitaminChecklistMeta: $("#vitaminChecklistMeta"),
  bioGaiaChecklistMeta: $("#bioGaiaChecklistMeta"),
  vitaminCardButton: $("#vitaminCardButton"),
  bioGaiaCardButton: $("#bioGaiaCardButton"),
  recommendedStartButton: $("#recommendedStartButton"),
  trustLine: $("#trustLine"),
  alertStack: $("#alertStack"),
  activeFeedPanel: $("#activeFeedPanel"),
  activeFeedSide: $("#activeFeedSide"),
  activeFeedHint: $("#activeFeedHint"),
  activeFeedTimer: $("#activeFeedTimer"),
  stopFeedButton: $("#stopFeedButton"),
  cancelFeedButton: $("#cancelFeedButton"),
  leftSummary: $("#leftSummary"),
  rightSummary: $("#rightSummary"),
  leftToday: $("#leftToday"),
  rightToday: $("#rightToday"),
  lastFeedStamp: $("#lastFeedStamp"),
  todayTimeline: $("#todayTimeline"),
  todayEventTotal: $("#todayEventTotal"),
  noteForm: $("#noteForm"),
  quickNoteInput: $("#quickNoteInput"),
  historySearchInput: $("#historySearchInput"),
  historySummaryGrid: $("#historySummaryGrid"),
  recentDaysList: $("#recentDaysList"),
  recentDaysMeta: $("#recentDaysMeta"),
  archiveMeta: $("#archiveMeta"),
  monthArchive: $("#monthArchive"),
  dayDetailPanel: $("#dayDetailPanel"),
  loveNoteDialog: $("#loveNoteDialog"),
  loveNoteMark: $("#loveNoteMark"),
  loveNoteCount: $("#loveNoteCount"),
  loveNoteText: $("#loveNoteText"),
  loveNoteCloseButton: $("#loveNoteCloseButton"),
  markdownPreview: $("#markdownPreview"),
  shareMarkdownButton: $("#shareMarkdownButton"),
  copyMarkdownButton: $("#copyMarkdownButton"),
  downloadMarkdownButton: $("#downloadMarkdownButton"),
  settingsForm: $("#settingsForm"),
  babyNameInput: $("#babyNameInput"),
  birthDateInput: $("#birthDateInput"),
  vitaminTimeInput: $("#vitaminTimeInput"),
  colicMedicineInput: $("#colicMedicineInput"),
  colicDoseInput: $("#colicDoseInput"),
  backupStatus: $("#backupStatus"),
  copyPediatricianButton: $("#copyPediatricianButton"),
  pediatricianSummary: $("#pediatricianSummary"),
  seedButton: $("#seedButton"),
  clearButton: $("#clearButton"),
  importNotesButton: $("#importNotesButton"),
  importNotesMeta: $("#importNotesMeta"),
  manualButton: $("#manualButton"),
  manualDialog: $("#manualDialog"),
  manualForm: $("#manualForm"),
  manualCloseButton: $("#manualCloseButton"),
  manualType: $("#manualType"),
  manualDate: $("#manualDate"),
  manualTime: $("#manualTime"),
  manualFeedPanel: $("#manualFeedPanel"),
  manualDiaperPanel: $("#manualDiaperPanel"),
  manualMedicinePanel: $("#manualMedicinePanel"),
  manualWeightPanel: $("#manualWeightPanel"),
  manualDuration: $("#manualDuration"),
  manualDurationWrap: $("#manualDurationWrap"),
  manualSide: $("#manualSide"),
  manualSideWrap: $("#manualSideWrap"),
  manualDiaper: $("#manualDiaper"),
  manualDiaperWrap: $("#manualDiaperWrap"),
  manualMedicine: $("#manualMedicine"),
  manualMedicineWrap: $("#manualMedicineWrap"),
  manualWeight: $("#manualWeight"),
  manualWeightWrap: $("#manualWeightWrap"),
  manualNoteWrap: $("#manualNoteWrap"),
  manualNoteLabel: $("#manualNoteLabel"),
  manualNote: $("#manualNote"),
  manualPreview: $("#manualPreview"),
  toast: $("#toast"),
  installButton: $("#installButton"),
  editDialog: $("#editDialog"),
  editForm: $("#editForm"),
  editCloseButton: $("#editCloseButton"),
  editEventId: $("#editEventId"),
  editDate: $("#editDate"),
  editTime: $("#editTime"),
  editFeedPanel: $("#editFeedPanel"),
  editDiaperPanel: $("#editDiaperPanel"),
  editMedicinePanel: $("#editMedicinePanel"),
  editWeightPanel: $("#editWeightPanel"),
  editSide: $("#editSide"),
  editDuration: $("#editDuration"),
  editDiaper: $("#editDiaper"),
  editMedicine: $("#editMedicine"),
  editWeight: $("#editWeight"),
  editNoteLabel: $("#editNoteLabel"),
  editNote: $("#editNote"),
  editPreview: $("#editPreview"),
};

bindEvents();
render();
setInterval(tick, 1000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

function bindEvents() {
  $$("[data-tab-target]").forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tabTarget));
  });

  $$("[data-start-feed]").forEach((button) => {
    button.addEventListener("click", () => startFeed(button.dataset.startFeed));
  });

  $$("[data-start-offset]").forEach((button) => {
    button.addEventListener("click", () => startFeed(getRecommendedSide(), Number(button.dataset.startOffset)));
  });

  els.recommendedStartButton.addEventListener("click", () => startFeed(getRecommendedSide()));

  $$("[data-segment-side]").forEach((button) => {
    button.addEventListener("click", () => switchFeedSide(button.dataset.segmentSide));
  });

  $$("[data-feed-tag]").forEach((button) => {
    button.addEventListener("click", () => addActiveFeedTag(button.dataset.feedTag));
  });

  $$("[data-diaper]").forEach((button) => {
    button.addEventListener("click", () => logDiaper(button.dataset.diaper));
  });

  $$("[data-diaper-detail]").forEach((button) => {
    button.addEventListener("click", () => addDiaperDetail(button.dataset.diaperDetail));
  });

  $$("[data-note-chip]").forEach((button) => {
    button.addEventListener("click", () => logNote(button.dataset.noteChip));
  });

  els.stopFeedButton.addEventListener("click", stopFeed);
  els.cancelFeedButton.addEventListener("click", cancelFeed);
  els.nightModeButton.addEventListener("click", toggleNightMode);
  els.vitaminCardButton.addEventListener("click", () => toggleMedicine("vitaminD"));
  els.bioGaiaCardButton.addEventListener("click", () => toggleMedicine("biogaia"));

  els.noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = els.quickNoteInput.value.trim();
    if (!text) return;
    logNote(text);
    els.quickNoteInput.value = "";
  });

  els.shareMarkdownButton.addEventListener("click", shareMarkdown);
  els.copyMarkdownButton.addEventListener("click", copyMarkdown);
  els.downloadMarkdownButton.addEventListener("click", downloadMarkdown);
  els.loveNoteCloseButton.addEventListener("click", () => els.loveNoteDialog.close());
  els.loveNoteDialog.addEventListener("click", (event) => {
    if (event.target === els.loveNoteDialog) els.loveNoteDialog.close();
  });
  els.historySearchInput.addEventListener("input", () => {
    historySearch = els.historySearchInput.value.trim().toLowerCase();
    renderHistory();
    renderPediatricianSummary();
  });
  $$("[data-history-range]").forEach((button) => {
    button.addEventListener("click", () => {
      historyRangeDays = Number(button.dataset.historyRange) || 7;
      renderHistory();
      renderPediatricianSummary();
    });
  });
  $$("[data-history-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      historyFilter = button.dataset.historyFilter || "all";
      renderHistory();
    });
  });

  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.settings.babyName = els.babyNameInput.value.trim() || DEFAULT_STATE.settings.babyName;
    state.settings.birthDate = els.birthDateInput.value || DEFAULT_STATE.settings.birthDate;
    state.settings.vitaminTime = els.vitaminTimeInput.value || DEFAULT_STATE.settings.vitaminTime;
    state.settings.colicMedicineName = els.colicMedicineInput.value.trim() || DEFAULT_STATE.settings.colicMedicineName;
    state.settings.colicDose = els.colicDoseInput.value.trim() || DEFAULT_STATE.settings.colicDose;
    saveState();
    render();
    showToast("Ajustes guardados");
  });

  els.seedButton.addEventListener("click", seedExample);
  els.importNotesButton.addEventListener("click", importHistoricalNotes);
  els.clearButton.addEventListener("click", clearData);
  els.manualButton.addEventListener("click", openManualDialog);
  els.manualCloseButton.addEventListener("click", () => els.manualDialog.close());
  $$("[data-manual-type]").forEach((button) => {
    button.addEventListener("click", () => setManualType(button.dataset.manualType));
  });
  [els.manualTime, els.manualDate, els.manualDuration, els.manualSide, els.manualDiaper, els.manualMedicine, els.manualWeight, els.manualNote].forEach((input) => {
    input.addEventListener("input", renderManualFields);
    input.addEventListener("change", renderManualFields);
  });
  els.manualForm.addEventListener("submit", saveManualEvent);
  els.copyPediatricianButton.addEventListener("click", copyPediatricianSummary);
  els.editCloseButton.addEventListener("click", () => els.editDialog.close());
  els.editForm.addEventListener("submit", saveEditedEvent);
  [els.editDate, els.editTime, els.editSide, els.editDuration, els.editDiaper, els.editMedicine, els.editWeight, els.editNote].forEach((input) => {
    input.addEventListener("input", renderEditPreview);
    input.addEventListener("change", renderEditPreview);
  });

  document.addEventListener("click", (event) => {
    const historyDateButton = event.target.closest("[data-history-date]");
    if (historyDateButton) {
      selectedHistoryDate = historyDateButton.dataset.historyDate;
      renderHistory();
      return;
    }
    const editButton = event.target.closest("[data-edit-event]");
    if (editButton) {
      openEditDialog(editButton.dataset.editEvent);
      return;
    }
    const deleteButton = event.target.closest("[data-delete-event]");
    if (!deleteButton) return;
    deleteEvent(deleteButton.dataset.deleteEvent);
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installButton.hidden = false;
  });

  els.installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installButton.hidden = true;
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const saved = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...saved,
      settings: {
        ...structuredClone(DEFAULT_STATE).settings,
        ...(saved.settings || {}),
      },
      imports: {
        ...structuredClone(DEFAULT_STATE).imports,
        ...(saved.imports || {}),
      },
      loveNotesSeen: {
        ...structuredClone(DEFAULT_STATE).loveNotesSeen,
        ...(saved.loveNotesSeen || {}),
      },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const today = todayKey();
  const todayEvents = eventsForDate(today);
  const feeds = todayEvents.filter((event) => event.type === "feed");
  const diapers = todayEvents.filter((event) => event.type === "diaper");
  const latestFeed = [...state.events].filter((event) => event.type === "feed").sort(byNewest)[0];
  const leftCount = feeds.filter((event) => event.side === "left").length;
  const rightCount = feeds.filter((event) => event.side === "right").length;
  const recommendedSide = getRecommendedSide();
  const peeCount = diapers.filter((event) => event.pee).length;
  const poopCount = diapers.filter((event) => event.poop).length;

  applyNightMode();
  els.todayLabel.textContent = `${formatFullDate(new Date())} · ${babyAgeText()}`;
  els.babyNameTitle.textContent = state.settings.babyName;
  els.feedCount.textContent = feeds.length;
  els.diaperCount.textContent = diapers.length;
  els.leftSummary.textContent = `${leftCount} izq.`;
  els.rightSummary.textContent = `${rightCount} der.`;
  els.leftToday.textContent = `${leftCount} izq.`;
  els.rightToday.textContent = `${rightCount} der.`;
  els.diaperBreakdown.textContent = diapers.length ? `${peeCount} pis · ${poopCount} popó` : "Sin pañales";
  els.todayEventTotal.textContent = pluralize(todayEvents.length, "registro", "registros");
  els.lastSide.textContent = SIDE_LABELS[recommendedSide];
  $$("[data-side-button]").forEach((button) => {
    button.classList.toggle("is-recommended", button.dataset.sideButton === recommendedSide);
  });
  els.sinceLastFeed.textContent = latestFeed ? timeAgo(new Date(latestFeed.endISO || latestFeed.startISO)) : "—";
  els.lastFeedStamp.textContent = latestFeed ? `Última ${formatTime(new Date(latestFeed.endISO || latestFeed.startISO))}` : "Sin toma hoy";

  const vitaminDone = isMedicineDone("vitaminD", today);
  const bioGaiaDone = isMedicineDone("biogaia", today);
  els.vitaminCardButton.classList.toggle("is-done", vitaminDone);
  els.bioGaiaCardButton.classList.toggle("is-done", bioGaiaDone);
  els.vitaminChecklistMeta.textContent = medicineChecklistMeta("vitaminD", vitaminDone);
  els.bioGaiaChecklistMeta.textContent = medicineChecklistMeta("biogaia", bioGaiaDone);
  els.bioGaiaCardButton.querySelector("strong").textContent = state.settings.colicMedicineName.replace(" Reuteri", "");
  els.trustLine.textContent = backupStatusText();

  els.babyNameInput.value = state.settings.babyName;
  els.birthDateInput.value = state.settings.birthDate;
  els.vitaminTimeInput.value = state.settings.vitaminTime;
  els.colicMedicineInput.value = state.settings.colicMedicineName;
  els.colicDoseInput.value = state.settings.colicDose;
  els.backupStatus.textContent = backupStatusText();
  renderImportStatus();

  renderActiveFeed();
  renderAlerts(todayEvents);
  renderTimeline(todayEvents);
  renderHistory();
  renderPediatricianSummary();
  renderMarkdown();
}

function renderActiveFeed() {
  if (!state.activeFeed) {
    els.activeFeedPanel.hidden = true;
    document.body.classList.remove("has-active-feed");
    return;
  }

  const openSegment = state.activeFeed.segments.find((segment) => !segment.endISO);
  const side = openSegment?.side || state.activeFeed.side;
  els.activeFeedPanel.hidden = false;
  document.body.classList.add("has-active-feed");
  els.activeFeedSide.textContent = `Toma en curso · empezó ${formatTime(new Date(state.activeFeed.startISO))}`;
  els.activeFeedHint.textContent = activeFeedHintText();
  els.activeFeedTimer.textContent = elapsedClock(new Date(state.activeFeed.startISO), new Date());
}

function renderTimeline(events) {
  if (!events.length && !state.activeFeed) {
    els.todayTimeline.innerHTML = `<div class="empty-state">Sin registros hoy</div>`;
    return;
  }

  els.todayTimeline.innerHTML = events
    .sort(byNewest)
    .map((event) => eventCard(event))
    .join("");
}

function eventCard(event) {
  const iconClass = event.type === "feed" ? `event-card__icon--feed-${event.side}` : `event-card__icon--${event.type}`;
  return `
    <article class="event-card">
      <div class="event-card__icon ${iconClass}" aria-hidden="true">${eventIcon(event)}</div>
      <div>
        <div class="event-card__title">${escapeHTML(eventTitle(event))}</div>
        <span class="event-card__meta">${escapeHTML(eventMeta(event))}</span>
        ${eventTags(event)}
      </div>
      <div class="event-card__actions">
        <button class="edit-event" data-edit-event="${event.id}" aria-label="Editar registro">✎</button>
        <button class="delete-event" data-delete-event="${event.id}" aria-label="Borrar registro">×</button>
      </div>
    </article>
  `;
}

function eventIcon(event) {
  if (event.type === "feed") return SIDE_SHORT[event.side];
  if (event.type === "diaper") return diaperIcon(event);
  if (event.type === "weight") return "kg";
  if (event.type === "med") return medicineConfig(event.med).short;
  return "＋";
}

function eventTitle(event) {
  if (event.type === "feed") return `Toma · ${feedSideStory(event)}`;
  if (event.type === "diaper") return `Pañal · ${diaperLabel(event)}`;
  if (event.type === "weight") return `Peso · ${formatKg(event.kg)}`;
  if (event.type === "med") return medicineConfig(event.med).name;
  return event.text || "Nota";
}

function eventMeta(event) {
  if (event.type === "feed") {
    const start = new Date(event.startISO);
    const end = event.endISO ? new Date(event.endISO) : null;
    const duration = end ? ` · ${minutesBetween(start, end)} min` : "";
    const sideChanges = event.segments?.length > 1 ? ` · ${event.segments.length - 1} cambio${event.segments.length === 2 ? "" : "s"} de pecho` : "";
    return `${formatTime(start)}${end ? ` - ${formatTime(end)}` : ""}${duration}${sideChanges}${event.note ? ` · ${event.note}` : ""}`;
  }
  return `${formatTime(new Date(event.timeISO))}${event.note ? ` · ${event.note}` : ""}`;
}

function eventTags(event) {
  const tags = [];
  if (event.type === "feed") {
    (event.tags || []).forEach((tag) => tags.push(TAG_ICON[tag] || tag));
  }
  if (event.type === "diaper") {
    if (event.pee) tags.push("💧");
    if (event.poop) tags.push("💩");
    if (event.gas) tags.push("💨");
    (event.details || []).forEach((detail) => tags.push(detail));
  }
  if (event.type === "med") {
    tags.push(event.dose || medicineConfig(event.med).dose);
  }
  if (!tags.length) return "";
  return `<div class="event-card__tags">${tags.map((tag) => `<span class="event-tag">${tag}</span>`).join("")}</div>`;
}

function renderHistory() {
  const groups = groupEventsByDate();
  syncHistoryControls();
  renderHistorySummary();

  if (!groups.length) {
    els.recentDaysList.innerHTML = `<div class="empty-state">Sin historial</div>`;
    els.monthArchive.innerHTML = "";
    els.dayDetailPanel.innerHTML = `<div class="empty-state">Sin día seleccionado</div>`;
    return;
  }

  const filteredGroups = groups
    .map(([date, events]) => [date, filterHistoryEvents(events)])
    .filter(([, events]) => events.length);

  if (!filteredGroups.length) {
    els.recentDaysList.innerHTML = `<div class="empty-state">Sin resultados</div>`;
    els.monthArchive.innerHTML = "";
    els.dayDetailPanel.innerHTML = `<div class="empty-state">Prueba otro filtro</div>`;
    els.recentDaysMeta.textContent = "0 días";
    els.archiveMeta.textContent = "0 meses";
    return;
  }

  const availableDates = new Set(filteredGroups.map(([date]) => date));
  if (!selectedHistoryDate || !availableDates.has(selectedHistoryDate)) selectedHistoryDate = filteredGroups[0][0];

  const recentGroups = filteredGroups.slice(0, 14);
  const archiveGroups = filteredGroups.slice(14);
  els.recentDaysMeta.textContent = `${pluralize(recentGroups.length, "día", "días")} visibles`;
  els.archiveMeta.textContent = `${pluralize(monthArchiveGroups(archiveGroups).length, "mes", "meses")}`;
  els.recentDaysList.innerHTML = recentGroups.map(([date, events]) => historyDayCard(date, events)).join("");
  els.monthArchive.innerHTML = renderMonthArchive(archiveGroups);
  renderDayDetail(selectedHistoryDate);
}

function historyPill(label, value) {
  return `<div class="history-pill"><span>${label}</span><strong>${value}</strong></div>`;
}

function syncHistoryControls() {
  $$("[data-history-range]").forEach((button) => {
    const isActive = Number(button.dataset.historyRange) === historyRangeDays;
    button.classList.toggle("is-active", isActive);
  });
  $$("[data-history-filter]").forEach((button) => {
    const isActive = button.dataset.historyFilter === historyFilter;
    button.classList.toggle("is-active", isActive);
  });
}

function renderHistorySummary() {
  const summary = historySummary(historyRangeDays);
  els.historySummaryGrid.innerHTML = [
    historySummaryCard("Tomas/día", summary.feedsPerDay, `${summary.feeds.length} tomas`),
    historySummaryCard("Pañales/día", summary.diapersPerDay, `${summary.diapers.length} pañales`),
    historySummaryCard("Popó", summary.poopCount, `${summary.peeCount} pis · ${summary.gasCount} gases`),
    historySummaryCard("Último peso", summary.latestWeight ? formatKg(summary.latestWeight.kg) : "—", summary.latestWeight ? dateToHuman(eventDateKey(summary.latestWeight)) : "Sin peso"),
  ].join("");
}

function historySummaryCard(label, value, meta) {
  return `
    <article class="history-summary-card">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
      <small>${escapeHTML(meta)}</small>
    </article>
  `;
}

function historySummary(days) {
  const keys = lastDays(days);
  const events = state.events.filter((event) => keys.includes(eventDateKey(event)));
  const feeds = events.filter((event) => event.type === "feed");
  const diapers = events.filter((event) => event.type === "diaper");
  const notes = events.filter((event) => event.type === "note");
  const meds = events.filter((event) => event.type === "med");
  const weights = events.filter((event) => event.type === "weight").sort(byNewest);
  return {
    range: `${dateToShort(keys[0])} - ${dateToShort(keys[keys.length - 1])}`,
    feeds,
    diapers,
    notes,
    meds,
    latestWeight: weights[0] || null,
    feedsPerDay: averagePerDay(feeds.length, keys.length),
    diapersPerDay: averagePerDay(diapers.length, keys.length),
    poopCount: diapers.filter((event) => event.poop).length,
    peeCount: diapers.filter((event) => event.pee).length,
    gasCount: diapers.filter((event) => event.gas).length,
  };
}

function filterHistoryEvents(events) {
  return events.filter((event) => {
    const typeMatch = historyFilter === "all" || event.type === historyFilter;
    if (!typeMatch) return false;
    if (!historySearch) return true;
    return historyHaystack(event).includes(historySearch);
  });
}

function historyHaystack(event) {
  return [
    eventTitle(event),
    eventMeta(event),
    eventTagsText(event),
    eventDateKey(event),
    dateToHuman(eventDateKey(event)),
    event.note || "",
    event.text || "",
    event.med || "",
    event.side || "",
  ].join(" ").toLowerCase();
}

function eventTagsText(event) {
  const tags = [];
  if (event.type === "feed") tags.push(...(event.tags || []));
  if (event.type === "diaper") {
    if (event.pee) tags.push("pis");
    if (event.poop) tags.push("popó");
    if (event.gas) tags.push("gases");
    tags.push(...(event.details || []));
  }
  if (event.type === "med") tags.push(event.dose || "");
  return tags.join(" ");
}

function historyDayCard(date, events) {
  const stats = dayStats(events);
  const isActive = date === selectedHistoryDate;
  return `
    <button class="history-day history-day--button ${isActive ? "is-selected" : ""}" data-history-date="${date}" type="button">
      <span class="history-day__top">
        <span>
          <span class="history-day__date">${dateToHuman(date)}</span>
          <span class="history-day__meta">${pluralize(events.length, "registro", "registros")}</span>
        </span>
        ${stats.weight ? `<strong>${formatKg(stats.weight.kg)}</strong>` : ""}
      </span>
      <span class="history-day__stats">
        ${historyPill("Tomas", stats.feeds.length)}
        ${historyPill("Pañales", stats.diapers.length)}
        ${historyPill("Izq / Der", `${stats.left}/${stats.right}`)}
        ${historyPill("Meds / Notas", `${stats.meds.length}/${stats.notes.length}`)}
      </span>
    </button>
  `;
}

function dayStats(events) {
  const feeds = events.filter((event) => event.type === "feed");
  const diapers = events.filter((event) => event.type === "diaper");
  const notes = events.filter((event) => event.type === "note");
  const meds = events.filter((event) => event.type === "med");
  const weights = events.filter((event) => event.type === "weight").sort(byNewest);
  return {
    feeds,
    diapers,
    notes,
    meds,
    weight: weights[0] || null,
    left: feeds.filter((event) => event.side === "left").length,
    right: feeds.filter((event) => event.side === "right").length,
  };
}

function monthArchiveGroups(groups) {
  const map = new Map();
  groups.forEach(([date, events]) => {
    const month = date.slice(0, 7);
    if (!map.has(month)) map.set(month, []);
    map.get(month).push([date, events]);
  });
  return Array.from(map.entries());
}

function renderMonthArchive(groups) {
  const months = monthArchiveGroups(groups);
  if (!months.length) return `<div class="empty-state">Sin archivo anterior</div>`;
  return months.map(([month, dayGroups], index) => {
    const events = dayGroups.flatMap(([, dayEvents]) => dayEvents);
    const stats = dayStats(events);
    return `
      <details class="month-card" ${index === 0 ? "open" : ""}>
        <summary>
          <span>
            <strong>${monthName(month)}</strong>
            <small>${pluralize(dayGroups.length, "día", "días")} · ${pluralize(events.length, "registro", "registros")}</small>
          </span>
          <span>${stats.feeds.length} tomas · ${stats.diapers.length} pañales</span>
        </summary>
        <div class="month-card__days">
          ${dayGroups.map(([date, dayEvents]) => monthDayRow(date, dayEvents)).join("")}
        </div>
      </details>
    `;
  }).join("");
}

function monthDayRow(date, events) {
  const stats = dayStats(events);
  return `
    <button class="month-day ${date === selectedHistoryDate ? "is-selected" : ""}" data-history-date="${date}" type="button">
      <span>${dateToHuman(date)}</span>
      <strong>${stats.feeds.length} tomas</strong>
      <small>${stats.diapers.length} pañales · ${stats.notes.length} notas</small>
    </button>
  `;
}

function renderDayDetail(date) {
  const allEvents = eventsForDate(date).sort(byOldest);
  const visibleEvents = filterHistoryEvents(allEvents);
  const stats = dayStats(allEvents);
  els.dayDetailPanel.innerHTML = `
    <div class="day-detail__header">
      <span>Detalle</span>
      <h2>${dateToHuman(date)}</h2>
      <p>${stats.feeds.length} tomas · ${stats.diapers.length} pañales · ${stats.meds.length} medicinas · ${stats.notes.length} notas</p>
    </div>
    <div class="day-detail__stats">
      ${historyPill("Izq / Der", `${stats.left}/${stats.right}`)}
      ${historyPill("Popó", stats.diapers.filter((event) => event.poop).length)}
      ${historyPill("Pis", stats.diapers.filter((event) => event.pee).length)}
      ${historyPill("Peso", stats.weight ? formatKg(stats.weight.kg) : "—")}
    </div>
    <div class="timeline day-detail__timeline">
      ${visibleEvents.length ? visibleEvents.map((event) => eventCard(event)).join("") : `<div class="empty-state">Sin eventos con este filtro</div>`}
    </div>
  `;
}

function monthName(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function renderMarkdown() {
  els.markdownPreview.value = exportMarkdown();
}

function applyNightMode() {
  document.body.classList.toggle("night-mode", Boolean(state.settings.nightMode));
  els.nightModeButton.setAttribute("aria-pressed", String(Boolean(state.settings.nightMode)));
  els.themeColorMeta?.setAttribute("content", state.settings.nightMode ? "#111816" : "#f4f7f2");
}

function toggleNightMode() {
  state.settings.nightMode = !state.settings.nightMode;
  saveState();
  render();
  haptic("tap");
  showToast(state.settings.nightMode ? "Modo noche" : "Modo día");
}

function renderAlerts(todayEvents) {
  const alerts = buildAlerts(todayEvents);
  if (!alerts.length) {
    els.alertStack.innerHTML = "";
    return;
  }
  els.alertStack.innerHTML = alerts.map((alert) => `
    <div class="alert-item alert-item--${alert.tone}">
      <span class="alert-dot" aria-hidden="true"></span>
      <div>
        <span>${escapeHTML(alert.label)}</span>
        <strong>${escapeHTML(alert.text)}</strong>
      </div>
    </div>
  `).join("");
}

function buildAlerts(todayEvents) {
  const alerts = [];
  const today = todayKey();
  const latestFeed = [...state.events].filter((event) => event.type === "feed").sort(byNewest)[0];
  if (latestFeed) {
    const minutes = Math.floor((Date.now() - new Date(latestFeed.endISO || latestFeed.startISO).getTime()) / 60000);
    if (minutes >= 180) alerts.push({ tone: "quiet", label: "Toma", text: `Última toma hace ${timeAgo(new Date(latestFeed.endISO || latestFeed.startISO))}` });
  }
  if (!isMedicineDone("vitaminD", today)) alerts.push({ tone: "care", label: "Pendiente", text: "Vitamina D" });
  if (!isMedicineDone("biogaia", today)) alerts.push({ tone: "care", label: "Pendiente", text: `${state.settings.colicMedicineName.replace(" Reuteri", "")} · ${state.settings.colicDose}` });
  const diaperCount = todayEvents.filter((event) => event.type === "diaper").length;
  const hour = new Date().getHours();
  if (hour >= 18 && diaperCount < 4) alerts.push({ tone: "quiet", label: "Pañales", text: `${diaperCount} registrados hoy` });
  return alerts.slice(0, 3);
}

function tick() {
  renderActiveFeed();
  const latestFeed = [...state.events].filter((event) => event.type === "feed").sort(byNewest)[0];
  if (latestFeed) {
    els.sinceLastFeed.textContent = timeAgo(new Date(latestFeed.endISO || latestFeed.startISO));
  }
}

function setTab(tabName) {
  $$("[data-tab]").forEach((screen) => screen.classList.toggle("is-active", screen.dataset.tab === tabName));
  $$("[data-tab-target]").forEach((button) => button.classList.toggle("is-active", button.dataset.tabTarget === tabName));
  if (tabName === "export") renderMarkdown();
}

function startFeed(side, offsetMinutes = 0) {
  if (state.activeFeed) {
    switchFeedSide(side);
    return;
  }
  const start = new Date();
  start.setMinutes(start.getMinutes() - offsetMinutes);
  const now = start.toISOString();
  state.activeFeed = {
    id: makeId(),
    type: "feed",
    startISO: now,
    side,
    segments: [{ side, startISO: now, endISO: null }],
    tags: [],
    note: "",
  };
  saveState();
  render();
  haptic("start");
  showToast(offsetMinutes ? `Toma desde hace ${offsetMinutes} min` : `Toma: ${SIDE_LABELS[side]}`);
}

function switchFeedSide(side) {
  if (!state.activeFeed) return startFeed(side);
  const now = new Date().toISOString();
  const openSegment = state.activeFeed.segments.find((segment) => !segment.endISO);
  if (openSegment) {
    if (openSegment.side === side) return;
    openSegment.endISO = now;
  }
  state.activeFeed.segments.push({ side, startISO: now, endISO: null });
  state.activeFeed.side = deriveFeedSide(state.activeFeed.segments);
  saveState();
  render();
  haptic("tap");
  showToast(`Ahora ${SIDE_LABELS[side]}`);
}

function addActiveFeedTag(tag) {
  if (!state.activeFeed) return;
  if (!state.activeFeed.tags.includes(tag)) {
    state.activeFeed.tags.push(tag);
  }
  saveState();
  renderActiveFeed();
  haptic("tap");
  showToast(TAG_ICON[tag] || "Añadido");
}

function stopFeed() {
  if (!state.activeFeed) return;
  const now = new Date().toISOString();
  state.activeFeed.segments.forEach((segment) => {
    if (!segment.endISO) segment.endISO = now;
  });
  const event = {
    ...state.activeFeed,
    endISO: now,
    side: deriveFeedSide(state.activeFeed.segments),
  };
  state.activeFeed = null;
  addEvent(event, "Toma guardada");
}

function cancelFeed() {
  state.activeFeed = null;
  saveState();
  render();
  haptic("soft");
  showToast("Toma cancelada");
}

function logDiaper(kind) {
  const preset = DIAPER_PRESETS[kind];
  if (!preset) return;
  addEvent({
    id: makeId(),
    type: "diaper",
    timeISO: new Date().toISOString(),
    pee: preset.pee,
    poop: preset.poop,
    gas: preset.gas,
    details: [],
    note: "",
  }, `Pañal: ${preset.label}`);
}

function logNote(text) {
  addEvent({
    id: makeId(),
    type: "note",
    timeISO: new Date().toISOString(),
    text,
  }, "Nota guardada");
}

function addDiaperDetail(detail) {
  const today = todayKey();
  const latestDiaper = state.events
    .filter((event) => event.type === "diaper" && eventDateKey(event) === today)
    .sort(byNewest)[0];
  if (!latestDiaper) {
    logNote(`Pañal: ${detail}`);
    return;
  }
  const before = structuredClone(latestDiaper);
  latestDiaper.details = latestDiaper.details || [];
  if (!latestDiaper.details.includes(detail)) latestDiaper.details.push(detail);
  saveState();
  render();
  haptic("tap");
  showToast("Detalle añadido", () => {
    const index = state.events.findIndex((event) => event.id === before.id);
    if (index >= 0) state.events[index] = before;
    saveState();
    render();
    haptic("soft");
  });
}

function toggleMedicine(med) {
  const today = todayKey();
  const existing = medicineEvent(med, today);
  const config = medicineConfig(med);
  if (existing) {
    const removed = structuredClone(existing);
    state.events = state.events.filter((event) => event.id !== existing.id);
    if (med === "vitaminD") delete state.vitaminDByDate[today];
    saveState();
    render();
    haptic("soft");
    showToast(`${config.name} pendiente`, () => {
      state.events.push(removed);
      if (med === "vitaminD") state.vitaminDByDate[today] = removed.timeISO;
      saveState();
      render();
      haptic("tap");
    });
    return;
  }

  const now = new Date();
  if (med === "vitaminD") state.vitaminDByDate[today] = now.toISOString();
  addEvent({
    id: makeId(),
    type: "med",
    med,
    timeISO: now.toISOString(),
    dose: config.dose,
    note: "",
  }, config.toast);
}

function addEvent(event, message) {
  state.events.push(event);
  const loveNote = maybeBuildLoveNote(event);
  saveState();
  render();
  haptic("save");
  showToast(message, () => {
    state.events = state.events.filter((item) => item.id !== event.id);
    if (event.type === "med" && event.med === "vitaminD") delete state.vitaminDByDate[eventDateKey(event)];
    if (loveNote?.key) delete state.loveNotesSeen[loveNote.key];
    saveState();
    render();
    haptic("soft");
  });
  if (loveNote) window.setTimeout(() => showLoveNote(loveNote), 650);
}

function restoreEvent(event, message = "Registro restaurado") {
  state.events.push(event);
  saveState();
  render();
  haptic("save");
  showToast(message);
}

function openManualDialog() {
  els.manualDate.value = todayKey();
  els.manualTime.value = currentTimeValue();
  els.manualDuration.value = 15;
  els.manualNote.value = "";
  els.manualWeight.value = "";
  setManualType("feed");
  renderManualFields();
  els.manualDialog.showModal();
}

function setManualType(type) {
  els.manualType.value = type;
  $$("[data-manual-type]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.manualType === type);
  });
  renderManualFields();
}

function renderManualFields() {
  const type = els.manualType.value;
  els.manualFeedPanel.hidden = type !== "feed";
  els.manualDiaperPanel.hidden = type !== "diaper";
  els.manualMedicinePanel.hidden = type !== "medicine";
  els.manualWeightPanel.hidden = type !== "weight";
  const noteCopy = {
    feed: ["Nota de la toma", "Opcional"],
    diaper: ["Detalle del pañal", "moco, aguado, poquito..."],
    medicine: ["Nota medicina", "Opcional"],
    note: ["Nota", "Qué pasó"],
    weight: ["Nota peso", "Opcional"],
  }[type] || ["Nota", "Opcional"];
  els.manualNoteLabel.textContent = noteCopy[0];
  els.manualNote.placeholder = noteCopy[1];
  els.manualNoteWrap.classList.toggle("is-required", type === "note");
  els.manualPreview.textContent = manualPreviewText();
}

function saveManualEvent(event) {
  event.preventDefault();
  const type = els.manualType.value;
  const baseDate = new Date(`${els.manualDate.value || todayKey()}T12:00:00`);
  const [hours, minutes] = (els.manualTime.value || currentTimeValue()).split(":").map(Number);
  baseDate.setHours(hours, minutes, 0, 0);
  const note = els.manualNote.value.trim();
  let savedEvent = null;

  if (type === "feed") {
    const duration = Number(els.manualDuration.value) || 15;
    const end = new Date(baseDate);
    end.setMinutes(end.getMinutes() + duration);
    savedEvent = {
      id: makeId(),
      type: "feed",
      startISO: baseDate.toISOString(),
      endISO: end.toISOString(),
      side: els.manualSide.value,
      segments: [{ side: els.manualSide.value, startISO: baseDate.toISOString(), endISO: end.toISOString() }],
      tags: [],
      note,
    };
  }

  if (type === "diaper") {
    const preset = DIAPER_PRESETS[els.manualDiaper.value];
    savedEvent = {
      id: makeId(),
      type: "diaper",
      timeISO: baseDate.toISOString(),
      pee: preset.pee,
      poop: preset.poop,
      gas: preset.gas,
      details: [],
      note,
    };
  }

  if (type === "medicine") {
    const med = els.manualMedicine.value;
    const config = medicineConfig(med);
    savedEvent = {
      id: makeId(),
      type: "med",
      med,
      timeISO: baseDate.toISOString(),
      dose: config.dose,
      note,
    };
  }

  if (type === "note") {
    savedEvent = {
      id: makeId(),
      type: "note",
      timeISO: baseDate.toISOString(),
      text: note || "Nota",
    };
  }

  if (type === "weight") {
    const kg = Number(els.manualWeight.value);
    if (!kg) {
      showToast("Falta el peso");
      return;
    }
    savedEvent = {
      id: makeId(),
      type: "weight",
      timeISO: baseDate.toISOString(),
      kg,
      note,
    };
  }

  if (!savedEvent) return;
  els.manualDialog.close();
  addEvent(savedEvent, "Registro guardado");
}

function openEditDialog(id) {
  const event = state.events.find((item) => item.id === id);
  if (!event) return;
  els.editEventId.value = id;
  const date = new Date(event.startISO || event.timeISO);
  els.editDate.value = todayKey(date);
  els.editTime.value = timeInputValue(date);
  els.editNote.value = event.note || event.text || "";
  els.editWeight.value = event.kg || "";

  els.editFeedPanel.hidden = event.type !== "feed";
  els.editDiaperPanel.hidden = event.type !== "diaper";
  els.editMedicinePanel.hidden = event.type !== "med";
  els.editWeightPanel.hidden = event.type !== "weight";

  if (event.type === "feed") {
    els.editSide.value = event.side || "left";
    const end = event.endISO ? new Date(event.endISO) : new Date();
    els.editDuration.value = minutesBetween(date, end);
    els.editNoteLabel.textContent = "Nota de la toma";
  }
  if (event.type === "diaper") {
    els.editDiaper.value = diaperKind(event);
    els.editNoteLabel.textContent = "Detalle del pañal";
  }
  if (event.type === "med") {
    els.editMedicine.value = event.med || "vitaminD";
    els.editNoteLabel.textContent = "Nota medicina";
  }
  if (event.type === "weight") {
    els.editNoteLabel.textContent = "Nota peso";
  }
  if (event.type === "note") {
    els.editNoteLabel.textContent = "Nota";
  }

  renderEditPreview();
  els.editDialog.showModal();
}

function renderEditPreview() {
  const event = state.events.find((item) => item.id === els.editEventId.value);
  if (!event) {
    els.editPreview.textContent = "Editando registro";
    return;
  }
  const time = els.editTime.value || currentTimeValue();
  if (event.type === "feed") els.editPreview.textContent = `Toma · ${feedSideStory({ side: els.editSide.value })} · ${els.editDuration.value || 15} min · ${time}`;
  else if (event.type === "diaper") els.editPreview.textContent = `Pañal · ${DIAPER_PRESETS[els.editDiaper.value]?.label || "Pañal"} · ${time}`;
  else if (event.type === "med") els.editPreview.textContent = `${medicineConfig(els.editMedicine.value).name} · ${medicineConfig(els.editMedicine.value).dose} · ${time}`;
  else if (event.type === "weight") els.editPreview.textContent = `Peso · ${els.editWeight.value || "kg"} · ${time}`;
  else els.editPreview.textContent = `Nota · ${time}`;
}

function saveEditedEvent(event) {
  event.preventDefault();
  const original = state.events.find((item) => item.id === els.editEventId.value);
  if (!original) return;
  const before = structuredClone(original);
  const baseDate = new Date(`${els.editDate.value || todayKey()}T12:00:00`);
  const [hours, minutes] = (els.editTime.value || currentTimeValue()).split(":").map(Number);
  baseDate.setHours(hours, minutes, 0, 0);
  const note = els.editNote.value.trim();

  if (original.type === "feed") {
    const duration = Number(els.editDuration.value) || 15;
    const end = new Date(baseDate);
    end.setMinutes(end.getMinutes() + duration);
    original.startISO = baseDate.toISOString();
    original.endISO = end.toISOString();
    original.side = els.editSide.value;
    original.segments = [{ side: els.editSide.value, startISO: baseDate.toISOString(), endISO: end.toISOString() }];
    original.note = note;
  } else if (original.type === "diaper") {
    const preset = DIAPER_PRESETS[els.editDiaper.value];
    original.timeISO = baseDate.toISOString();
    original.pee = preset.pee;
    original.poop = preset.poop;
    original.gas = preset.gas;
    original.note = note;
  } else if (original.type === "med") {
    const config = medicineConfig(els.editMedicine.value);
    original.timeISO = baseDate.toISOString();
    original.med = els.editMedicine.value;
    original.dose = config.dose;
    original.note = note;
  } else if (original.type === "weight") {
    const kg = Number(els.editWeight.value);
    if (!kg) return showToast("Falta el peso");
    original.timeISO = baseDate.toISOString();
    original.kg = kg;
    original.note = note;
  } else if (original.type === "note") {
    original.timeISO = baseDate.toISOString();
    original.text = note || "Nota";
  }

  saveState();
  els.editDialog.close();
  render();
  haptic("save");
  showToast("Cambios guardados", () => {
    const index = state.events.findIndex((item) => item.id === before.id);
    if (index >= 0) state.events[index] = before;
    saveState();
    render();
  });
}

function deleteEvent(id) {
  const deleted = state.events.find((event) => event.id === id);
  state.events = state.events.filter((event) => event.id !== id);
  saveState();
  render();
  haptic("soft");
  showToast("Registro borrado", () => {
    if (deleted) restoreEvent(deleted);
  });
}

function renderImportStatus() {
  const total = HISTORICAL_IMPORT.events.length;
  const importedCount = state.events.filter((event) => isNotesImportEvent(event)).length;
  const imported = state.imports?.notesVersion === HISTORICAL_IMPORT.version && importedCount === total;
  const needsRepair = state.imports?.notesVersion === HISTORICAL_IMPORT.version && importedCount && importedCount !== total;
  const needsUpdate = state.imports?.notesVersion && state.imports.notesVersion !== HISTORICAL_IMPORT.version;
  const counts = HISTORICAL_IMPORT.summary;
  els.importNotesButton.textContent = imported ? "Notas importadas" : needsRepair ? "Reparar notas" : needsUpdate ? "Actualizar notas" : "Importar notas";
  els.importNotesButton.disabled = imported;
  els.importNotesMeta.textContent = imported
    ? `${total} registros históricos ya están en este teléfono`
    : needsRepair
      ? `${importedCount} registros importados · reparar a ${total}`
      : needsUpdate
        ? `Nueva migración disponible · ${total} registros históricos`
    : `${HISTORICAL_IMPORT.source} · ${counts.feed} tomas · ${counts.diaper} pañales · ${counts.weight} pesos`;
}

function importHistoricalNotes() {
  const previousNotes = state.events.filter((event) => isNotesImportEvent(event));
  const retainedEvents = state.events.filter((event) => !isNotesImportEvent(event));
  const existingKeys = new Set(retainedEvents.map(eventImportKey));
  const incoming = HISTORICAL_IMPORT.events
    .filter((event) => !existingKeys.has(eventImportKey(event)))
    .map((event) => structuredClone(event));

  state.events = [...retainedEvents, ...incoming];
  state.imports = {
    ...(state.imports || {}),
    notesVersion: HISTORICAL_IMPORT.version,
    notesImportedAt: new Date().toISOString(),
  };
  saveState();
  render();
  haptic("save");
  showToast(previousNotes.length ? `${incoming.length} registros actualizados` : `${incoming.length} registros importados`);
}

function eventImportKey(event) {
  return [
    event.type,
    event.startISO || event.timeISO,
    event.side || "",
    event.med || "",
    event.kg || "",
    event.text || "",
    Boolean(event.pee),
    Boolean(event.poop),
    Boolean(event.gas),
  ].join("|");
}

function isNotesImportEvent(event) {
  return typeof event.id === "string" && event.id.startsWith("notes-");
}

function maybeBuildLoveNote(event) {
  if (event.type !== "feed") return null;
  const dateKey = eventDateKey(event);
  const feedCount = state.events.filter((item) => item.type === "feed" && eventDateKey(item) === dateKey).length;
  if (feedCount < 3 || feedCount % 3 !== 0) return null;

  state.loveNotesSeen = state.loveNotesSeen || {};
  const key = `${dateKey}-${feedCount}`;
  if (state.loveNotesSeen[key]) return null;

  const index = (feedCount / 3 - 1) % LOVE_NOTES.length;
  const note = LOVE_NOTES[index];
  const emoji = LOVE_NOTE_EMOJIS[index % LOVE_NOTE_EMOJIS.length];
  state.loveNotesSeen[key] = new Date().toISOString();
  return { key, dateKey, feedCount, note, emoji };
}

function showLoveNote({ dateKey, feedCount, note, emoji }) {
  if (!els.loveNoteDialog?.showModal) {
    showToast(note);
    return;
  }
  els.loveNoteMark.textContent = emoji || "💥";
  els.loveNoteCount.textContent = dateKey === todayKey()
    ? `${feedCount} tomas hoy ${emoji || "💥"}`
    : `${feedCount} tomas el ${dateToShort(dateKey)} ${emoji || "💥"}`;
  els.loveNoteText.textContent = note;
  if (els.loveNoteDialog.open) els.loveNoteDialog.close();
  els.loveNoteDialog.showModal();
  haptic("soft");
}

function seedExample() {
  const today = new Date();
  const setTime = (hour, minute) => {
    const date = new Date(today);
    date.setHours(hour, minute, 0, 0);
    return date;
  };
  const examples = [
    feedExample(setTime(1, 0), 34, "right", ["poop"]),
    feedExample(setTime(3, 42), 11, "left", ["poop"]),
    feedExample(setTime(6, 33), 32, "left", ["poop"]),
    diaperExample(setTime(8, 10), { pee: true, poop: true, gas: false }),
    feedExample(setTime(10, 40), 27, "right", ["pee", "gas"]),
    noteExample(setTime(11, 30), "berrinche largo"),
    diaperExample(setTime(13, 26), { pee: true, poop: false, gas: true }),
  ];
  state.events = [...state.events, ...examples];
  saveState();
  render();
  showToast("Ejemplo cargado");
}

function clearData() {
  const ok = window.confirm("¿Borrar todos los registros locales?");
  if (!ok) return;
  state = structuredClone(DEFAULT_STATE);
  saveState();
  render();
  showToast("Datos borrados");
}

function feedExample(start, minutes, side, tags = []) {
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + minutes);
  return {
    id: makeId(),
    type: "feed",
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    side,
    segments: [{ side, startISO: start.toISOString(), endISO: end.toISOString() }],
    tags,
    note: "",
  };
}

function diaperExample(time, attrs) {
  return {
    id: makeId(),
    type: "diaper",
    timeISO: time.toISOString(),
    pee: Boolean(attrs.pee),
    poop: Boolean(attrs.poop),
    gas: Boolean(attrs.gas),
    note: "",
  };
}

function noteExample(time, text) {
  return { id: makeId(), type: "note", timeISO: time.toISOString(), text };
}

function feedSideStory(event) {
  if (event.side === "left") return "Pecho izquierdo";
  if (event.side === "right") return "Pecho derecho";
  if (event.side === "both") return "Ambos pechos";
  if (event.side === "pump") return "Extracción";
  if (event.side === "snack") return "Snack";
  return "Toma";
}

function diaperKind(event) {
  if (event.pee && event.poop) return "mixed";
  if (event.pee) return "pee";
  if (event.poop) return "poop";
  if (event.gas) return "gas";
  return "pee";
}

function deriveFeedSide(segments) {
  const sides = new Set(segments.map((segment) => segment.side));
  if (sides.has("pump")) return "pump";
  if (sides.has("snack")) return "snack";
  if (sides.has("left") && sides.has("right")) return "both";
  return segments[0]?.side || "left";
}

function getRecommendedSide() {
  const latestNormalFeed = [...state.events]
    .filter((event) => event.type === "feed")
    .sort(byNewest)
    .find((event) => ["left", "right", "both"].includes(event.side));

  if (latestNormalFeed?.side === "left") return "right";
  if (latestNormalFeed?.side === "right") return "left";

  if (latestNormalFeed?.segments?.length) {
    const lastSegment = [...latestNormalFeed.segments].reverse().find((segment) => ["left", "right"].includes(segment.side));
    if (lastSegment?.side === "left") return "right";
    if (lastSegment?.side === "right") return "left";
  }

  const todayEvents = eventsForDate(todayKey()).filter((event) => event.type === "feed");
  const left = todayEvents.filter((event) => event.side === "left").length;
  const right = todayEvents.filter((event) => event.side === "right").length;
  if (left > right) return "right";
  return "left";
}

function activeFeedHintText() {
  if (!state.activeFeed) return "";
  const tags = (state.activeFeed.tags || []).map((tag) => TAG_ICON[tag] || tag).join(" ");
  const openSegment = state.activeFeed.segments.find((segment) => !segment.endISO);
  const side = openSegment?.side || state.activeFeed.side;
  const breastLabel = side === "right" ? "Pecho derecho" : side === "left" ? "Pecho izquierdo" : "Ambos pechos";
  const base = side === "pump" ? "Extracción en curso" : side === "snack" ? "Snack en curso" : breastLabel;
  return tags ? `${base} · ${tags}` : base;
}

function medicineConfig(med) {
  if (med === "biogaia") {
    return {
      ...MEDICINES.biogaia,
      name: state.settings.colicMedicineName || MEDICINES.biogaia.name,
      dose: state.settings.colicDose || MEDICINES.biogaia.dose,
      toast: `${(state.settings.colicMedicineName || "BioGaia").replace(" Reuteri", "")} listo`,
    };
  }
  return MEDICINES[med] || MEDICINES.vitaminD;
}

function medicineEvent(med, dateKey) {
  return state.events.find((event) => event.type === "med" && event.med === med && eventDateKey(event) === dateKey);
}

function isMedicineDone(med, dateKey) {
  if (medicineEvent(med, dateKey)) return true;
  return med === "vitaminD" && Boolean(state.vitaminDByDate?.[dateKey]);
}

function medicineChecklistMeta(med, done) {
  const config = medicineConfig(med);
  const event = medicineEvent(med, todayKey());
  if (done && event) return `Listo ${formatTime(new Date(event.timeISO))} · ${config.dose}`;
  if (done) return `Listo · ${config.dose}`;
  return `Pendiente · ${config.dose}`;
}

function renderPediatricianSummary() {
  const summary = pediatricianSummary();
  els.pediatricianSummary.innerHTML = `
    <span>Últimos ${historyRangeDays} días · ${summary.range}</span>
    <div class="pediatrician-grid">
      ${pediatricianStat("Tomas/día", summary.feedsPerDay)}
      ${pediatricianStat("Pañales/día", summary.diapersPerDay)}
      ${pediatricianStat("Popó", summary.poopCount)}
      ${pediatricianStat("Notas", summary.notesCount)}
    </div>
    <div>${escapeHTML(summary.highlight)}</div>
  `;
}

function pediatricianStat(label, value) {
  return `<div class="pediatrician-stat"><span>${label}</span><strong>${value}</strong></div>`;
}

function pediatricianSummary() {
  const summary = historySummary(historyRangeDays);
  const notes = summary.notes;
  const weights = state.events
    .filter((event) => event.type === "weight" && eventDateKey(event) <= todayKey())
    .sort(byNewest);
  const noteText = notes.slice(-3).map((event) => event.text).join(" · ");
  const highlight = [
    weights[0] ? `Último peso ${formatKg(weights[0].kg)}.` : "",
    summary.meds.length ? `${summary.meds.length} medicinas registradas.` : "",
    noteText ? `Notas: ${noteText}.` : "Sin notas de alerta registradas.",
  ].filter(Boolean).join(" ");

  return {
    range: summary.range,
    feedsPerDay: summary.feedsPerDay,
    diapersPerDay: summary.diapersPerDay,
    poopCount: summary.poopCount,
    notesCount: notes.length,
    highlight,
  };
}

function pediatricianSummaryText() {
  const summary = pediatricianSummary();
  return [
    `Resumen pediatra (${summary.range})`,
    `Tomas/día: ${summary.feedsPerDay}`,
    `Pañales/día: ${summary.diapersPerDay}`,
    `Popó: ${summary.poopCount}`,
    `Notas: ${summary.notesCount}`,
    summary.highlight,
  ].join("\n");
}

async function copyPediatricianSummary() {
  await navigator.clipboard.writeText(pediatricianSummaryText());
  state.lastExportISO = new Date().toISOString();
  saveState();
  render();
  haptic("save");
  showToast("Resumen copiado");
}

function averagePerDay(total, days) {
  return (total / days).toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function lastDays(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - index));
    return todayKey(date);
  });
}

function backupStatusText() {
  if (!state.lastExportISO) return "Guardado en este teléfono · aún sin exportar";
  return `Guardado en este teléfono · exportado ${timeAgo(new Date(state.lastExportISO))}`;
}

function manualPreviewText() {
  const type = els.manualType.value;
  const time = els.manualTime.value || currentTimeValue();
  if (type === "feed") return `Toma de ${els.manualDuration.value || 15} min · ${SIDE_LABELS[els.manualSide.value]} · ${time}`;
  if (type === "diaper") return `Pañal · ${DIAPER_PRESETS[els.manualDiaper.value]?.label || "Pañal"} · ${time}`;
  if (type === "medicine") return `${medicineConfig(els.manualMedicine.value).name} · ${medicineConfig(els.manualMedicine.value).dose} · ${time}`;
  if (type === "weight") return `Peso · ${els.manualWeight.value || "kg pendiente"} · ${time}`;
  return `Nota · ${time}`;
}

function eventsForDate(dateKey) {
  return state.events.filter((event) => eventDateKey(event) === dateKey);
}

function eventDateKey(event) {
  return dayKeyFromISO(event.startISO || event.timeISO);
}

function groupEventsByDate() {
  const map = new Map();
  state.events.forEach((event) => {
    const key = eventDateKey(event);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(event);
  });
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

function exportMarkdown() {
  const groups = groupEventsByDate().sort((a, b) => a[0].localeCompare(b[0]));
  if (!groups.length) return "";
  return groups
    .map(([date, events]) => {
      const feeds = events.filter((event) => event.type === "feed").sort(byOldest);
      const diapers = events.filter((event) => event.type === "diaper").sort(byOldest);
      const meds = events.filter((event) => event.type === "med").sort(byOldest);
      const notes = events.filter((event) => event.type === "note").sort(byOldest);
      const weights = events.filter((event) => event.type === "weight").sort(byOldest);
      const weightText = weights[0] ? `  ÚLTIMO PESO ${formatKg(weights[0].kg)}` : "";

      const feedLines = feeds.map(feedToMarkdown);
      const medLines = meds.map((event) => {
        const config = medicineConfig(event.med);
        return `${formatTime(new Date(event.timeISO))} - ${config.name.toUpperCase()} ${event.dose || config.dose}${event.note ? ` ${event.note}` : ""}`.trim();
      });
      const noteLines = notes.map((event) => `Nota ${formatTime(new Date(event.timeISO))}: ${event.text}`);
      const diaperIcons = "🚼".repeat(diapers.length);
      const diaperLines = diapers.map((event) => {
        const details = event.details?.length ? ` (${event.details.join(", ")})` : "";
        return `${formatTime(new Date(event.timeISO))} ${diaperIcon(event)}${details}${event.note ? ` ${event.note}` : ""}`;
      });

      return [
        `**++${state.settings.babyName} 🍼++${weightText}**`,
        `**${dateToShort(date)}**`,
        "",
        ...feedLines,
        ...medLines,
        ...noteLines,
        "",
        `**++${state.settings.babyName} 💩++**`,
        `**${dateToShort(date)}**`,
        diaperIcons || "Sin pañales",
        ...diaperLines,
      ].join("\n");
    })
    .join("\n\n");
}

function feedToMarkdown(event) {
  const start = formatTime(new Date(event.startISO));
  const end = event.endISO ? formatTime(new Date(event.endISO)) : "";
  const range = end ? `${start} - ${end}` : start;
  const tags = (event.tags || []).map((tag) => TAG_ICON[tag] || tag).join("");
  const note = event.note ? ` ${event.note}` : "";
  return `${range} - ${SIDE_EXPORT[event.side]} ${tags}${note}`.trim();
}

async function copyMarkdown() {
  const text = exportMarkdown();
  if (!text) return showToast("Sin registros");
  await navigator.clipboard.writeText(text);
  markExported();
  showToast("Markdown copiado");
}

async function shareMarkdown() {
  const text = exportMarkdown();
  if (!text) return showToast("Sin registros");
  const fileName = exportFileName();
  const title = `${state.settings.babyName} · ${dateToShort(todayKey())}`;

  try {
    if (navigator.share) {
      const file = new File([text], fileName, { type: "text/markdown" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title,
          text: `Registro de ${state.settings.babyName}`,
          files: [file],
        });
      } else {
        await navigator.share({ title, text });
      }
      markExported();
      showToast("Exportación compartida");
      return;
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(text);
    markExported();
    showToast("Compartir no disponible · copiado");
  } catch {
    showToast("Compartir no disponible");
  }
}

function downloadMarkdown() {
  const text = exportMarkdown();
  if (!text) return showToast("Sin registros");
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportFileName();
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  markExported();
  showToast("Archivo listo");
}

function markExported() {
  state.lastExportISO = new Date().toISOString();
  saveState();
  render();
}

function exportFileName() {
  const base = (state.settings.babyName || "federico")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "federico";
  return `${base}-${todayKey()}.md`;
}

function byNewest(a, b) {
  return new Date(b.startISO || b.timeISO) - new Date(a.startISO || a.timeISO);
}

function byOldest(a, b) {
  return new Date(a.startISO || a.timeISO) - new Date(b.startISO || b.timeISO);
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(date);
}

function formatTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes}${ampm}`;
}

function currentTimeValue() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function timeInputValue(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayKeyFromISO(iso) {
  return todayKey(new Date(iso));
}

function dateToShort(key) {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

function dateToHuman(key) {
  const date = new Date(`${key}T12:00:00`);
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

function minutesBetween(start, end) {
  return Math.max(1, Math.round((end - start) / 60000));
}

function elapsedClock(start, end) {
  const total = Math.max(0, Math.floor((end - start) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function timeAgo(date) {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function babyAgeText() {
  const birth = new Date(`${state.settings.birthDate}T12:00:00`);
  const today = new Date();
  const days = Math.floor((stripTime(today) - stripTime(birth)) / 86400000);
  if (!Number.isFinite(days) || days < 0) return "";
  if (days < 60) return pluralize(days, "día", "días");
  const weeks = Math.floor(days / 7);
  return pluralize(weeks, "semana", "semanas");
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function pluralize(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function diaperIcon(event) {
  return `${event.pee ? "💧" : ""}${event.poop ? "💩" : ""}${event.gas ? "💨" : ""}` || "🚼";
}

function diaperLabel(event) {
  const parts = [];
  if (event.pee) parts.push("pis");
  if (event.poop) parts.push("popó");
  if (event.gas) parts.push("gases");
  return parts.join(" + ") || "pañal";
}

function formatKg(value) {
  return `${Number(value).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 3 })}kg`;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function haptic(kind = "tap") {
  if (!("vibrate" in navigator)) return;
  const patterns = {
    tap: 8,
    save: [10, 20, 10],
    soft: 6,
    start: 12,
  };
  navigator.vibrate(patterns[kind] || 8);
}

function showToast(message, undoHandler = null) {
  window.clearTimeout(toastTimer);
  pendingUndo = undoHandler;
  els.toast.innerHTML = "";
  const text = document.createElement("span");
  text.textContent = message;
  els.toast.append(text);
  if (undoHandler) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Deshacer";
    button.addEventListener("click", () => {
      const handler = pendingUndo;
      pendingUndo = null;
      els.toast.classList.remove("is-visible");
      if (handler) handler();
    });
    els.toast.append(button);
  }
  els.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    pendingUndo = null;
    els.toast.classList.remove("is-visible");
  }, undoHandler ? 4200 : 1800);
}
