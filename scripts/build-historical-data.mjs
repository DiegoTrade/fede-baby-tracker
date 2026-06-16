import { readFileSync, writeFileSync } from "node:fs";

const YEAR = 2026;
const OUTPUT = new URL("../historical-data.js", import.meta.url);
const SOURCES = [
  "/Users/diego/Downloads/Federico 🍼  ÚLTIMO PESO 2.690/Federico 🍼  ÚLTIMO PESO 2.690.md",
  "/Users/diego/Downloads/Federico 🍼/Federico 🍼.md",
];

const events = [];
const diaperDays = new Map();
let section = "";
let currentDate = "";
let pendingWeight = null;
let pendingHeaderNote = "";
let lastFeedMinuteByDate = new Map();

for (const source of SOURCES) {
  const lines = readFileSync(source, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    if (/Federico/i.test(line)) {
      section = /🍼/.test(line) ? "feed" : "diaper";
      pendingWeight = extractWeight(line);
      pendingHeaderNote = /mastitis/i.test(line) ? "Mastitis seno derecho" : "";
      continue;
    }

    const dateKey = parseDateLine(line);
    if (dateKey) {
      currentDate = dateKey;
      if (pendingWeight) {
        events.push(weightEvent(currentDate, pendingWeight));
        pendingWeight = null;
      }
      if (pendingHeaderNote) {
        events.push(noteEvent(currentDate, 12, 0, pendingHeaderNote, "header-note"));
        pendingHeaderNote = "";
      }
      continue;
    }

    if (!currentDate) continue;

    if (section === "feed") {
      const feed = parseFeedLine(line, currentDate);
      if (feed) {
        events.push(feed);
        continue;
      }
      const note = parseLooseNote(line, currentDate, "feed");
      if (note) events.push(note);
    }

    if (section === "diaper") {
      collectDiaperLine(line, currentDate);
    }
  }
}

for (const [dateKey, day] of diaperDays) {
  day.explicit.forEach((event, index) => {
    event.id = `notes-diaper-${dateKey}-explicit-${String(index + 1).padStart(2, "0")}`;
    events.push(event);
  });

  const targetCount = Math.max(day.count || 0, day.explicit.length);
  const missing = Math.max(0, targetCount - day.explicit.length);
  for (let index = 0; index < missing; index += 1) {
    const minute = missing === 1 ? 12 * 60 : Math.round(7 * 60 + (index * (15 * 60)) / Math.max(1, missing - 1));
    const hint = day.hints[index] || {};
    events.push(diaperEvent(dateKey, Math.floor(minute / 60), minute % 60, hint, `count-${index + 1}`));
  }

  day.notes.forEach((text, index) => {
    events.push(noteEvent(dateKey, 20, Math.min(55, index * 5), text, `diaper-note-${index + 1}`));
  });
}

addVitaminDEvents();

events.sort((a, b) => new Date(a.startISO || a.timeISO) - new Date(b.startISO || b.timeISO));

const summary = events.reduce((acc, event) => {
  acc[event.type] = (acc[event.type] || 0) + 1;
  return acc;
}, {});

const payload = {
  version: "notes-2026-06-17-v2",
  source: "Apple Notes import · May 5 to June 16, 2026",
  generatedAt: new Date().toISOString(),
  summary,
  events,
};

writeFileSync(
  OUTPUT,
  `export const HISTORICAL_IMPORT = ${JSON.stringify(payload, null, 2)};\n`
);

console.log(JSON.stringify({ output: OUTPUT.pathname, summary, total: events.length }, null, 2));

function cleanLine(value) {
  return String(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\+\+/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/_/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateLine(line) {
  const match = line.match(/^(\d{1,2})\/(\d{1,2})(?:\b|$)/);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (!day || !month || month < 1 || month > 12 || day < 1 || day > 31) return "";
  return `${YEAR}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function extractWeight(line) {
  const match = line.match(/PESO\s*([\d.,]+)/i);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value)) return null;
  return value > 10 ? value / 1000 : value;
}

function parseFeedLine(line, dateKey) {
  const side = parseSide(line);
  const isSnack = /snack/i.test(line);
  const isPump = /extracci/i.test(line);
  const time = parseTimeRange(line, dateKey);
  if (!side && !isSnack && !isPump) return null;

  const normalizedSide = isSnack && !side ? "snack" : isPump ? "pump" : side;
  if (!time) {
    if (isSnack) return noteEvent(dateKey, 15, 0, "Snacks intermitentes", "snacks");
    return null;
  }

  const noteParts = [];
  const parens = [...line.matchAll(/\(([^)]+)\)/g)].map((match) => match[1].trim());
  noteParts.push(...parens);
  if (/mastitis/i.test(line)) noteParts.push("mastitis");
  if (/pediatra/i.test(line)) noteParts.push("pediatra");
  if (/intermitente/i.test(line)) noteParts.push("intermitente");
  if (/snack/i.test(line) && normalizedSide !== "snack") noteParts.push("snack");

  const tags = [];
  if (/💩/.test(line)) tags.push("poop");
  if (/💧/.test(line)) tags.push("pee");
  if (/💨/.test(line)) tags.push("gas");
  if (/🤮/.test(line)) tags.push("vomit");
  if (/💤/.test(line)) tags.push("sleep");
  if (tags.some((tag) => ["poop", "pee", "gas"].includes(tag))) {
    const day = diaperDay(dateKey);
    day.hints.push({
      pee: tags.includes("pee"),
      poop: tags.includes("poop"),
      gas: tags.includes("gas"),
    });
  }

  const idTime = `${dateKey}-${time.startHour}-${time.startMinute}-${normalizedSide}`;
  return {
    id: stableId("feed", idTime, line),
    type: "feed",
    startISO: localISO(dateKey, time.startHour, time.startMinute),
    endISO: localISO(dateKey, time.endHour, time.endMinute, time.addDayToEnd),
    side: normalizedSide,
    segments: [{
      side: normalizedSide,
      startISO: localISO(dateKey, time.startHour, time.startMinute),
      endISO: localISO(dateKey, time.endHour, time.endMinute, time.addDayToEnd),
    }],
    tags: [...new Set(tags)],
    note: noteParts.join(" · "),
  };
}

function parseSide(line) {
  const upper = line.toUpperCase();
  const hasLeft = /\bIZQ\b|IZQUIERDA/.test(upper);
  const hasRight = /\bDER\b|DERECHA/.test(upper);
  if (/AMBAS/.test(upper) || (hasLeft && hasRight)) return "both";
  if (hasLeft) return "left";
  if (hasRight) return "right";
  return "";
}

function parseTimeRange(line, dateKey) {
  const timeMatches = [...line.slice(0, 52).matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?|(\d{1,2})\s*(AM|PM|am|pm)/g)]
    .map((match) => ({
      hour: Number(match[1] || match[4]),
      minute: Number(match[2] || 0),
      meridiem: (match[3] || match[5] || "").toUpperCase(),
    }))
    .filter((time) => time.hour >= 1 && time.hour <= 12 && time.minute >= 0 && time.minute <= 59);

  if (!timeMatches.length) return null;

  const explicitLineMeridiem = /\bPM\b/i.test(line) ? "PM" : /\bAM\b/i.test(line) ? "AM" : "";
  const startToken = timeMatches[0];
  const endToken = timeMatches[1] || null;
  const lastMinute = lastFeedMinuteByDate.get(dateKey) ?? -1;
  const startMinuteOfDay = inferMinuteOfDay(startToken, endToken, explicitLineMeridiem, lastMinute, true);
  let endMinuteOfDay = endToken
    ? inferMinuteOfDay(endToken, null, endToken.meridiem || startToken.meridiem || explicitLineMeridiem, startMinuteOfDay, false)
    : startMinuteOfDay + defaultDuration(line);

  if (endToken && endMinuteOfDay <= startMinuteOfDay) endMinuteOfDay += 24 * 60;
  if (endMinuteOfDay - startMinuteOfDay > 95) endMinuteOfDay = startMinuteOfDay + defaultDuration(line);

  lastFeedMinuteByDate.set(dateKey, startMinuteOfDay % (24 * 60));

  return {
    startHour: Math.floor((startMinuteOfDay % (24 * 60)) / 60),
    startMinute: startMinuteOfDay % 60,
    endHour: Math.floor((endMinuteOfDay % (24 * 60)) / 60),
    endMinute: endMinuteOfDay % 60,
    addDayToEnd: endMinuteOfDay >= 24 * 60,
  };
}

function inferMinuteOfDay(token, pairedToken, lineMeridiem, lastMinute, isStart) {
  const meridiem = token.meridiem || inferMeridiem(token, pairedToken, lineMeridiem, isStart);
  if (meridiem) return toMinuteOfDay(token.hour, token.minute, meridiem);
  const am = toMinuteOfDay(token.hour, token.minute, "AM");
  const pm = toMinuteOfDay(token.hour, token.minute, "PM");
  if (lastMinute < 0) return am;
  if (am >= lastMinute - 20) return am;
  if (pm >= lastMinute - 20) return pm;
  return token.hour === 12 ? pm : am;
}

function inferMeridiem(token, pairedToken, lineMeridiem, isStart) {
  if (lineMeridiem === "PM" && isStart && pairedToken?.hour === 12 && token.hour === 11) return "AM";
  if (lineMeridiem === "AM" && isStart && token.hour >= 8 && pairedToken?.hour === 12) return "PM";
  return lineMeridiem;
}

function toMinuteOfDay(hour, minute, meridiem) {
  let h = hour % 12;
  if (meridiem === "PM") h += 12;
  return h * 60 + minute;
}

function defaultDuration(line) {
  if (/snack/i.test(line)) return 8;
  if (/extracci/i.test(line)) return 20;
  return 12;
}

function collectDiaperLine(line, dateKey) {
  const day = diaperDay(dateKey);

  const explicitCount = Number(line.match(/=\s*(\d+)/)?.[1] || 0);
  const iconCount = (line.match(/🚼/g) || []).length;
  if (explicitCount || iconCount) {
    day.count = Math.max(day.count, explicitCount || iconCount);
    return;
  }

  const time = parseSingleTime(line, dateKey);
  const hasDiaperSignal = /💩|💧|💨|popo|popó|caca/i.test(line);
  if (time && hasDiaperSignal) {
    day.explicit.push(diaperEvent(dateKey, time.hour, time.minute, {
      pee: /💧/.test(line),
      poop: /💩|popo|popó|caca/i.test(line),
      gas: /💨/.test(line),
    }, `explicit-${day.explicit.length + 1}`));
    return;
  }

  if (/nota:|siesta|berrinche|costaba|mega|buen|moco|aguado/i.test(line)) {
    day.notes.push(line);
  }
}

function diaperDay(dateKey) {
  const day = diaperDays.get(dateKey) || { count: 0, explicit: [], notes: [], hints: [] };
  diaperDays.set(dateKey, day);
  return day;
}

function parseSingleTime(line, dateKey) {
  const match = line.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?|(\d{1,2})\s*(AM|PM|am|pm)/);
  if (!match) return null;
  const token = {
    hour: Number(match[1] || match[4]),
    minute: Number(match[2] || 0),
    meridiem: (match[3] || match[5] || "").toUpperCase(),
  };
  const minute = inferMinuteOfDay(token, null, token.meridiem || (/\bPM\b/i.test(line) ? "PM" : /\bAM\b/i.test(line) ? "AM" : ""), 7 * 60, true);
  return { hour: Math.floor(minute / 60), minute: minute % 60 };
}

function parseLooseNote(line, dateKey, suffix) {
  if (/certificado|foto fondo|DNI/i.test(line)) return null;
  if (/vitamina|paracetamol|siesta|berrinche|vomit|🤮|💤|snacks/i.test(line)) {
    const time = parseSingleTime(line, dateKey) || { hour: 12, minute: 0 };
    return noteEvent(dateKey, time.hour, time.minute, line, suffix);
  }
  return null;
}

function addVitaminDEvents() {
  const eventDates = events
    .map((event) => (event.startISO || event.timeISO).slice(0, 10))
    .filter((dateKey) => dateKey >= "2026-05-12" && dateKey <= "2026-06-16");
  const uniqueDates = [...new Set(eventDates)].sort();
  uniqueDates.forEach((dateKey) => {
    events.push({
      id: `notes-med-vitaminD-${dateKey}`,
      type: "med",
      med: "vitaminD",
      timeISO: localISO(dateKey, 9, 0),
      dose: "2 gotas",
      note: "Rutina importada de Notes",
    });
  });
}

function weightEvent(dateKey, kg) {
  return {
    id: `notes-weight-${dateKey}-${String(kg).replace(".", "")}`,
    type: "weight",
    timeISO: localISO(dateKey, 12, 0),
    kg,
    note: "Último peso importado de Notes",
  };
}

function diaperEvent(dateKey, hour, minute, attrs, suffix) {
  return {
    id: `notes-diaper-${dateKey}-${suffix}`,
    type: "diaper",
    timeISO: localISO(dateKey, hour, minute),
    pee: Boolean(attrs.pee),
    poop: Boolean(attrs.poop),
    gas: Boolean(attrs.gas),
    details: [],
    note: "",
  };
}

function noteEvent(dateKey, hour, minute, text, suffix) {
  return {
    id: stableId("note", `${dateKey}-${hour}-${minute}-${suffix}`, text),
    type: "note",
    timeISO: localISO(dateKey, hour, minute),
    text,
  };
}

function localISO(dateKey, hour, minute, addDay = false) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day + (addDay ? 1 : 0), hour, minute, 0, 0);
  return date.toISOString();
}

function stableId(type, prefix, source) {
  let hash = 0;
  for (const char of `${prefix}|${source}`) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }
  return `notes-${type}-${prefix}-${Math.abs(hash).toString(36)}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}
