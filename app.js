import { HISTORICAL_IMPORT } from "./historical-data.js?v=23";

const STORAGE_KEY = "fede-baby-tracker-v3";
const APP_VERSION = "v57";
const BACKUP_VERSION = 1;
const APP_VERSION_KEY = `${STORAGE_KEY}-app-version`;
const LOVE_MESSAGES_PIN = "1234";

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

const DEFAULT_MEDICINES = [
  {
    id: "vitaminD",
    short: "D",
    name: "Vitamina D",
    dose: "2 gotas",
    time: "09:00",
    reminder: true,
    toast: "Vitamina D lista",
  },
  {
    id: "biogaia",
    short: "B",
    name: "BioGaia Reuteri",
    dose: "5 gotas",
    time: "09:00",
    reminder: true,
    toast: "BioGaia listo",
  },
];

const MEDICINES = Object.fromEntries(DEFAULT_MEDICINES.map((medicine) => [medicine.id, medicine]));

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

const LATE_DAY_LOVE_NOTES = [
  "Mami, ya vamos por casi todo el día de tetica. Gracias por cuidarme una y otra vez. Te amo muchísimo.",
  "Mami, hoy me alimentaste todo el día con puro amor. Yo sé que cansa. Gracias por estar para mí.",
  "Casi cerramos el día, mami. Tu tetica y tus brazos son mi lugar favorito. Gracias por tanto amor.",
  "Mami, qué jornada la de hoy. Yo estoy chiquito, pero sé que eres una campeona. Te amo.",
];

const DEFAULT_STATE = {
  settings: {
    babyName: "Federico",
    birthDate: "2026-05-01",
    vitaminTime: "09:00",
    colicMedicineName: "BioGaia Reuteri",
    colicDose: "5 gotas",
    medicines: DEFAULT_MEDICINES.map((medicine) => ({ ...medicine })),
    nightMode: false,
    loveMessages: [...LOVE_NOTES],
  },
  events: [],
  vitaminDByDate: {},
  imports: {},
  medicineReminderNotified: {},
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
let loveMessagesUnlocked = false;
let activeTab = "today";

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
  medicineChecklist: $("#medicineChecklist"),
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
  rhythmCard: $("#rhythmCard"),
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
  shareBackupButton: $("#shareBackupButton"),
  downloadBackupButton: $("#downloadBackupButton"),
  shareMarkdownButton: $("#shareMarkdownButton"),
  copyMarkdownButton: $("#copyMarkdownButton"),
  downloadMarkdownButton: $("#downloadMarkdownButton"),
  settingsForm: $("#settingsForm"),
  babyNameInput: $("#babyNameInput"),
  birthDateInput: $("#birthDateInput"),
  medicineSettingsList: $("#medicineSettingsList"),
  medicineReminderStatus: $("#medicineReminderStatus"),
  medicineNameInput: $("#medicineNameInput"),
  medicineDoseInput: $("#medicineDoseInput"),
  medicineTimeInput: $("#medicineTimeInput"),
  medicineReminderInput: $("#medicineReminderInput"),
  addMedicineButton: $("#addMedicineButton"),
  enableNotificationsButton: $("#enableNotificationsButton"),
  loveMessagesSecret: $("#loveMessagesSecret"),
  loveMessagesLockedPanel: $("#loveMessagesLockedPanel"),
  loveMessagesPinInput: $("#loveMessagesPinInput"),
  loveMessagesPinMeta: $("#loveMessagesPinMeta"),
  unlockLoveMessagesButton: $("#unlockLoveMessagesButton"),
  loveMessagesEditor: $("#loveMessagesEditor"),
  loveMessagesInput: $("#loveMessagesInput"),
  resetLoveMessagesButton: $("#resetLoveMessagesButton"),
  lockLoveMessagesButton: $("#lockLoveMessagesButton"),
  backupStatus: $("#backupStatus"),
  restoreBackupButton: $("#restoreBackupButton"),
  restoreBackupInput: $("#restoreBackupInput"),
  restoreBackupMeta: $("#restoreBackupMeta"),
  appInstallStatus: $("#appInstallStatus"),
  appVersionStatus: $("#appVersionStatus"),
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
announceAppVersion();
setInterval(tick, 1000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").then((registration) => registration.update()).catch(() => {});
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
  els.addMedicineButton.addEventListener("click", addMedicineFromSettings);
  els.enableNotificationsButton.addEventListener("click", requestMedicineNotifications);

  els.noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = els.quickNoteInput.value.trim();
    if (!text) return;
    logNote(text);
    els.quickNoteInput.value = "";
  });

  els.shareBackupButton.addEventListener("click", shareBackup);
  els.downloadBackupButton.addEventListener("click", downloadBackup);
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
    state.settings.loveMessages = parseLoveMessagesInput(els.loveMessagesInput.value);
    saveState();
    render();
    showToast("Ajustes guardados");
  });

  els.unlockLoveMessagesButton.addEventListener("click", unlockLoveMessages);
  els.loveMessagesPinInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    unlockLoveMessages();
  });
  els.loveMessagesPinInput.addEventListener("input", () => {
    if (!loveMessagesUnlocked) els.loveMessagesPinMeta.textContent = "Solo para editar las sorpresas.";
  });
  els.loveMessagesInput.addEventListener("change", saveLoveMessagesFromEditor);

  els.lockLoveMessagesButton.addEventListener("click", () => {
    saveLoveMessagesFromEditor();
    loveMessagesUnlocked = false;
    els.loveMessagesPinInput.value = "";
    renderLoveMessagesSecret();
    showToast("Mensajes ocultos");
  });

  els.resetLoveMessagesButton.addEventListener("click", () => {
    state.settings.loveMessages = [...LOVE_NOTES];
    saveState();
    render();
    showToast("Mensajes originales");
  });

  els.restoreBackupButton.addEventListener("click", () => els.restoreBackupInput.click());
  els.restoreBackupInput.addEventListener("change", () => restoreBackupFromFile(els.restoreBackupInput.files?.[0]));
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

  document.addEventListener("change", (event) => {
    const timeInput = event.target.closest("[data-medicine-time]");
    if (timeInput) {
      updateMedicineSetting(timeInput.dataset.medicineTime, { time: timeInput.value });
      return;
    }
    const reminderInput = event.target.closest("[data-medicine-reminder]");
    if (reminderInput) {
      updateMedicineSetting(reminderInput.dataset.medicineReminder, { reminder: reminderInput.checked });
    }
  });

  document.addEventListener("click", (event) => {
    const pressedButton = event.target.closest("button");
    if (pressedButton) pulseButton(pressedButton);

    const medicineButton = event.target.closest("[data-toggle-med]");
    if (medicineButton) {
      toggleMedicine(medicineButton.dataset.toggleMed);
      return;
    }
    const removeMedicineButton = event.target.closest("[data-remove-medicine]");
    if (removeMedicineButton) {
      removeMedicine(removeMedicineButton.dataset.removeMedicine);
      return;
    }

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
    if (!isStandaloneMode()) els.installButton.hidden = false;
    renderAppInstallStatus();
  });

  els.installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installButton.hidden = true;
    renderAppInstallStatus();
  });

  window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", renderAppInstallStatus);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function defaultState() {
  return structuredClone(DEFAULT_STATE);
}

function normalizeState(saved = {}) {
  const base = defaultState();
  const source = isPlainObject(saved) ? saved : {};
  const next = {
    ...base,
    ...source,
    settings: {
      ...base.settings,
      ...(isPlainObject(source.settings) ? source.settings : {}),
    },
    imports: {
      ...base.imports,
      ...(isPlainObject(source.imports) ? source.imports : {}),
    },
    loveNotesSeen: {
      ...base.loveNotesSeen,
      ...(isPlainObject(source.loveNotesSeen) ? source.loveNotesSeen : {}),
    },
    medicineReminderNotified: {
      ...base.medicineReminderNotified,
      ...(isPlainObject(source.medicineReminderNotified) ? source.medicineReminderNotified : {}),
    },
    vitaminDByDate: isPlainObject(source.vitaminDByDate) ? source.vitaminDByDate : {},
    events: Array.isArray(source.events) ? source.events.filter(Boolean) : [],
    activeFeed: isPlainObject(source.activeFeed) ? source.activeFeed : null,
    lastExportISO: typeof source.lastExportISO === "string" ? source.lastExportISO : "",
  };
  next.settings.medicines = normalizeMedicines(next.settings.medicines, next.settings);
  next.settings.loveMessages = normalizeLoveMessages(next.settings.loveMessages);
  return next;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  document.body.dataset.activeTab = activeTab;
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
  els.todayEventTotal.textContent = todayEvents.length ? `${todayEvents.length} hoy` : "Sin registros";
  els.lastSide.textContent = SIDE_LABELS[recommendedSide];
  $$("[data-side-button]").forEach((button) => {
    button.classList.toggle("is-recommended", button.dataset.sideButton === recommendedSide);
  });
  els.sinceLastFeed.textContent = latestFeed ? timeAgo(new Date(latestFeed.endISO || latestFeed.startISO)) : "—";
  els.lastFeedStamp.textContent = latestFeed ? `Última ${formatTime(new Date(latestFeed.endISO || latestFeed.startISO))}` : "Sin toma hoy";

  els.trustLine.textContent = "Guardado en este teléfono";

  els.babyNameInput.value = state.settings.babyName;
  els.birthDateInput.value = state.settings.birthDate;
  els.loveMessagesInput.value = loveNoteMessages().join("\n");
  renderLoveMessagesSecret();
  els.backupStatus.textContent = backupStatusText();
  els.restoreBackupMeta.textContent = `Reemplaza los datos locales · ${pluralize(state.events.length, "registro", "registros")} actuales`;
  renderAppInstallStatus();
  renderImportStatus();
  renderMedicineChecklist();
  renderMedicineOptions();
  renderMedicineSettings();
  renderMedicineNotificationStatus();

  renderActiveFeed();
  els.alertStack.innerHTML = "";
  renderTimeline(todayEvents);
  renderHistory();
  renderPediatricianSummary();
  renderMarkdown();
}

function renderLoveMessagesSecret() {
  els.loveMessagesSecret.dataset.unlocked = String(loveMessagesUnlocked);
  els.loveMessagesLockedPanel.hidden = loveMessagesUnlocked;
  els.loveMessagesEditor.hidden = !loveMessagesUnlocked;
  if (!loveMessagesUnlocked && !els.loveMessagesPinInput.value) {
    els.loveMessagesPinMeta.textContent = "Solo para editar las sorpresas.";
  }
}

function unlockLoveMessages() {
  const pin = els.loveMessagesPinInput.value.trim();
  if (pin !== LOVE_MESSAGES_PIN) {
    els.loveMessagesPinMeta.textContent = "PIN incorrecto.";
    els.loveMessagesPinInput.select();
    showToast("PIN incorrecto");
    return;
  }
  loveMessagesUnlocked = true;
  els.loveMessagesPinInput.value = "";
  renderLoveMessagesSecret();
  els.loveMessagesInput.focus();
  showToast("Mensajes desbloqueados");
}

function saveLoveMessagesFromEditor() {
  if (!els.loveMessagesInput) return;
  state.settings.loveMessages = parseLoveMessagesInput(els.loveMessagesInput.value);
  els.loveMessagesInput.value = loveNoteMessages().join("\n");
  saveState();
}

function renderActiveFeed() {
  if (!state.activeFeed) {
    els.activeFeedPanel.hidden = true;
    delete els.activeFeedPanel.dataset.side;
    document.body.classList.remove("has-active-feed");
    return;
  }

  const openSegment = state.activeFeed.segments.find((segment) => !segment.endISO);
  const side = openSegment?.side || state.activeFeed.side;
  els.activeFeedPanel.hidden = false;
  els.activeFeedPanel.dataset.side = side;
  document.body.classList.add("has-active-feed");
  els.activeFeedSide.textContent = `Toma en curso · empezó ${formatTime(new Date(state.activeFeed.startISO))}`;
  els.activeFeedHint.textContent = activeFeedHintText();
  els.activeFeedTimer.textContent = elapsedClock(new Date(state.activeFeed.startISO), new Date());
}

function renderMedicineChecklist() {
  const medicines = medicineList();
  if (!medicines.length) {
    els.medicineChecklist.innerHTML = `
      <div class="empty-state empty-state--warm">
        <strong>Sin medicinas</strong>
        <span>Agrega la medicina en Ajustes y aparecerá aquí.</span>
      </div>
    `;
    return;
  }

  els.medicineChecklist.innerHTML = medicines.map((medicine) => {
    const done = isMedicineDone(medicine.id, todayKey());
    const cardClass = [
      "medicine-card",
      medicine.id === "biogaia" ? "medicine-card--bio" : "",
      done ? "is-done" : "",
    ].filter(Boolean).join(" ");
    return `
      <button class="${cardClass}" data-toggle-med="${escapeHTML(medicine.id)}" type="button">
        <span class="medicine-card__mark" aria-hidden="true">${done ? "✓" : escapeHTML(medicine.short)}</span>
        <strong>${escapeHTML(displayMedicineName(medicine.name))}</strong>
        <small>${escapeHTML(medicineChecklistMeta(medicine.id, done))}</small>
      </button>
    `;
  }).join("");
}

function renderMedicineOptions() {
  const medicines = allMedicineConfigs();
  const options = medicines.length
    ? medicines.map((medicine) => `<option value="${escapeHTML(medicine.id)}">${escapeHTML(`${medicine.name} · ${medicine.dose}`)}</option>`).join("")
    : '<option value="">Sin medicinas</option>';
  els.manualMedicine.innerHTML = options;
  els.editMedicine.innerHTML = options;
}

function renderMedicineSettings() {
  const medicines = medicineList();
  els.medicineSettingsList.innerHTML = medicines.length
    ? medicines.map((medicine) => `
      <article class="medicine-setting-card">
        <div class="medicine-setting-card__main">
          <span class="medicine-setting-card__mark" aria-hidden="true">${escapeHTML(medicine.short)}</span>
          <div>
            <strong>${escapeHTML(medicine.name)}</strong>
            <small>${escapeHTML(medicine.dose)}${medicine.time ? ` · ${escapeHTML(formatTimeFromValue(medicine.time))}` : ""}</small>
          </div>
        </div>
        <label>
          <span>Hora</span>
          <input data-medicine-time="${escapeHTML(medicine.id)}" type="time" value="${escapeHTML(medicine.time || "")}">
        </label>
        <label class="medicine-reminder-toggle">
          <input data-medicine-reminder="${escapeHTML(medicine.id)}" type="checkbox" ${medicine.reminder ? "checked" : ""}>
          <span>Recordar</span>
        </label>
        <button class="tiny-command" data-remove-medicine="${escapeHTML(medicine.id)}" type="button">Quitar</button>
      </article>
    `).join("")
    : `
      <div class="empty-state empty-state--warm">
        <strong>No hay medicinas activas</strong>
        <span>Agrega una para verla en la checklist diaria.</span>
      </div>
    `;
}

function renderMedicineNotificationStatus() {
  if (!("Notification" in window)) {
    els.medicineReminderStatus.textContent = "Avisos no disponibles";
    els.enableNotificationsButton.disabled = true;
    els.enableNotificationsButton.textContent = "Sin avisos";
    return;
  }

  const permission = Notification.permission;
  if (permission === "granted") {
    els.medicineReminderStatus.textContent = "Avisos activos";
    els.enableNotificationsButton.disabled = true;
    els.enableNotificationsButton.textContent = "Avisos activos";
    return;
  }
  if (permission === "denied") {
    els.medicineReminderStatus.textContent = "Avisos bloqueados";
    els.enableNotificationsButton.disabled = true;
    els.enableNotificationsButton.textContent = "Bloqueados";
    return;
  }
  els.medicineReminderStatus.textContent = "Avisos opcionales";
  els.enableNotificationsButton.disabled = false;
  els.enableNotificationsButton.textContent = "Permitir avisos";
}

function renderTimeline(events) {
  if (!events.length && !state.activeFeed) {
    els.todayTimeline.innerHTML = `
      <div class="empty-state empty-state--warm">
        <strong>Hoy empieza limpio</strong>
        <span>Las tomas, pañales y medicinas aparecerán aquí al guardarlas.</span>
      </div>
    `;
    return;
  }

  const sortedEvents = events.sort(byNewest);
  const visibleEvents = sortedEvents.slice(0, 3);
  const hiddenCount = Math.max(0, sortedEvents.length - visibleEvents.length);
  els.todayTimeline.innerHTML = [
    ...visibleEvents.map((event) => eventCard(event)),
    hiddenCount ? `<div class="timeline-more">${pluralize(hiddenCount, "registro más", "registros más")} en Días</div>` : "",
  ].join("");
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
  if (event.type === "med") return event.short || medicineConfig(event.med).short;
  return "＋";
}

function eventTitle(event) {
  if (event.type === "feed") return `Toma · ${feedSideStory(event)}`;
  if (event.type === "diaper") return `Pañal · ${diaperLabel(event)}`;
  if (event.type === "weight") return `Peso · ${formatKg(event.kg)}`;
  if (event.type === "med") return event.name || medicineConfig(event.med).name;
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
    els.recentDaysList.innerHTML = `
      <div class="empty-state empty-state--warm">
        <strong>Sin historial todavía</strong>
        <span>Cuando registre unos días, aquí verá patrones sin tener que leer una lista infinita.</span>
      </div>
    `;
    els.monthArchive.innerHTML = "";
    els.dayDetailPanel.innerHTML = `<div class="empty-state">El detalle aparecerá al elegir un día.</div>`;
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
  renderRhythmCard();
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

function renderRhythmCard() {
  const keys = lastDays(historyRangeDays);
  const days = keys.map((key) => {
    const events = eventsForDate(key);
    const stats = dayStats(events);
    return {
      key,
      feeds: stats.feeds.length,
      diapers: stats.diapers.length,
      meds: stats.meds.length,
    };
  });
  const maxFeeds = Math.max(1, ...days.map((day) => day.feeds));
  const maxDiapers = Math.max(1, ...days.map((day) => day.diapers));
  const hasData = days.some((day) => day.feeds || day.diapers || day.meds);

  if (!hasData) {
    els.rhythmCard.innerHTML = `
      <div class="rhythm-card__head">
        <div>
          <span>Ritmo</span>
          <h3>Sin datos suficientes</h3>
        </div>
        <small>${historyRangeDays} días</small>
      </div>
      <div class="empty-state empty-state--compact">El gráfico se llenará solo con los registros.</div>
    `;
    return;
  }

  els.rhythmCard.innerHTML = `
    <div class="rhythm-card__head">
      <div>
        <span>Ritmo</span>
        <h3>Tomas y pañales por día</h3>
      </div>
      <small>${historyRangeDays} días</small>
    </div>
    <div class="rhythm-chart" aria-label="Tomas y pañales de los últimos ${historyRangeDays} días">
      ${days.map((day) => rhythmDay(day, maxFeeds, maxDiapers)).join("")}
    </div>
    <div class="rhythm-card__legend">
      <span><i class="legend-dot legend-dot--feed"></i>Tomas</span>
      <span><i class="legend-dot legend-dot--diaper"></i>Pañales</span>
      <span><i class="legend-dot legend-dot--med"></i>Medicina registrada</span>
    </div>
  `;
}

function rhythmDay(day, maxFeeds, maxDiapers) {
  const feedHeight = Math.max(day.feeds ? 14 : 4, Math.round((day.feeds / maxFeeds) * 72));
  const diaperHeight = Math.max(day.diapers ? 14 : 4, Math.round((day.diapers / maxDiapers) * 72));
  return `
    <div class="rhythm-day" title="${dateToHuman(day.key)} · ${day.feeds} tomas · ${day.diapers} pañales">
      <div class="rhythm-day__bars">
        <span class="rhythm-bar rhythm-bar--feed" style="height:${feedHeight}%"></span>
        <span class="rhythm-bar rhythm-bar--diaper" style="height:${diaperHeight}%"></span>
      </div>
      <span class="rhythm-day__label">${dateToShort(day.key)}</span>
      ${day.meds ? `<span class="rhythm-day__med" aria-label="Medicina registrada">✓</span>` : ""}
    </div>
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
  els.themeColorMeta?.setAttribute("content", state.settings.nightMode ? "#101014" : "#f7f3ec");
}

function renderAppInstallStatus() {
  if (!els.appInstallStatus || !els.appVersionStatus) return;
  const installed = isStandaloneMode();
  els.appVersionStatus.textContent = APP_VERSION;
  els.appInstallStatus.textContent = installed
    ? `Instalada en pantalla de inicio · ${APP_VERSION}`
    : `Abierta en navegador · ${APP_VERSION} · en iPhone: compartir y añadir a inicio`;
  if (installed) els.installButton.hidden = true;
}

function announceAppVersion() {
  try {
    const previousVersion = localStorage.getItem(APP_VERSION_KEY);
    if (previousVersion && previousVersion !== APP_VERSION) {
      window.setTimeout(() => showToast(`App actualizada · ${APP_VERSION}`), 650);
    }
    localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
  } catch {
    // Version toasts are a nicety; the tracker should never depend on them.
  }
}

function isStandaloneMode() {
  return Boolean(window.navigator.standalone) || Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches);
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
  medicineList()
    .filter((medicine) => !isMedicineDone(medicine.id, today))
    .slice(0, 2)
    .forEach((medicine) => {
      alerts.push({ tone: "care", label: "Pendiente", text: `${displayMedicineName(medicine.name)} · ${medicine.dose}` });
    });
  const diaperCount = todayEvents.filter((event) => event.type === "diaper").length;
  const hour = new Date().getHours();
  if (hour >= 18 && diaperCount < 4) alerts.push({ tone: "quiet", label: "Pañales", text: `${diaperCount} registrados hoy` });
  return alerts.slice(0, 3);
}

function tick() {
  renderActiveFeed();
  maybeNotifyMedicineReminders();
  const latestFeed = [...state.events].filter((event) => event.type === "feed").sort(byNewest)[0];
  if (latestFeed) {
    els.sinceLastFeed.textContent = timeAgo(new Date(latestFeed.endISO || latestFeed.startISO));
  }
}

function setTab(tabName) {
  activeTab = tabName;
  document.body.dataset.activeTab = tabName;
  $$("[data-tab]").forEach((screen) => screen.classList.toggle("is-active", screen.dataset.tab === tabName));
  $$("[data-tab-target]").forEach((button) => button.classList.toggle("is-active", button.dataset.tabTarget === tabName));
  if (tabName === "export") renderMarkdown();
}

function pulseButton(button) {
  button.classList.remove("is-pressed");
  void button.offsetWidth;
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 220);
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
    .filter((event) => event.type === "diaper" && event.poop && eventDateKey(event) === today)
    .sort(byNewest)[0];
  if (!latestDiaper) {
    haptic("soft");
    showToast("Primero registra popó");
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

function addMedicineFromSettings() {
  const name = els.medicineNameInput.value.trim();
  const dose = els.medicineDoseInput.value.trim() || "Dosis";
  const time = els.medicineTimeInput.value || "09:00";
  const reminder = els.medicineReminderInput.checked;
  if (!name) {
    els.medicineNameInput.focus();
    showToast("Falta el nombre");
    return;
  }

  const medicines = medicineList();
  const baseId = medicineIdFromName(name);
  let id = baseId;
  let suffix = 2;
  while (medicines.some((medicine) => medicine.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  state.settings.medicines = [
    ...medicines,
    {
      id,
      short: medicineShort(name),
      name,
      dose,
      time,
      reminder,
      toast: `${displayMedicineName(name)} lista`,
    },
  ];
  els.medicineNameInput.value = "";
  els.medicineDoseInput.value = "";
  els.medicineTimeInput.value = time;
  els.medicineReminderInput.checked = true;
  saveState();
  render();
  haptic("save");
  showToast(`${displayMedicineName(name)} agregada`);
}

function updateMedicineSetting(id, updates) {
  const medicines = medicineList();
  const index = medicines.findIndex((medicine) => medicine.id === id);
  if (index < 0) return;
  medicines[index] = normalizeMedicine({ ...medicines[index], ...updates });
  state.settings.medicines = medicines;
  saveState();
  renderMedicineChecklist();
  renderMedicineSettings();
  renderMedicineNotificationStatus();
  haptic("tap");
}

function removeMedicine(id) {
  const medicines = medicineList();
  const medicine = medicines.find((item) => item.id === id);
  if (!medicine) return;
  if (medicines.length <= 1) {
    showToast("Deja al menos una medicina");
    return;
  }
  state.settings.medicines = medicines.filter((item) => item.id !== id);
  saveState();
  render();
  haptic("soft");
  showToast(`${displayMedicineName(medicine.name)} quitada`, () => {
    state.settings.medicines = medicines;
    saveState();
    render();
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
    if (state.medicineReminderNotified) delete state.medicineReminderNotified[`${today}-${med}`];
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
    name: config.name,
    short: config.short,
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
    if (event.type === "med" && state.medicineReminderNotified) delete state.medicineReminderNotified[`${eventDateKey(event)}-${event.med}`];
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
      name: config.name,
      short: config.short,
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
    original.name = config.name;
    original.short = config.short;
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

function normalizeLoveMessages(messages) {
  const source = Array.isArray(messages)
    ? messages
    : typeof messages === "string"
      ? messages.split("\n")
      : LOVE_NOTES;
  const clean = source
    .map((message) => String(message).trim())
    .filter(Boolean)
    .map((message) => message.slice(0, 180))
    .slice(0, 24);
  return clean.length ? clean : [...LOVE_NOTES];
}

function parseLoveMessagesInput(value) {
  return normalizeLoveMessages(value);
}

function loveNoteMessages() {
  return normalizeLoveMessages(state.settings?.loveMessages);
}

function maybeBuildLoveNote(event) {
  if (event.type !== "feed") return null;
  const dateKey = eventDateKey(event);
  const feedCount = state.events.filter((item) => item.type === "feed" && eventDateKey(item) === dateKey).length;
  if (feedCount < 3) return null;

  state.loveNotesSeen = state.loveNotesSeen || {};
  const lateDayLoveNote = maybeBuildLateDayLoveNote(dateKey, feedCount);
  if (lateDayLoveNote) return lateDayLoveNote;

  if (feedCount % 3 !== 0) return null;

  const key = `${dateKey}-${feedCount}`;
  if (state.loveNotesSeen[key]) return null;

  const messages = loveNoteMessages();
  const index = (feedCount / 3 - 1) % messages.length;
  const note = messages[index];
  const emoji = LOVE_NOTE_EMOJIS[index % LOVE_NOTE_EMOJIS.length];
  state.loveNotesSeen[key] = new Date().toISOString();
  return { key, dateKey, feedCount, note, emoji };
}

function maybeBuildLateDayLoveNote(dateKey, feedCount) {
  const target = lateDayLoveTarget();
  if (feedCount !== target) return null;

  const key = `${dateKey}-late-day-${target}`;
  if (state.loveNotesSeen[key]) return null;

  const index = Math.abs(hashString(dateKey)) % LATE_DAY_LOVE_NOTES.length;
  state.loveNotesSeen[key] = new Date().toISOString();
  return {
    key,
    dateKey,
    feedCount,
    note: LATE_DAY_LOVE_NOTES[index],
    emoji: LOVE_NOTE_EMOJIS[index % LOVE_NOTE_EMOJIS.length],
  };
}

function lateDayLoveTarget() {
  const usualDailyFeeds = typicalDailyFeedCount();
  return Math.max(6, usualDailyFeeds - 2);
}

function typicalDailyFeedCount() {
  const stateCounts = completedDailyFeedCounts(state.events);
  const sourceCounts = stateCounts.length >= 7 ? stateCounts : completedDailyFeedCounts(HISTORICAL_IMPORT.events);
  if (!sourceCounts.length) return 12;
  return clamp(Math.round(median(sourceCounts)), 8, 16);
}

function completedDailyFeedCounts(events) {
  const today = todayKey();
  const counts = new Map();
  events
    .filter((event) => event.type === "feed")
    .forEach((event) => {
      const key = eventDateKey(event);
      if (key === today) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  return Array.from(counts.values()).filter((count) => count > 0);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value) {
  return Array.from(value).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function showLoveNote({ dateKey, feedCount, note, emoji }) {
  if (!els.loveNoteDialog?.showModal) {
    showToast(note);
    return;
  }
  els.loveNoteMark.textContent = emoji || "💛";
  els.loveNoteCount.textContent = dateKey === todayKey()
    ? `${feedCount} tomas hoy ${emoji || "💛"}`
    : `${feedCount} tomas el ${dateToShort(dateKey)} ${emoji || "💛"}`;
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

function medicineList() {
  return normalizeMedicines(state.settings?.medicines, state.settings);
}

function allMedicineConfigs() {
  const map = new Map(medicineList().map((medicine) => [medicine.id, medicine]));
  state.events
    .filter((event) => event.type === "med" && event.med && !map.has(event.med))
    .forEach((event) => {
      map.set(event.med, {
        ...medicineConfig(event.med),
        name: event.name || medicineConfig(event.med).name,
        short: event.short || medicineConfig(event.med).short,
        dose: event.dose || medicineConfig(event.med).dose,
      });
    });
  return Array.from(map.values());
}

function normalizeMedicines(source, settings = {}) {
  const defaultMedicines = DEFAULT_MEDICINES.map((medicine) => {
    if (medicine.id === "vitaminD") {
      return {
        ...medicine,
        time: settings.vitaminTime || medicine.time,
      };
    }
    if (medicine.id === "biogaia") {
      return {
        ...medicine,
        name: settings.colicMedicineName || medicine.name,
        dose: settings.colicDose || medicine.dose,
      };
    }
    return { ...medicine };
  });
  const sourceMedicines = Array.isArray(source) && source.length ? source : defaultMedicines;
  const seen = new Set();
  const normalized = sourceMedicines
    .map((medicine) => normalizeMedicine(medicine, settings))
    .filter((medicine) => {
      if (!medicine.name || seen.has(medicine.id)) return false;
      seen.add(medicine.id);
      return true;
    })
    .slice(0, 12);
  return normalized.length ? normalized : defaultMedicines;
}

function normalizeMedicine(medicine = {}, settings = {}) {
  const fallback = MEDICINES[medicine.id] || {};
  const name = String(medicine.name || fallback.name || "Medicina").trim().slice(0, 48);
  const dose = String(medicine.dose || fallback.dose || "Dosis").trim().slice(0, 40);
  let id = String(medicine.id || medicineIdFromName(name)).trim();
  id = id.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "") || medicineIdFromName(name);
  if (id === "vitaminD" && settings.vitaminTime && !medicine.time) medicine.time = settings.vitaminTime;
  if (id === "biogaia") {
    if (settings.colicMedicineName && name === MEDICINES.biogaia.name) medicine.name = settings.colicMedicineName;
    if (settings.colicDose && dose === MEDICINES.biogaia.dose) medicine.dose = settings.colicDose;
  }
  return {
    id,
    short: String(medicine.short || fallback.short || medicineShort(name)).trim().slice(0, 2).toUpperCase(),
    name: String(medicine.name || name).trim().slice(0, 48),
    dose: String(medicine.dose || dose).trim().slice(0, 40),
    time: validTimeValue(medicine.time) ? medicine.time : fallback.time || "09:00",
    reminder: medicine.reminder !== false,
    toast: String(medicine.toast || fallback.toast || `${displayMedicineName(name)} lista`).trim(),
  };
}

function medicineConfig(med) {
  const configured = medicineList().find((medicine) => medicine.id === med);
  if (configured) return configured;
  if (med === "biogaia") {
    return normalizeMedicine({
      ...MEDICINES.biogaia,
      name: state.settings.colicMedicineName || MEDICINES.biogaia.name,
      dose: state.settings.colicDose || MEDICINES.biogaia.dose,
      toast: `${displayMedicineName(state.settings.colicMedicineName || "BioGaia")} listo`,
    });
  }
  return normalizeMedicine(MEDICINES[med] || { id: med || "medicine", name: "Medicina", dose: "Dosis" });
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
  return `Pendiente · ${config.dose}${config.time ? ` · ${formatTimeFromValue(config.time)}` : ""}`;
}

function medicineIdFromName(name) {
  return String(name || "medicina")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `med-${Date.now().toString(36)}`;
}

function medicineShort(name) {
  const letters = String(name || "M").normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[A-Za-z0-9]/g);
  return (letters?.[0] || "M").toUpperCase();
}

function displayMedicineName(name) {
  return String(name || "Medicina").replace(" Reuteri", "");
}

function validTimeValue(value) {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function timeToMinutes(value) {
  if (!validTimeValue(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTimeFromValue(value) {
  if (!validTimeValue(value)) return "";
  const date = new Date();
  const [hours, minutes] = value.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return formatTime(date);
}

async function requestMedicineNotifications() {
  if (!("Notification" in window)) {
    showToast("Avisos no disponibles");
    return;
  }
  if (!window.isSecureContext) {
    showToast("Avisos solo en app instalada o HTTPS");
    return;
  }
  const permission = await Notification.requestPermission();
  renderMedicineNotificationStatus();
  showToast(permission === "granted" ? "Avisos activos" : "Avisos no activados");
}

function maybeNotifyMedicineReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date();
  const today = todayKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let changed = false;

  medicineList().forEach((medicine) => {
    if (!medicine.reminder || !medicine.time || isMedicineDone(medicine.id, today)) return;
    const dueMinutes = timeToMinutes(medicine.time);
    if (dueMinutes === null || currentMinutes < dueMinutes) return;
    const key = `${today}-${medicine.id}`;
    if (state.medicineReminderNotified?.[key]) return;
    new Notification(`${displayMedicineName(medicine.name)} pendiente`, {
      body: `${medicine.dose} para ${state.settings.babyName}`,
      icon: "./app-icon-192.png",
      tag: `fede-medicine-${medicine.id}-${today}`,
    });
    state.medicineReminderNotified = state.medicineReminderNotified || {};
    state.medicineReminderNotified[key] = now.toISOString();
    changed = true;
  });

  if (changed) saveState();
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
        return `${formatTime(new Date(event.timeISO))} - ${(event.name || config.name).toUpperCase()} ${event.dose || config.dose}${event.note ? ` ${event.note}` : ""}`.trim();
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

function backupPayload() {
  const snapshot = normalizeState({ ...structuredClone(state), activeFeed: null });
  const sortedEvents = [...snapshot.events].sort(byOldest);
  return {
    app: "fede-baby-tracker",
    backupVersion: BACKUP_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    summary: {
      babyName: snapshot.settings.babyName,
      events: snapshot.events.length,
      from: sortedEvents[0] ? eventDateKey(sortedEvents[0]) : "",
      to: sortedEvents[sortedEvents.length - 1] ? eventDateKey(sortedEvents[sortedEvents.length - 1]) : "",
    },
    state: snapshot,
  };
}

function backupJSON() {
  return JSON.stringify(backupPayload(), null, 2);
}

async function shareBackup() {
  const text = backupJSON();
  const fileName = backupFileName();
  const title = `${state.settings.babyName} · respaldo`;

  try {
    if (navigator.share) {
      const file = new File([text], fileName, { type: "application/json" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title,
          text: `Respaldo completo de ${state.settings.babyName}`,
          files: [file],
        });
      } else {
        await navigator.share({ title, text });
      }
      markExported();
      showToast("Respaldo compartido");
      return;
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(text);
    markExported();
    showToast("Compartir no disponible · respaldo copiado");
  } catch {
    showToast("Compartir no disponible");
  }
}

function downloadBackup() {
  const blob = new Blob([backupJSON()], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName();
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  markExported();
  showToast("Respaldo listo");
}

async function restoreBackupFromFile(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const nextState = stateFromBackupPayload(payload);
    const ok = window.confirm(`Restaurar respaldo de ${nextState.settings.babyName} con ${pluralize(nextState.events.length, "registro", "registros")}? Esto reemplaza los datos locales de este teléfono.`);
    if (!ok) return;
    state = nextState;
    state.activeFeed = null;
    saveState();
    render();
    haptic("save");
    showToast(`Respaldo restaurado · ${pluralize(state.events.length, "registro", "registros")}`);
  } catch {
    showToast("Respaldo inválido");
  } finally {
    els.restoreBackupInput.value = "";
  }
}

function stateFromBackupPayload(payload) {
  if (!isPlainObject(payload)) throw new Error("Invalid backup");
  if (payload.app && payload.app !== "fede-baby-tracker") throw new Error("Wrong app");
  const source = isPlainObject(payload.state) ? payload.state : payload;
  if (!Array.isArray(source.events)) throw new Error("Missing events");
  return normalizeState(source);
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
  return `${exportSlug()}-${todayKey()}.md`;
}

function backupFileName() {
  return `${exportSlug()}-respaldo-${todayKey()}.json`;
}

function exportSlug() {
  return (state.settings.babyName || "federico")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "federico";
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
