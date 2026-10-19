/* ==========================================================================
   SUBMARINE MUSEUMS — ACOUSTIC PLOT
   Static archive: JSON in, plot + console + register out.
   ========================================================================== */

const DATA_URL = "data/submarines.json";
const CONFIG_URL = "data/config.json";
const I18N_URL = "data/i18n.json";

const LANG_KEY = "snk-lang";
const SOUND_KEY = "snk-sound";
const GATE_KEY = "snk-gate";
const LANGS = ["en", "es"];
const DEFAULT_LANG = "en";

const TYPE_META = {
  diesel: { color: "#ffb648" },
  nuclear: { color: "#7dffb2" },
  electric: { color: "#5bc8ff" },
  "hand-crank": { color: "#d8c9a3" }
};
const TYPE_ORDER = ["diesel", "nuclear", "electric", "hand-crank"];

const ERA_META = {
  precursores: { min: 0, max: 1899, range: "≤ 1899" },
  "gran-guerra": { min: 1900, max: 1918, range: "1900–1918" },
  entreguerras: { min: 1919, max: 1938, range: "1919–1938" },
  "segunda-guerra": { min: 1939, max: 1945, range: "1939–1945" },
  "guerra-fria": { min: 1946, max: 1974, range: "1946–1974" },
  modernos: { min: 1975, max: 9999, range: "1975 →" }
};
const ERA_ORDER = ["precursores", "gran-guerra", "entreguerras", "segunda-guerra", "guerra-fria", "modernos"];

const SITUATION_META = {
  flote: { color: "var(--flote)", img: "assets/img/situation/flote.svg" },
  agua: { color: "var(--agua)", img: "assets/img/situation/agua.svg" },
  tierra: { color: "var(--tierra)", img: "assets/img/situation/tierra.svg" },
  cerrado: { color: "var(--cerrado)", img: "assets/img/situation/cerrado.svg" },
  monumento: { color: "var(--monumento)", img: "assets/img/situation/monumento.svg" }
};
const SITUATION_ORDER = ["flote", "agua", "tierra", "cerrado", "monumento"];

const BASE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const LABEL_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIB = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>';

const SITE_URL = "https://submarinos-museo-del-mundo.elsnorkel.com/";

const state = {
  page: document.body.dataset.page || "home",
  lang: DEFAULT_LANG,
  i18n: { en: {}, es: {} },
  units: [],
  config: {},
  filters: {
    q: "",
    type: "all",
    situation: "all",
    country: "all",
    era: "all",
    video: false,
    media: false,
    coming: false
  },
  sort: "default",
  lockedId: null,
  map: null,
  cluster: null,
  markers: new Map(),
  added: new Set(),
  acquiring: false,
  sound: false,
  audio: null,
  booted: false,
  revealTimer: null
};

const dom = {};

/* ---------- utilities ---------- */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function dict() {
  return state.i18n[state.lang] || state.i18n[DEFAULT_LANG] || {};
}

function tOrNull(key) {
  if (!key) return null;
  const d = dict();
  if (Object.prototype.hasOwnProperty.call(d, key) && d[key] !== "") return d[key];
  const fallback = state.i18n[DEFAULT_LANG] || {};
  return Object.prototype.hasOwnProperty.call(fallback, key) ? fallback[key] : null;
}

function t(key, vars) {
  const raw = tOrNull(key) ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? ""));
}

function typeLabelOf(key) {
  return t(`type.${key}`);
}

function situationLabelOf(key) {
  return key ? t(`situation.${key}`) : "";
}

function eraLabelOf(key) {
  return t(`era.${key}`);
}

function countryLabel(name) {
  const raw = String(name || "").trim();
  if (!raw) return "";
  return tOrNull(`country.${raw}`) || raw;
}

function setText(el, value) {
  if (el) el.textContent = value ?? "";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value, window.location.href);
    if (["http:", "https:", "data:"].includes(url.protocol)) return url.href;
  } catch (_) {
    return "";
  }
  return "";
}

function firstUrl(raw) {
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const found = firstUrl(entry);
      if (found) return found;
    }
    return "";
  }
  return safeUrl(raw);
}

function youtubeId(raw) {
  const value = safeUrl(raw);
  if (!value) return "";
  const url = new URL(value);
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || "";
  if (!host.endsWith("youtube.com") && !host.endsWith("youtube-nocookie.com")) return "";
  if (url.searchParams.get("v")) return url.searchParams.get("v");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") return parts[1] || "";
  return "";
}

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg|ogv)(\?|#|$)/i.test(String(url || ""));
}

function getVideoUrl(unit) {
  if (!unit) return "";
  if (unit.videoUrl) return unit.videoUrl;
  return youtubeId(unit.link) ? unit.link : "";
}

function hasVideo(unit) {
  return Boolean(getVideoUrl(unit));
}

function hasMedia(unit) {
  return Boolean(unit.image || getVideoUrl(unit));
}

function isFeatured(unit) {
  return unit.featured === true;
}

function eraOf(year) {
  const value = Number(year);
  if (!Number.isFinite(value) || value <= 0) return "";
  for (const key of ERA_ORDER) {
    const meta = ERA_META[key];
    if (value >= meta.min && value <= meta.max) return key;
  }
  return "";
}

function pad3(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(3, "0");
}

function parseDossierNumber(value) {
  const match = String(value || "").match(/(\d+)/);
  return match ? Number(match[1]) : 9999;
}

function formatDate(raw) {
  const value = String(raw || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(state.lang === "es" ? "es-ES" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatCoords(unit) {
  const ns = unit.lat >= 0 ? "N" : "S";
  const ew = unit.lng >= 0 ? "E" : "W";
  return `${Math.abs(unit.lat).toFixed(2)}°${ns} / ${Math.abs(unit.lng).toFixed(2)}°${ew}`;
}

/* ---------- data ---------- */

function resolveType(raw) {
  const key = String(raw.typeKey || "").toLowerCase();
  if (TYPE_META[key]) return key;
  const label = `${raw.type || ""} ${raw.typeLabel || ""}`.toLowerCase();
  if (label.includes("nuclear")) return "nuclear";
  if (label.includes("electric") || label.includes("eléctric")) return "electric";
  if (label.includes("hand") || label.includes("manivela")) return "hand-crank";
  return "diesel";
}

function resolveSituation(raw) {
  const key = String(raw.situation || "").toLowerCase().trim();
  if (SITUATION_META[key]) return key;
  const label = normalizeText(`${raw.situation || ""} ${raw.situationLabel || ""}`);
  if (label.includes("flote") || label.includes("afloat")) return "flote";
  if (label.includes("agua") || label.includes("water")) return "agua";
  if (label.includes("tierra") || label.includes("land")) return "tierra";
  if (label.includes("cerrado") || label.includes("cover")) return "cerrado";
  if (label.includes("monumento") || label.includes("monument")) return "monumento";
  return "";
}

function normalizeUnit(raw, index) {
  if (!raw || typeof raw !== "object") return null;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  const typeKey = resolveType(raw);
  const launchYear = Number(raw.launchYear);
  const situation = resolveSituation(raw);

  const unit = {
    id: String(raw.id || "").trim() || `unit-${index + 1}`,
    dossier: String(raw.dossier || "").trim(),
    name: String(raw.name || "—").trim(),
    type: String(raw.type || "").trim(),
    typeKey,
    class: String(raw.class || "").trim(),
    country: String(raw.country || "").trim(),
    city: String(raw.city || "").trim(),
    museum: String(raw.museum || "").trim(),
    nationality: String(raw.nationality || "").trim(),
    lat,
    lng,
    launchYear: Number.isFinite(launchYear) && launchYear > 0 ? launchYear : null,
    image: firstUrl(raw.image),
    videoUrl: firstUrl(raw.videoUrl),
    link: firstUrl(raw.link),
    situation,
    featured: raw.featured === true,
    afloat: raw.afloat === true || situation === "flote" || situation === "agua",
    status: raw.status === "coming-soon" ? "coming-soon" : "open",
    description: String(raw.description || "").trim(),
    verticalVideo: raw.verticalVideo === true || raw.videoVertical === true
  };

  unit._search = normalizeText([
    unit.name,
    unit.dossier,
    unit.museum,
    unit.city,
    unit.country,
    unit.nationality,
    unit.class,
    typeLabelOf(unit.typeKey),
    situationLabelOf(unit.situation),
    countryLabel(unit.country)
  ].join(" "));

  return unit;
}

async function fetchJSON(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${url} (HTTP ${response.status})`);
  return response.json();
}

/* ---------- i18n ---------- */

function resolveLang() {
  const param = (new URLSearchParams(window.location.search).get("lang") || "").toLowerCase();
  if (LANGS.includes(param)) return param;
  const stored = (localStorage.getItem(LANG_KEY) || "").toLowerCase();
  if (LANGS.includes(stored)) return stored;
  const preferred = String(navigator.language || "").slice(0, 2).toLowerCase();
  return LANGS.includes(preferred) ? preferred : DEFAULT_LANG;
}

function translateNode(node) {
  const key = node.dataset.i18n;
  if (key) {
    const value = tOrNull(key);
    if (value !== null) node.textContent = value;
  }
  const attrs = node.dataset.i18nAttr;
  if (attrs) {
    for (const pair of attrs.split(",")) {
      const [attr, attrKey] = pair.split(":").map((part) => part.trim());
      if (!attr || !attrKey) continue;
      const value = tOrNull(attrKey);
      if (value !== null) node.setAttribute(attr, value);
    }
  }
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n], [data-i18n-attr]").forEach(translateNode);
  document.documentElement.lang = state.lang;
}

function syncLangButtons() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang));
  });
}

function setLang(lang, { persist = true } = {}) {
  if (!LANGS.includes(lang) || lang === state.lang) return;
  state.lang = lang;
  if (persist) localStorage.setItem(LANG_KEY, lang);
  applyStaticI18n();
  syncLangButtons();
  renderAll();
  if (state.page === "register") syncUrl();
}

/* ---------- dom ---------- */

function cacheDom() {
  const byId = (id) => document.getElementById(id);
  Object.assign(dom, {
    app: byId("app"),
    gate: byId("gate"),
    boot: byId("boot"),
    bootLog: byId("boot-log"),
    bootBar: byId("boot-bar"),
    menu: byId("menu"),
    menuOpen: byId("menu-open"),
    menuClose: byId("menu-close"),
    modal: byId("modal"),
    modalFrame: byId("modal-frame"),
    toast: byId("toast"),
    map: byId("map"),
    search: byId("search"),
    typeFilters: byId("type-filters"),
    situationFilters: byId("situation-filters"),
    countryFilter: byId("country-filter"),
    eraFilter: byId("era-filter"),
    videoFilter: byId("video-filter"),
    mediaFilter: byId("media-filter"),
    comingFilter: byId("coming-filter"),
    resetFilters: byId("reset-filters"),
    sort: byId("sort-select"),
    consoleCount: byId("console-count"),
    consoleDossier: byId("console-dossier"),
    log: byId("log"),
    logCount: byId("log-count"),
    telemetry: byId("telemetry"),
    telemetryDate: byId("telemetry-date"),
    coverEras: byId("cover-eras"),
    erasGrid: byId("eras-grid"),
    coverTotal: byId("cover-total"),
    coverCountries: byId("cover-countries"),
    coverFilms: byId("cover-films"),
    coverTypes: byId("cover-types"),
    gateTotal: byId("gate-total"),
    gateCountries: byId("gate-countries"),
    gateFilms: byId("gate-films"),
    briefingTitle: byId("briefing-title"),
    acquire: byId("acquire"),
    acquireCount: byId("acquire-count"),
    acquireTotal: byId("acquire-total"),
    acquireBar: byId("acquire-bar"),
    featuredCount: byId("featured-count"),
    featuredBillboard: byId("featured-billboard"),
    featuredRails: byId("featured-rails"),
    briefingOpen: byId("briefing-open"),
    briefingPlay: byId("briefing-play"),
    briefingFrame: byId("briefing-frame"),
    briefingTitle: byId("briefing-title"),
    briefingList: byId("briefing-list"),
    originText: byId("origin-text"),
    socialFoot: byId("social-foot"),
    socialMenu: byId("social-menu"),
    shareSite: byId("share-site"),
    footerDate: byId("footer-date"),
    soundToggle: byId("sound-toggle"),
    plotFeed: byId("plot-feed"),
    mapZoom: byId("map-zoom"),
    mapCoords: byId("map-coords"),
    registerCount: byId("register-count"),
    registerList: byId("register-list"),
    registerEmpty: byId("register-empty"),
    registerDossier: byId("register-dossier"),
    registerSide: byId("register-side"),
    sheetBackdrop: byId("sheet-backdrop"),
    regTotal: byId("reg-total"),
    regCountries: byId("reg-countries"),
    regFilms: byId("reg-films"),
    metaDescription: document.querySelector('meta[name="description"]')
  });
}

/* ---------- sound ---------- */

function audioContext() {
  if (state.audio) return state.audio;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  state.audio = new Ctx();
  return state.audio;
}

function tone({ freq = 660, to = 440, dur = 0.5, gain = 0.05, type = "sine", delay = 0 } = {}) {
  if (!state.sound) return;
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), start + dur);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function sfxPing() {
  tone({ freq: 780, to: 520, dur: 0.75, gain: 0.05 });
  tone({ freq: 780, to: 520, dur: 0.5, gain: 0.02, delay: 0.42 });
}

function sfxClick() {
  tone({ freq: 1400, to: 900, dur: 0.07, gain: 0.028, type: "triangle" });
}

function setSound(on, { persist = true } = {}) {
  state.sound = Boolean(on);
  if (persist) localStorage.setItem(SOUND_KEY, state.sound ? "1" : "0");
  if (dom.soundToggle) dom.soundToggle.setAttribute("aria-pressed", String(state.sound));
  if (state.sound) {
    audioContext();
    sfxClick();
  }
}

/* ---------- boot / gate ---------- */

async function runBoot() {
  if (!dom.boot) { reveal(); return; }
  if (reduceMotion()) { reveal(); return; }
  dom.boot.hidden = false;
  if (dom.bootLog) dom.bootLog.innerHTML = "";
  const keys = ["boot.l1", "boot.l2", "boot.l3", "boot.l4", "boot.l5"];
  for (let i = 0; i < keys.length; i += 1) {
    const row = document.createElement("p");
    row.className = "is-active";
    row.innerHTML = `<span>${esc(t(keys[i]))}</span><b>${i === keys.length - 1 ? "OK" : `${Math.round(((i + 1) / keys.length) * 100)}%`}</b>`;
    dom.bootLog?.append(row);
    if (dom.bootBar) dom.bootBar.style.width = `${((i + 1) / keys.length) * 100}%`;
    await wait(i === 0 ? 380 : 210);
    row.classList.remove("is-active");
  }
  await wait(240);
  dom.boot.hidden = true;
  reveal();
}

async function enterArchive({ sound = true, boot = true } = {}) {
  if (state.booted) return;
  state.booted = true;
  try { localStorage.setItem(GATE_KEY, "1"); } catch (_) { /* private mode */ }
  if (sound) setSound(true, { persist: false });
  if (dom.gate) {
    dom.gate.classList.add("is-out");
    window.setTimeout(() => { if (dom.gate) dom.gate.hidden = true; }, 520);
  }
  if (boot) await runBoot();
  else reveal();
}

function reveal() {
  if (!dom.app || !dom.app.hidden) return;
  dom.app.hidden = false;
  const start = () => {
    initMap();
    window.setTimeout(() => {
      state.map?.invalidateSize();
      startAcquisition();
      applyFilters();
      revealDeepLink();
    }, 60);
  };
  let started = false;
  const once = () => {
    if (started) return;
    started = true;
    start();
  };
  window.requestAnimationFrame(once);
  window.setTimeout(once, 80);
}

function initGate() {
  if (!dom.gate) { reveal(); return; }
  const seen = (() => { try { return localStorage.getItem(GATE_KEY) === "1"; } catch (_) { return false; } })();
  if (seen) {
    dom.gate.hidden = true;
    reveal();
    return;
  }
  dom.gate.querySelector("#gate-enter")?.addEventListener("click", () => enterArchive({ sound: true, boot: true }));
  dom.gate.querySelector("#gate-skip")?.addEventListener("click", () => enterArchive({ sound: false, boot: false }));
  dom.gate.querySelector("#gate-enter")?.focus({ preventScroll: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dom.gate && !dom.gate.hidden) enterArchive({ sound: false, boot: false });
  }, { once: false });
}

/* ---------- map ---------- */

function contactIcon(unit, locked = false) {
  const color = TYPE_META[unit.typeKey]?.color || "#e8f1f5";
  return L.divIcon({
    className: "",
    html: `<span class="contact${locked ? " is-locked" : ""}"><i class="contact__dot" style="--c:${color}"></i></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

function initMap() {
  if (state.map || !dom.map || !window.L) return;
  const L = window.L;

  state.map = L.map(dom.map, {
    center: [26, 4],
    zoom: 2,
    minZoom: 2,
    maxZoom: 11,
    zoomControl: false,
    scrollWheelZoom: false,
    worldCopyJump: true,
    attributionControl: true
  });

  L.tileLayer(BASE_TILES, { maxZoom: 11, attribution: TILE_ATTRIB }).addTo(state.map);
  L.tileLayer(LABEL_TILES, { maxZoom: 11, opacity: 0.5 }).addTo(state.map);

  state.cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 46,
    disableClusteringAtZoom: 7,
    chunkedLoading: true,
    iconCreateFunction: (cluster) => L.divIcon({
      className: "cluster",
      html: `<span class="cluster__in">${cluster.getChildCount()}</span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    })
  });
  state.map.addLayer(state.cluster);

  state.units.forEach((unit) => {
    const marker = L.marker([unit.lat, unit.lng], {
      icon: contactIcon(unit),
      title: `${unit.dossier} ${unit.name}`,
      riseOnHover: true,
      keyboard: false
    });
    marker.bindTooltip(`${esc(unit.dossier)} · ${esc(unit.name)}`, { direction: "top", offset: [0, -8], opacity: 1 });
    marker.on("click", () => lockUnit(unit.id, { fly: true }));
    state.markers.set(unit.id, marker);
  });

  state.map.on("zoomend", updateMapReadout);
  state.map.on("mousemove", (event) => {
    if (!dom.mapCoords) return;
    const { lat, lng } = event.latlng;
    dom.mapCoords.textContent = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} / ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? "E" : "W"}`;
  });
  updateMapReadout();
}

function updateMapReadout() {
  if (!state.map || !dom.mapZoom) return;
  dom.mapZoom.textContent = `Z ${String(state.map.getZoom()).padStart(2, "0")}`;
}

function startAcquisition() {
  if (!state.cluster || state.acquiring) return;
  state.acquiring = true;
  const total = state.units.length;
  let index = 0;

  if (dom.acquireTotal) dom.acquireTotal.textContent = String(total);
  if (dom.coverTotal) dom.coverTotal.textContent = String(total);

  if (reduceMotion()) {
    state.units.forEach((unit) => state.cluster.addLayer(state.markers.get(unit.id)));
    state.units.forEach((unit) => state.added.add(unit.id));
    finishAcquisition();
    return;
  }

  const perTick = Math.max(1, Math.ceil(total / 80));
  const tick = () => {
    if (!state.acquiring) return;
    const batch = state.units.slice(index, index + perTick);
    index += perTick;
    batch.forEach((unit) => {
      state.cluster.addLayer(state.markers.get(unit.id));
      state.added.add(unit.id);
      if (index % 24 === 0) pushFeed(`<b>${esc(unit.dossier)}</b> ${esc(unit.name)}`);
    });
    updateAcquireCounter();
    if (index < total) {
      window.setTimeout(tick, 26);
    } else {
      finishAcquisition();
    }
  };
  tick();
}

function updateAcquireCounter() {
  const count = state.added.size;
  if (dom.acquireCount) dom.acquireCount.textContent = pad3(count);
  if (dom.acquireBar) {
    const pct = state.units.length ? (count / state.units.length) * 100 : 0;
    dom.acquireBar.style.width = `${pct.toFixed(1)}%`;
  }
}

function finishAcquisition() {
  state.acquiring = false;
  updateAcquireCounter();
  dom.acquire?.classList.add("is-done");
  pushFeed(t("feed.ready", { n: state.units.length }), true);
  sfxPing();
  applyFilters();
}

function pushFeed(html, keep = false) {
  if (!dom.plotFeed) return;
  const row = document.createElement("p");
  row.innerHTML = html;
  dom.plotFeed.append(row);
  if (keep) {
    while (dom.plotFeed.children.length > 5) dom.plotFeed.firstElementChild.remove();
    return;
  }
  while (dom.plotFeed.children.length > 5) dom.plotFeed.firstElementChild.remove();
}

/* ---------- filters ---------- */

function matchesFilters(unit) {
  const f = state.filters;
  if (f.type !== "all" && unit.typeKey !== f.type) return false;
  if (f.situation !== "all" && unit.situation !== f.situation) return false;
  if (f.country !== "all" && unit.country !== f.country) return false;
  if (f.era !== "all" && eraOf(unit.launchYear) !== f.era) return false;
  if (f.video && !hasVideo(unit)) return false;
  if (f.media && !hasMedia(unit)) return false;
  if (f.coming && unit.status !== "coming-soon") return false;
  if (f.q) {
    const needle = normalizeText(f.q);
    if (needle && !unit._search.includes(needle)) return false;
  }
  return true;
}

function filteredUnits() {
  return state.units.filter(matchesFilters);
}

function applyFilters({ render = true } = {}) {
  const list = filteredUnits();

  if (state.cluster) {
    const allowed = new Set(list.map((unit) => unit.id));
    const toAdd = [];
    const toRemove = [];
    for (const unit of state.units) {
      const marker = state.markers.get(unit.id);
      if (!marker) continue;
      const isIn = state.cluster.hasLayer(marker);
      const should = allowed.has(unit.id);
      if (should && !isIn) toAdd.push(marker);
      if (!should && isIn) toRemove.push(marker);
    }
    if (toRemove.length) state.cluster.removeLayers(toRemove);
    if (toAdd.length) state.cluster.addLayers(toAdd);
  }

  const count = list.length;
  const label = count === 1 ? t("section.map.one") : t("section.map.many");
  if (dom.consoleCount) dom.consoleCount.textContent = String(count);
  if (dom.registerCount) dom.registerCount.textContent = String(count);
  if (dom.logCount) dom.logCount.textContent = String(count);
  if (dom.featuredCount) dom.featuredCount.textContent = String(state.units.filter(isFeatured).length);
  if (dom.resetFilters) dom.resetFilters.hidden = !hasActiveFilters();
  document.getElementById("register-reset")?.toggleAttribute("hidden", !hasActiveFilters());

  if (render) {
    renderLog(list);
    if (state.page === "register") renderRegister();
    syncUrl();
  }

  if (state.lockedId && !list.some((unit) => unit.id === state.lockedId)) {
    const stillThere = state.units.find((unit) => unit.id === state.lockedId);
    if (stillThere) renderDossier(stillThere);
  }
  return list;
}

function hasActiveFilters() {
  const f = state.filters;
  return Boolean(f.q) || f.type !== "all" || f.situation !== "all" || f.country !== "all" || f.era !== "all" || f.video || f.media || f.coming;
}

function resetFilters() {
  state.filters = { q: "", type: "all", situation: "all", country: "all", era: "all", video: false, media: false, coming: false };
  if (dom.search) dom.search.value = "";
  if (dom.countryFilter) dom.countryFilter.value = "all";
  if (dom.eraFilter) dom.eraFilter.value = "all";
  document.querySelectorAll("[data-type], [data-situation]").forEach((chip) => chip.setAttribute("aria-pressed", "false"));
  if (dom.videoFilter) dom.videoFilter.setAttribute("aria-pressed", "false");
  if (dom.mediaFilter) dom.mediaFilter.setAttribute("aria-pressed", "false");
  if (dom.comingFilter) dom.comingFilter.setAttribute("aria-pressed", "false");
  applyFilters();
}

/* ---------- rendering: filters + log ---------- */

function renderFilterChips() {
  const counts = new Map();
  const sitCounts = new Map();
  state.units.forEach((unit) => {
    counts.set(unit.typeKey, (counts.get(unit.typeKey) || 0) + 1);
    if (unit.situation) sitCounts.set(unit.situation, (sitCounts.get(unit.situation) || 0) + 1);
  });

  if (dom.typeFilters) {
    dom.typeFilters.innerHTML = TYPE_ORDER.map((key) => {
      const color = TYPE_META[key].color;
      const active = state.filters.type === key;
      return `<button class="chip" type="button" data-type="${key}" aria-pressed="${active}">
        <i style="--chip:${color}"></i><span>${esc(typeLabelOf(key))}</span><b>${counts.get(key) || 0}</b>
      </button>`;
    }).join("");
  }

  if (dom.situationFilters) {
    const rows = SITUATION_ORDER.filter((key) => sitCounts.get(key)).map((key) => {
      const meta = SITUATION_META[key];
      const active = state.filters.situation === key;
      return `<button class="chip" type="button" data-situation="${key}" aria-pressed="${active}">
        <img class="chip__icon" src="${meta.img}" alt="" width="16" height="16"><span>${esc(situationLabelOf(key))}</span><b>${sitCounts.get(key) || 0}</b>
      </button>`;
    });
    dom.situationFilters.innerHTML = rows.join("");
  }

  if (dom.countryFilter) {
    const countries = [...new Set(state.units.map((unit) => unit.country).filter(Boolean))]
      .sort((a, b) => countryLabel(a).localeCompare(countryLabel(b), state.lang));
    dom.countryFilter.innerHTML = `<option value="all">${esc(t("filter.allCountries"))}</option>` +
      countries.map((name) => `<option value="${esc(name)}">${esc(countryLabel(name))}</option>`).join("");
    dom.countryFilter.value = state.filters.country;
  }

  if (dom.eraFilter) {
    dom.eraFilter.innerHTML = `<option value="all">${esc(t("filter.allEras"))}</option>` +
      ERA_ORDER.map((key) => `<option value="${key}">${esc(eraLabelOf(key))} · ${ERA_META[key].range}</option>`).join("");
    dom.eraFilter.value = state.filters.era;
  }
}

function renderLog(list) {
  if (!dom.log) return;
  const rows = list.slice(0, 10);
  dom.log.innerHTML = rows.map((unit) => {
    const active = unit.id === state.lockedId;
    return `<li><button class="log__row${active ? " is-locked" : ""}" type="button" data-unit="${esc(unit.id)}">
      <span class="code">${esc(unit.dossier || "—")}</span>
      <span class="name">${esc(unit.name)}</span>
      <span class="meta">${unit.launchYear || ""}</span>
    </button></li>`;
  }).join("") || `<li class="log__row"><span class="code">—</span><span class="name">${esc(t("registry.emptyKicker"))}</span><span class="meta"></span></li>`;
}

/* ---------- dossier ---------- */

function missionTag(unit) {
  if (unit.status === "coming-soon") return `<span class="tag tag--alarm">${esc(t("dossier.badgeComing"))}</span>`;
  if (unit.afloat) return `<span class="tag">${esc(t("dossier.badgeAfloat"))}</span>`;
  return "";
}

function dossierMarkup(unit) {
  const typeColor = TYPE_META[unit.typeKey]?.color || "#e8f1f5";
  const sitMeta = unit.situation ? SITUATION_META[unit.situation] : null;
  const video = getVideoUrl(unit);
  const src = safeUrl(unit.link);
  const place = [unit.city, countryLabel(unit.country)].filter(Boolean).join(", ");

  const media = video
    ? `<button class="dossier__media${unit.image ? "" : " dossier__media--teal"}" type="button" data-video="${esc(unit.id)}" aria-label="${esc(`${t("dossier.playVideo", { name: unit.name })} ${t("dossier.videoFallback")}`)}">
        ${unit.image ? `<img src="${esc(unit.image)}" alt="" loading="lazy">` : ""}
        <span class="dossier__play"><span>${esc(t("dossier.playVideo", { name: unit.name }))}</span><span class="dossier__play-cta">▶ ${esc(t("dossier.videoFallback"))}</span></span>
      </button>`
    : unit.image
      ? `<div class="dossier__media"><img src="${esc(unit.image)}" alt="${esc(unit.name)}" loading="lazy"></div>`
      : `<div class="dossier__media dossier__media--empty">${esc(t("dossier.blueprintPending"))}</div>`;

  const facts = [
    [t("dossier.specClass"), unit.class],
    [t("dossier.specLaunch"), unit.launchYear || ""],
    [t("dossier.specMuseum"), unit.museum],
    [t("dossier.specCity"), place],
    [t("dossier.specSituation"), unit.situation ? situationLabelOf(unit.situation) : ""],
    [t("dossier.specCoords"), formatCoords(unit)]
  ].map(([label, value]) => `<div><dt>${esc(label)}</dt><dd class="${value ? "" : "is-empty"}">${esc(value || t("dossier.undocumented"))}</dd></div>`).join("");

  return `
    <div class="dossier__top">
      <span class="dossier__code">${esc(unit.dossier || "—")}</span>
      <button class="dossier__close" type="button" data-dossier-close>
        ${esc(t("dossier.close"))} <svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg>
      </button>
    </div>
    <${state.page === "register" ? "h2" : "h3"} class="dossier__name">${esc(unit.name)}</${state.page === "register" ? "h2" : "h3"}>
    <div class="dossier__status">
      <span class="tag tag--type" style="--c:${typeColor}"><i></i>${esc(typeLabelOf(unit.typeKey))}</span>
      ${sitMeta ? `<span class="tag" style="--c:${sitMeta.color}"><img class="tag__icon" src="${sitMeta.img}" alt="" width="14" height="14">${esc(situationLabelOf(unit.situation))}</span>` : ""}
      ${missionTag(unit)}
    </div>
    ${media}
    <dl class="dossier__facts">${facts}</dl>
    <p class="dossier__desc">${esc(unit.description || t("dossier.noDescription"))}</p>
    <div class="dossier__actions">
      <button class="btn btn--amber btn--sm" type="button" data-locate="${esc(unit.id)}">${esc(t("dossier.viewMap"))}</button>
      <button class="btn btn--line btn--sm" type="button" data-copy="${esc(unit.id)}">${esc(t("dossier.copyLink"))} </button>
      ${src ? `<a class="dossier__link" href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(t("dossier.openSource"))} <svg class="icon" aria-hidden="true"><use href="#i-external"></use></svg></a>` : ""}
    </div>`;
}

function renderDossier(unit, { target = null, sheet = false } = {}) {
  if (!unit) return;
  const el = target || (state.page === "register" ? dom.registerDossier : dom.consoleDossier);
  if (!el) return;
  el.innerHTML = dossierMarkup(unit);
  if (sheet && dom.registerSide) {
    dom.registerSide.classList.add("is-open");
    if (dom.sheetBackdrop) dom.sheetBackdrop.hidden = false;
  }
}

function clearDossier(target) {
  const el = target || (state.page === "register" ? dom.registerDossier : dom.consoleDossier);
  if (!el) return;
  el.innerHTML = `<div class="empty">
    <span class="empty__rings" aria-hidden="true"><i></i><i></i><i></i></span>
    <p class="kicker">${esc(t("dossier.emptyKicker"))}</p>
    <p>${esc(state.page === "register" ? t("register.emptySide") : t("dossier.emptyText"))}</p>
  </div>`;
  if (dom.registerSide) dom.registerSide.classList.remove("is-open");
  if (dom.sheetBackdrop) dom.sheetBackdrop.hidden = true;
}

function lockUnit(id, { fly = false, scroll = false, sheet = false } = {}) {
  const unit = state.units.find((entry) => entry.id === id);
  if (!unit) return;

  if (state.lockedId && state.markers.get(state.lockedId)) {
    const previous = state.markers.get(state.lockedId);
    previous.setIcon(contactIcon(state.units.find((entry) => entry.id === state.lockedId), false));
  }

  state.lockedId = unit.id;
  state.markers.get(unit.id)?.setIcon(contactIcon(unit, true));

  renderDossier(unit, { sheet });
  renderLog(filteredUnits());
  if (state.page === "register") renderRegister();

  if (fly && state.map) {
    state.map.flyTo([unit.lat, unit.lng], Math.max(state.map.getZoom(), 5), { duration: 0.9 });
  }
  if (scroll) {
    document.getElementById("console")?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  }
  if (sheet) document.body.classList.add("is-locked");

  sfxClick();
  syncUrl();
}

function unlockUnit() {
  if (state.lockedId && state.markers.get(state.lockedId)) {
    const unit = state.units.find((entry) => entry.id === state.lockedId);
    if (unit) state.markers.get(state.lockedId).setIcon(contactIcon(unit, false));
  }
  state.lockedId = null;
  clearDossier();
  renderLog(filteredUnits());
  if (state.page === "register") renderRegister();
  if (dom.registerSide) dom.registerSide.classList.remove("is-open");
  if (dom.sheetBackdrop) dom.sheetBackdrop.hidden = true;
  document.body.classList.remove("is-locked");
  syncUrl();
}

function mountVideo(unit, container) {
  const video = getVideoUrl(unit);
  if (!video || !container) return;
  const id = youtubeId(video);
  const frame = document.createElement("div");
  frame.className = "dossier__media dossier__media--frame";
  if (id) {
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}?autoplay=1&rel=0&modestbranding=1" title="${esc(unit.name)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  } else if (isDirectVideo(video)) {
    frame.innerHTML = `<video controls autoplay playsinline src="${esc(video)}"></video>`;
  } else {
    return;
  }
  container.replaceWith(frame);
}

/* ---------- stats + telemetry ---------- */

function archiveStats() {
  const units = state.units;
  return {
    total: units.length,
    countries: new Set(units.map((unit) => unit.country).filter(Boolean)).size,
    museums: new Set(units.map((unit) => unit.museum).filter(Boolean)).size,
    films: units.filter(hasVideo).length,
    photos: units.filter((unit) => unit.image).length,
    dated: units.filter((unit) => unit.launchYear).length,
    coming: units.filter((unit) => unit.status === "coming-soon").length,
    featured: units.filter(isFeatured).length,
    types: new Set(units.map((unit) => unit.typeKey)).size
  };
}

function renderCoverStats() {
  const s = archiveStats();
  setText(dom.coverTotal, s.total);
  setText(dom.coverCountries, s.countries);
  setText(dom.coverFilms, s.films);
  setText(dom.coverTypes, String(s.types).padStart(2, "0"));
  setText(dom.gateTotal, s.total);
  setText(dom.gateCountries, s.countries);
  setText(dom.gateFilms, s.films);
  if (dom.briefingTitle) setText(dom.briefingTitle, `${s.films} ${t("cover.stat3")}`);
  setText(dom.regTotal, s.total);
  setText(dom.regCountries, s.countries);
  setText(dom.regFilms, s.films);
  setText(dom.acquireTotal, s.total);
}

function renderTelemetry() {
  if (!dom.telemetry) return;
  const s = archiveStats();
  const counts = new Map();
  state.units.forEach((unit) => counts.set(unit.typeKey, (counts.get(unit.typeKey) || 0) + 1));
  const max = Math.max(...TYPE_ORDER.map((key) => counts.get(key) || 0), 1);

  dom.telemetry.innerHTML = TYPE_ORDER.map((key) => {
    const count = counts.get(key) || 0;
    const color = TYPE_META[key].color;
    return `<div class="telemetry__row">
      <div class="telemetry__top"><span>${esc(typeLabelOf(key))}</span><b>${count}</b></div>
      <div class="telemetry__bar"><i style="--c:${color};width:${((count / max) * 100).toFixed(1)}%"></i></div>
    </div>`;
  }).join("") + `<dl class="telemetry__split">
    <div><dt>${esc(t("filter.media"))}</dt><dd>${s.photos}</dd></div>
    <div><dt>${esc(t("filter.video"))}</dt><dd>${s.films}</dd></div>
    <div><dt>${esc(t("filter.coming"))}</dt><dd>${s.coming}</dd></div>
  </dl>`;

  if (dom.telemetryDate) dom.telemetryDate.textContent = formatDate(state.config.generatedAt);
  if (dom.footerDate) dom.footerDate.textContent = formatDate(state.config.generatedAt);
}

/* ---------- eras ---------- */

function eraCounts() {
  const counts = new Map(ERA_ORDER.map((key) => [key, 0]));
  state.units.forEach((unit) => {
    const era = eraOf(unit.launchYear);
    if (era) counts.set(era, (counts.get(era) || 0) + 1);
  });
  return counts;
}

function sparkPath(units, min, max) {
  const buckets = 10;
  const span = Math.max(1, max - min);
  const counts = new Array(buckets).fill(0);
  units.forEach((unit) => {
    if (!unit.launchYear) return;
    const idx = Math.min(buckets - 1, Math.max(0, Math.floor(((unit.launchYear - min) / span) * buckets)));
    counts[idx] += 1;
  });
  const peak = Math.max(...counts, 1);
  const step = 100 / (buckets - 1);
  const points = counts.map((count, i) => [i * step, 100 - (count / peak) * 86]);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L100 100 L0 100 Z`;
  return { line, area };
}

function renderEras() {
  const counts = eraCounts();
  const max = Math.max(...counts.values(), 1);

  if (dom.coverEras) {
    dom.coverEras.innerHTML = ERA_ORDER.map((key, index) => {
      const count = counts.get(key) || 0;
      return `<a class="cover__era" href="${esc(registryHref({ era: key }))}">
        <span class="n">${String(index + 1).padStart(2, "0")}</span>
        <span class="t">${esc(eraLabelOf(key))}</span>
        <span class="y">${esc(ERA_META[key].range)}</span>
        <span class="bar"><i style="width:${((count / max) * 100).toFixed(0)}%"></i></span>
      </a>`;
    }).join("");
  }

  if (dom.erasGrid) {
    dom.erasGrid.innerHTML = ERA_ORDER.map((key, index) => {
      const meta = ERA_META[key];
      const units = state.units.filter((unit) => eraOf(unit.launchYear) === key);
      const { line, area } = sparkPath(units, meta.min, meta.max >= 9999 ? 2030 : meta.max);
      return `<a class="era-card reveal" href="${esc(registryHref({ era: key }))}">
        <span class="era-card__n">${String(index + 1).padStart(2, "0")}</span>
        <svg class="era-card__spark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path class="area" d="${area}"></path>
          <path d="${line}"></path>
        </svg>
        <span class="era-card__name">${esc(eraLabelOf(key))}</span>
        <span class="era-card__years">${esc(meta.range)}</span>
        <span class="era-card__foot"><span>${counts.get(key) || 0} ${esc(t("eras.count"))}</span><span>${esc(t("eras.open"))} <svg class="icon" aria-hidden="true"><use href="#i-arrow"></use></svg></span></span>
      </a>`;
    }).join("");
  }
}

/* ---------- cards + rails ---------- */

function unitHref(unit) {
  const url = new URL("registro.html", siteRoot());
  if (unit?.id) url.searchParams.set("unit", unit.id);
  if (state.lang !== DEFAULT_LANG) url.searchParams.set("lang", state.lang);
  return url.href;
}

function unitCardMarkup(unit) {
  const color = TYPE_META[unit.typeKey]?.color || "#e8f1f5";
  const video = getVideoUrl(unit);
  const media = unit.image
    ? `<img src="${esc(unit.image)}" alt="" loading="lazy">`
    : `<span class="unit-card__media--empty" aria-hidden="true"><svg><use href="#i-sonar"></use></svg></span>`;
  return `<a class="unit-card" href="${esc(unitHref(unit))}">
    <span class="unit-card__media">${media}<span class="unit-card__badge">${esc(unit.dossier || "—")}</span></span>
    <span class="unit-card__body">
      <span class="unit-card__name">${esc(unit.name)}</span>
      <span class="unit-card__meta">${esc(countryLabel(unit.country))}${unit.launchYear ? ` · ${unit.launchYear}` : ""}</span>
      <span class="unit-card__foot" style="--c:${color}">
        <span>${esc(typeLabelOf(unit.typeKey))}</span>
        ${video ? `<svg class="icon" aria-hidden="true"><use href="#i-play"></use></svg>` : ""}
      </span>
    </span>
  </a>`;
}

function billboardMarkup(unit) {
  if (!unit) return "";
  const video = getVideoUrl(unit);
  const place = [unit.museum, unit.city, countryLabel(unit.country)].filter(Boolean).join(" · ");
  return `<div class="billboard__media ${unit.image ? "" : "billboard__media--empty"}">
      ${unit.image ? `<img src="${esc(unit.image)}" alt="${esc(unit.name)}" loading="lazy">` : ""}
    </div>
    <div class="billboard__body">
      <div>
        <span class="billboard__code">${esc(unit.dossier || "—")} · ${esc(typeLabelOf(unit.typeKey))}</span>
        <h3 class="billboard__name">${esc(unit.name)}</h3>
        <p class="billboard__meta">${esc(place)}${unit.launchYear ? `<br>${esc(t("dossier.specLaunch"))} ${unit.launchYear}` : ""}</p>
      </div>
      <div class="billboard__actions">
        <a class="btn btn--amber btn--sm" href="${esc(unitHref(unit))}">${esc(t("billboard.open"))} <svg class="icon" aria-hidden="true"><use href="#i-arrow"></use></svg></a>
        ${video ? `<button class="btn btn--line btn--sm" type="button" data-video="${esc(unit.id)}"><svg class="icon" aria-hidden="true"><use href="#i-play"></use></svg> ${esc(t("dossier.videoFallback"))}</button>` : ""}
      </div>
    </div>`;
}

function railMarkup({ title, color = "var(--amber)", units, total = 0, filterKey = "" }) {
  if (!units.length) return "";
  return `<section class="rail-group">
    <header class="rail__head">
      <h3 class="rail__title" style="--c:${color}"><i></i>${esc(title)} <span>${String(total || units.length).padStart(2, "0")}</span></h3>
      ${filterKey ? `<a class="rail__more" href="${esc(registryHref(filterKey))}">${esc(t("rail.seeAll"))} →</a>` : ""}
    </header>
    <div class="rail">${units.map(unitCardMarkup).join("")}</div>
  </section>`;
}

function renderFeatured() {
  const featured = state.units.filter(isFeatured);
  const billboardUnit = featured.find((unit) => unit.image) || featured[0];
  if (dom.featuredBillboard && billboardUnit) {
    dom.featuredBillboard.hidden = false;
    dom.featuredBillboard.innerHTML = billboardMarkup(billboardUnit);
  }

  if (!dom.featuredRails) return;
  const withVideoAll = state.units.filter(hasVideo);
  const withVideo = withVideoAll.slice(0, 12);
  const byType = TYPE_ORDER.map((key) => {
    const all = state.units
      .filter((unit) => unit.typeKey === key)
      .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)));
    return { key, all, units: all.slice(0, 10) };
  });

  dom.featuredRails.innerHTML =
    railMarkup({ title: t("rail.withVideo"), color: "var(--nuclear)", units: withVideo, total: withVideoAll.length, filterKey: { video: true } }) +
    byType.map(({ key, all, units }) => railMarkup({
      title: typeLabelOf(key),
      color: TYPE_META[key].color,
      units,
      total: all.length,
      filterKey: { type: key }
    })).join("");
}

/* ---------- social, share, briefing, origin ---------- */

const SOCIAL_LABELS = {
  website_url: "WEB",
  facebook_url: "FACEBOOK",
  twitter_url: "X",
  x_url: "X",
  linkedin_url: "LINKEDIN",
  youtube_url: "YOUTUBE",
  instagram_url: "INSTAGRAM",
  tiktok_url: "TIKTOK"
};

function renderSocial() {
  const social = state.config.social || {};
  const links = Object.entries(social)
    .map(([key, url]) => [SOCIAL_LABELS[key], safeUrl(url)])
    .filter(([label, url]) => label && url);
  const markup = links.map(([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join("");
  [dom.socialFoot, dom.socialMenu].forEach((el) => { if (el) el.innerHTML = markup; });
}

const SHARE = {
  x: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  whatsapp: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  email: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
};

function siteRoot() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.href;
}

function shareUrlFor(unit) {
  const url = new URL("registro.html", siteRoot());
  url.searchParams.set("unit", unit.id);
  if (state.lang !== DEFAULT_LANG) url.searchParams.set("lang", state.lang);
  return url.href;
}

function renderShare() {
  if (!dom.shareSite) return;
  const url = SITE_URL;
  const title = t("meta.title");
  dom.shareSite.innerHTML = Object.entries({ x: "X", facebook: "FACEBOOK", linkedin: "LINKEDIN", whatsapp: "WHATSAPP", email: "EMAIL" })
    .map(([key, label]) => `<a href="${esc(SHARE[key](url, title))}" target="_blank" rel="noopener noreferrer">${label}</a>`)
    .join("") + `<button type="button" data-copy-url="${esc(url)}">${esc(t("share.copy"))}</button>`;
}

function showModal(html, portrait = false) {
  if (!dom.modal || !dom.modalFrame) return;
  dom.modalFrame.classList.toggle("is-portrait", Boolean(portrait));
  dom.modalFrame.innerHTML = html;
  dom.modal.hidden = false;
  document.body.classList.add("is-locked");
  dom.modal.querySelector("button")?.focus();
  sfxClick();
}

function openVideoModal(unit) {
  const video = getVideoUrl(unit);
  if (!video) return;
  const id = youtubeId(video);
  if (id) {
    showModal(`<iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}?autoplay=1&rel=0&modestbranding=1" title="${esc(unit.name)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`, unit.verticalVideo);
    return;
  }
  if (isDirectVideo(video)) {
    showModal(`<video controls autoplay playsinline src="${esc(video)}"></video>`, unit.verticalVideo);
  }
}

function mountBriefing() {
  const playlist = safeUrl(state.config.youtubePlaylist);
  if (playlist && dom.briefingList) dom.briefingList.href = playlist;

  const open = () => {
    if (!playlist) return;
    const url = new URL(playlist);
    const list = url.searchParams.get("list");
    if (!list) return;
    showModal(`<iframe src="https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}&autoplay=1" title="${esc(t("briefing.title"))}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`);
  };
  dom.briefingOpen?.addEventListener("click", open);
  dom.briefingPlay?.addEventListener("click", open);
}

function closeModal() {
  if (!dom.modal || dom.modal.hidden) return;
  dom.modal.hidden = true;
  if (dom.modalFrame) {
    dom.modalFrame.innerHTML = "";
    dom.modalFrame.classList.remove("is-portrait");
  }
  document.body.classList.remove("is-locked");
}

function renderOrigin() {
  if (!dom.originText) return;
  const text = t("origin.text");
  dom.originText.innerHTML = sanitizeRich(text);
}

function sanitizeRich(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const allowed = new Set(["B", "STRONG", "I", "EM", "BR", "P", "SPAN", "A"]);
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
  const remove = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!allowed.has(node.tagName)) {
      remove.push(node);
      continue;
    }
    [...node.attributes].forEach((attr) => {
      if (!(node.tagName === "A" && attr.name === "href")) node.removeAttribute(attr.name);
    });
    if (node.tagName === "A") {
      const href = safeUrl(node.getAttribute("href"));
      if (href) node.setAttribute("href", href);
      else node.removeAttribute("href");
    }
  }
  remove.forEach((node) => node.replaceWith(...node.childNodes));
  return template.innerHTML;
}

/* ---------- register ---------- */

function sortUnits(units) {
  const list = units.slice();
  switch (state.sort) {
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name, state.lang));
    case "year-desc":
      return list.sort((a, b) => (b.launchYear || -1) - (a.launchYear || -1));
    case "year-asc":
      return list.sort((a, b) => (a.launchYear || 9999) - (b.launchYear || 9999));
    case "country":
      return list.sort((a, b) => countryLabel(a.country).localeCompare(countryLabel(b.country), state.lang) || a.name.localeCompare(b.name));
    default:
      return list.sort((a, b) => parseDossierNumber(a.dossier) - parseDossierNumber(b.dossier) || a.name.localeCompare(b.name));
  }
}

function registerRowMarkup(unit) {
  const color = TYPE_META[unit.typeKey]?.color || "#e8f1f5";
  const active = unit.id === state.lockedId;
  return `<li><button class="reg-row${active ? " is-locked" : ""}" type="button" data-unit="${esc(unit.id)}" aria-pressed="${active}">
    <span class="reg-row__code">${esc(unit.dossier || "—")}</span>
    <span class="reg-row__unit">
      <b class="reg-row__name">${esc(unit.name)}</b>
      <span class="reg-row__museum">${esc([unit.museum, unit.city].filter(Boolean).join(" · ") || countryLabel(unit.country))}</span>
    </span>
    <span class="reg-row__type" style="--c:${color}"><i></i>${esc(typeLabelOf(unit.typeKey))}</span>
    <span class="reg-row__country">${esc(countryLabel(unit.country))}</span>
    <span class="reg-row__year">${unit.launchYear || "—"}</span>
    <span class="reg-row__flags">
      ${unit.situation ? `<img class="reg-row__sit" src="${SITUATION_META[unit.situation].img}" alt="${esc(situationLabelOf(unit.situation))}" width="13" height="13">` : ""}
      ${hasVideo(unit) ? `<svg class="icon icon--film is-on" aria-hidden="true"><use href="#i-film"></use></svg>` : ""}
      ${unit.image ? `<svg class="icon is-on" aria-hidden="true"><use href="#i-pin"></use></svg>` : ""}
    </span>
  </button></li>`;
}

function renderRegister() {
  if (!dom.registerList) return;
  const list = sortUnits(filteredUnits());
  dom.registerList.innerHTML = list.map(registerRowMarkup).join("");
  if (dom.registerEmpty) dom.registerEmpty.hidden = list.length > 0;
  if (dom.registerList) dom.registerList.hidden = list.length === 0;
}

/* ---------- urls ---------- */

function langParam() {
  return state.lang !== DEFAULT_LANG ? state.lang : "";
}

function registryHref(overrides = {}) {
  const params = new URLSearchParams();
  const f = { ...state.filters, ...overrides };
  if (f.q) params.set("q", f.q);
  if (f.type && f.type !== "all") params.set("type", f.type);
  if (f.situation && f.situation !== "all") params.set("situacion", f.situation);
  if (f.country && f.country !== "all") params.set("pais", f.country);
  if (f.era && f.era !== "all") params.set("era", f.era);
  if (f.video) params.set("video", "1");
  if (f.media) params.set("foto", "1");
  if (f.coming) params.set("proximamente", "1");
  if (langParam()) params.set("lang", langParam());
  const query = params.toString();
  return `registro.html${query ? `?${query}` : ""}`;
}

function syncUrl() {
  if (state.page !== "register") return;
  const params = new URLSearchParams();
  const f = state.filters;
  if (f.q) params.set("q", f.q);
  if (f.type !== "all") params.set("type", f.type);
  if (f.situation !== "all") params.set("situacion", f.situation);
  if (f.country !== "all") params.set("pais", f.country);
  if (f.era !== "all") params.set("era", f.era);
  if (f.video) params.set("video", "1");
  if (f.media) params.set("foto", "1");
  if (f.coming) params.set("proximamente", "1");
  if (state.sort !== "default") params.set("orden", state.sort);
  if (state.lockedId) params.set("unit", state.lockedId);
  if (langParam()) params.set("lang", langParam());
  const query = params.toString();
  history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${state.lockedId ? "" : ""}`);
}

function readUrl() {
  const params = new URLSearchParams(window.location.search);
  const f = state.filters;
  f.q = params.get("q") || "";
  f.type = TYPE_META[params.get("type")] ? params.get("type") : "all";
  f.situation = SITUATION_META[params.get("situacion")] ? params.get("situacion") : "all";
  f.country = params.get("pais") || "all";
  f.era = ERA_META[params.get("era")] ? params.get("era") : "all";
  f.video = params.get("video") === "1";
  f.media = params.get("foto") === "1";
  f.coming = params.get("proximamente") === "1";
  state.sort = ["name", "year-desc", "year-asc", "country"].includes(params.get("orden")) ? params.get("orden") : "default";
  return params.get("unit");
}

function revealDeepLink() {
  const id = state.pendingUnit;
  state.pendingUnit = "";
  if (!id) return;
  const unit = state.units.find((entry) => entry.id === id);
  if (!unit) return;
  lockUnit(unit.id, { fly: true, scroll: state.page === "home", sheet: state.page === "register" });
}

/* ---------- events ---------- */

function bindFilters() {
  dom.search?.addEventListener("input", (event) => {
    state.filters.q = event.target.value;
    applyFilters();
  });

  dom.typeFilters?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-type]");
    if (!chip) return;
    const key = chip.dataset.type;
    const next = state.filters.type === key ? "all" : key;
    state.filters.type = next;
    dom.typeFilters.querySelectorAll("[data-type]").forEach((node) => node.setAttribute("aria-pressed", String(node.dataset.type === next)));
    applyFilters();
    sfxClick();
  });

  dom.situationFilters?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-situation]");
    if (!chip) return;
    const key = chip.dataset.situation;
    const next = state.filters.situation === key ? "all" : key;
    state.filters.situation = next;
    dom.situationFilters.querySelectorAll("[data-situation]").forEach((node) => node.setAttribute("aria-pressed", String(node.dataset.situation === next)));
    applyFilters();
    sfxClick();
  });

  dom.countryFilter?.addEventListener("change", (event) => {
    state.filters.country = event.target.value;
    applyFilters();
  });

  dom.eraFilter?.addEventListener("change", (event) => {
    state.filters.era = event.target.value;
    applyFilters();
  });

  dom.videoFilter?.addEventListener("click", () => {
    state.filters.video = !state.filters.video;
    dom.videoFilter.setAttribute("aria-pressed", String(state.filters.video));
    applyFilters();
    sfxClick();
  });

  dom.mediaFilter?.addEventListener("click", () => {
    state.filters.media = !state.filters.media;
    dom.mediaFilter.setAttribute("aria-pressed", String(state.filters.media));
    applyFilters();
    sfxClick();
  });

  dom.comingFilter?.addEventListener("click", () => {
    state.filters.coming = !state.filters.coming;
    dom.comingFilter.setAttribute("aria-pressed", String(state.filters.coming));
    applyFilters();
    sfxClick();
  });

  dom.resetFilters?.addEventListener("click", resetFilters);
  document.getElementById("register-reset")?.addEventListener("click", resetFilters);
  document.getElementById("register-empty-reset")?.addEventListener("click", resetFilters);

  dom.sort?.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderRegister();
    syncUrl();
  });
}

function bindDelegates() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const unitButton = target.closest("[data-unit]");
    if (unitButton) {
      event.preventDefault();
      const id = unitButton.dataset.unit;
      lockUnit(id, { fly: state.page === "home", scroll: state.page === "home", sheet: state.page === "register" && window.matchMedia("(max-width: 980px)").matches });
      return;
    }

    const videoButton = target.closest("[data-video]");
    if (videoButton) {
      event.preventDefault();
      const id = videoButton.dataset.video;
      const unit = state.units.find((entry) => entry.id === id);
      if (!unit) return;
      if (videoButton.closest(".dossier")) {
        mountVideo(unit, videoButton);
      } else {
        openVideoModal(unit);
      }
      return;
    }

    const copy = target.closest("[data-copy]");
    if (copy) {
      event.preventDefault();
      const unit = state.units.find((entry) => entry.id === copy.dataset.copy);
      if (unit) copyText(shareUrlFor(unit));
      return;
    }

    const copyUrl = target.closest("[data-copy-url]");
    if (copyUrl) {
      event.preventDefault();
      copyText(copyUrl.dataset.copyUrl);
      return;
    }

    const locate = target.closest("[data-locate]");
    if (locate) {
      event.preventDefault();
      if (state.page === "register") {
        const url = new URL("index.html", siteRoot());
        url.searchParams.set("unit", locate.dataset.locate);
        if (state.lang !== DEFAULT_LANG) url.searchParams.set("lang", state.lang);
        window.location.href = url.href;
      } else {
        lockUnit(locate.dataset.locate, { fly: true, scroll: true });
      }
      return;
    }

    if (target.closest("[data-dossier-close]")) {
      event.preventDefault();
      unlockUnit();
      return;
    }

    if (target.closest("#modal-close") || target.closest("#modal-x")) {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (dom.modal && !dom.modal.hidden) closeModal();
      else if (dom.registerSide?.classList.contains("is-open")) unlockUnit();
      else if (dom.menu && !dom.menu.hidden) closeMenu();
    }
  });
}

function copyText(text) {
  const done = () => showToast(t("toast.copied"));
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => showToast(t("toast.copyFailed")));
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  try { document.execCommand("copy"); done(); } catch (_) { showToast(t("toast.copyFailed")); }
  area.remove();
}

let toastTimer = null;
function showToast(message) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.add("is-on");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => dom.toast.classList.remove("is-on"), 2200);
}

/* ---------- menu + lang ---------- */

function openMenu() {
  if (!dom.menu) return;
  dom.menu.hidden = false;
  dom.menuOpen?.setAttribute("aria-expanded", "true");
  document.body.classList.add("is-locked");
  dom.menu.querySelector("a, button")?.focus();
}

function closeMenu() {
  if (!dom.menu) return;
  dom.menu.hidden = true;
  dom.menuOpen?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("is-locked");
}

function bindShell() {
  dom.menuOpen?.addEventListener("click", openMenu);
  dom.menuClose?.addEventListener("click", closeMenu);
  dom.menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.querySelectorAll(".lang").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lang]");
      if (!button) return;
      setLang(button.dataset.lang);
    });
  });

  dom.soundToggle?.addEventListener("click", () => {
    setSound(!state.sound);
  });

  dom.sheetBackdrop?.addEventListener("click", () => unlockUnit());

  const mq = window.matchMedia("(max-width: 720px)");
  const onResize = () => {
    state.map?.invalidateSize();
    if (!mq.matches) closeMenu();
  };
  window.addEventListener("resize", onResize, { passive: true });
  window.visualViewport?.addEventListener("resize", () => state.map?.invalidateSize(), { passive: true });
}

/* ---------- reveal on scroll ---------- */

let revealObserver = null;
function observeReveals() {
  if (reduceMotion() || !("IntersectionObserver" in window)) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  }
  document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => revealObserver.observe(el));
  document.querySelectorAll(".section__head, .billboard, .briefing__copy, .briefing__facade, .origin__body").forEach((el) => {
    if (!el.classList.contains("reveal")) {
      el.classList.add("reveal");
      revealObserver.observe(el);
    }
  });
}

/* ---------- nav active ---------- */

function bindNavSpy() {
  const links = [...document.querySelectorAll(".hud__nav a[href^='#']")];
  if (!links.length || !("IntersectionObserver" in window)) return;
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((section) => observer.observe(section));
}

/* ---------- render all ---------- */

function renderAll() {
  renderCoverStats();
  renderFilterChips();
  renderTelemetry();
  renderEras();
  renderFeatured();
  renderLog(filteredUnits());
  renderSocial();
  renderShare();
  renderOrigin();
  observeReveals();

  document.querySelectorAll("[data-dossier-close]").forEach((node) => {
    node.setAttribute("aria-label", t("dossier.close"));
  });

  if (state.lockedId) {
    const unit = state.units.find((entry) => entry.id === state.lockedId);
    if (unit) renderDossier(unit);
  } else {
    clearDossier();
  }

  if (state.page === "register") {
    renderRegister();
    if (dom.search) dom.search.value = state.filters.q;
    if (dom.countryFilter) dom.countryFilter.value = state.filters.country;
    if (dom.eraFilter) dom.eraFilter.value = state.filters.era;
    if (dom.sort) dom.sort.value = state.sort;
    if (dom.videoFilter) dom.videoFilter.setAttribute("aria-pressed", String(state.filters.video));
    if (dom.mediaFilter) dom.mediaFilter.setAttribute("aria-pressed", String(state.filters.media));
    if (dom.comingFilter) dom.comingFilter.setAttribute("aria-pressed", String(state.filters.coming));
  }
}

/* ---------- init ---------- */

async function init() {
  state.lang = resolveLang();
  cacheDom();
  bindShell();
  bindDelegates();
  bindFilters();
  bindNavSpy();

  if (dom.soundToggle) {
    const stored = localStorage.getItem(SOUND_KEY);
    state.sound = stored === "1";
    dom.soundToggle.setAttribute("aria-pressed", String(state.sound));
  }

  try {
    const [i18n, unitsRaw, config] = await Promise.all([
      fetchJSON(I18N_URL),
      fetchJSON(DATA_URL),
      fetchJSON(CONFIG_URL)
    ]);
    state.i18n = i18n || { en: {}, es: {} };
    state.config = config || {};
    state.units = (Array.isArray(unitsRaw) ? unitsRaw : unitsRaw.units || [])
      .map(normalizeUnit)
      .filter(Boolean);
  } catch (error) {
    console.error(error);
    if (dom.gate) dom.gate.hidden = true;
    if (dom.boot) dom.boot.hidden = true;
    if (dom.app) {
      dom.app.hidden = false;
      dom.app.innerHTML = `<div class="console__head" style="margin:10vh auto;max-width:640px">
        <p class="kicker">// ERROR</p>
        <h2 class="console__title">ARCHIVE OFFLINE</h2>
        <p>${esc(t("error.networkHint"))}</p>
      </div>`;
    }
    return;
  }

  applyStaticI18n();
  syncLangButtons();
  mountBriefing();

  const deepLink = readUrl();
  state.pendingUnit = deepLink || "";
  if (deepLink) state.lockedId = deepLink;

  renderCoverStats();
  renderFilterChips();
  renderTelemetry();
  renderEras();
  renderFeatured();
  renderSocial();
  renderShare();
  renderOrigin();
  observeReveals();

  if (state.page === "register") {
    applyFilters();
    if (dom.search) dom.search.value = state.filters.q;
    if (dom.countryFilter) dom.countryFilter.value = state.filters.country;
    if (dom.eraFilter) dom.eraFilter.value = state.filters.era;
    if (dom.sort) dom.sort.value = state.sort;
    if (dom.videoFilter) dom.videoFilter.setAttribute("aria-pressed", String(state.filters.video));
    if (dom.mediaFilter) dom.mediaFilter.setAttribute("aria-pressed", String(state.filters.media));
    if (dom.comingFilter) dom.comingFilter.setAttribute("aria-pressed", String(state.filters.coming));

    if (dom.boot) {
      dom.boot.hidden = true;
      dom.app && (dom.app.hidden = false);
      if (state.pendingUnit) {
        const unit = state.units.find((entry) => entry.id === state.pendingUnit);
        if (unit) renderDossier(unit, { sheet: window.matchMedia("(max-width: 980px)").matches });
      }
    }
    if (dom.app) dom.app.hidden = false;
    observeReveals();
    return;
  }

  initGate();
}

document.addEventListener("DOMContentLoaded", init);
