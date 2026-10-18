/* ============================================================
   SUBMARINOS MUSEO // ARCHIVO NAVAL
   app.js — arranque, mapa, filtros, registro y dossier
   ============================================================ */

const DATA_URL = "data/submarines.json";
const CONFIG_URL = "data/config.json";
const I18N_URL = "data/i18n.json";
const LANG_STORAGE_KEY = "snk-lang";
const LANGS = ["es", "en"];
const DEFAULT_LANG = "es";

const TYPE_META = {
  diesel: { label: "Diésel", icon: "i-sub", color: "#ffb020" },
  nuclear: { label: "Nuclear", icon: "i-atom", color: "#9dff4d" },
  electric: { label: "Eléctrico", icon: "i-bolt", color: "#4db8ff" },
  "hand-crank": { label: "Manivela", icon: "i-gear", color: "#c9b98f" }
};

const TYPE_ORDER = ["diesel", "nuclear", "electric", "hand-crank"];

const SITUATION_META = {
  flote: { label: "A flote", icon: "sit-flote", color: "#9fb3c8" },
  agua: { label: "En el agua", icon: "sit-agua", color: "#38a3ff" },
  tierra: { label: "En tierra", icon: "sit-tierra", color: "#d16bff" },
  cerrado: { label: "Bajo techo", icon: "sit-cerrado", color: "#35d64a" },
  monumento: { label: "Solo monumento", icon: "sit-monumento", color: "#e0532b" }
};

const SITUATION_ORDER = ["flote", "agua", "tierra", "cerrado", "monumento"];
const BASE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const LABEL_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

const state = {
  units: [],
  unitById: new Map(),
  filtered: [],
  selectedId: null,
  markers: new Map(),
  cluster: null,
  map: null,
  bounds: null,
  halo: null,
  config: {},
  i18n: {},
  lang: DEFAULT_LANG,
  filters: {
    q: "",
    types: new Set(),
    situations: new Set(),
    country: "all",
    media: false,
    video: false,
    coming: false
  },
  searchFrame: 0,
  toastTimer: 0,
  prefersReduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

const dom = {};

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ESCAPES[character]);

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/* ---------- Idioma (ES / EN) ---------- */

function tOrNull(key) {
  const dictionary = state.i18n[state.lang];
  if (!dictionary) return null;
  const value = dictionary[key];
  return typeof value === "string" ? value : null;
}

function t(key, vars) {
  let value = key;

  for (const dictionary of [state.i18n[state.lang], state.i18n[DEFAULT_LANG]]) {
    if (dictionary && typeof dictionary[key] === "string") {
      value = dictionary[key];
      break;
    }
  }

  if (!vars) return value;

  return Object.entries(vars).reduce(
    (accumulator, [name, replacement]) =>
      accumulator.replaceAll(`{${name}}`, String(replacement)),
    value
  );
}

function typeLabelOf(typeKey) {
  return t(`type.${typeKey}`);
}

function situationLabelOf(key) {
  return SITUATION_META[key] ? t(`situation.${key}`) : "";
}

function countryLabel(name) {
  const raw = String(name || "").trim();
  if (!raw) return "";

  const key = `country.${raw}`;
  return (
    tOrNull(key) ??
    (state.i18n[DEFAULT_LANG] ? state.i18n[DEFAULT_LANG][key] : null) ??
    raw
  );
}

function bilingualCountry(name) {
  const raw = String(name || "").trim();
  if (!raw) return "";

  return LANGS.map((lang) => {
    const dictionary = state.i18n[lang];
    return dictionary ? dictionary[`country.${raw}`] || "" : "";
  })
    .filter(Boolean)
    .join(" ");
}

function translateNode(node) {
  const key = node.dataset.i18n;
  if (!key) return;

  const value = tOrNull(key);
  if (value == null) return;

  if (value.includes("\n")) {
    node.innerHTML = value
      .split("\n")
      .map((line) => esc(line))
      .join("<br>");
  } else {
    node.textContent = value;
  }
}

function applyStaticI18n() {
  document.documentElement.lang = state.lang;

  document.querySelectorAll("[data-i18n]").forEach(translateNode);

  document.querySelectorAll("[data-i18n-attr]").forEach((node) => {
    for (const pair of node.dataset.i18nAttr.split(";")) {
      const [attribute, key] = pair.split(":").map((part) => part.trim());
      if (!attribute || !key) continue;

      const value = tOrNull(key);
      if (value != null) node.setAttribute(attribute, value);
    }
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang));
  });
}

function resolveLang() {
  const requested = (new URLSearchParams(window.location.search).get("lang") || "").toLowerCase();
  if (LANGS.includes(requested)) return requested;

  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && LANGS.includes(stored)) return stored;
  } catch {
    /* localStorage puede no estar disponible en este contexto. */
  }

  const preferred = (navigator.language || "").slice(0, 2).toLowerCase();
  return LANGS.includes(preferred) ? preferred : DEFAULT_LANG;
}

function configText(key, sheetValue) {
  const translated = tOrNull(`config.${key}`);
  if (state.lang !== DEFAULT_LANG && translated != null) return translated;
  return sheetValue || translated || "";
}

function normalizeFooterYear(text) {
  const year = String(new Date().getFullYear());
  return String(text || "").replace(/(©\s*)(\d{4})/, `$1${year}`);
}

function cacheDom() {
  const byId = (id) => document.getElementById(id);

  dom.app = byId("app");
  dom.boot = byId("boot");
  dom.toast = byId("toast");

  dom.headerCount = byId("header-count");
  dom.heroSubtitle = byId("hero-subtitle");
  dom.heroTotal = byId("hero-total");
  dom.heroCountries = byId("hero-countries");
  dom.heroTypes = byId("hero-types");
  dom.heroMedia = byId("hero-media");

  dom.featuredTitle = byId("featured-title");
  dom.featuredCount = byId("featured-count");
  dom.featuredCountLabel = byId("featured-count-label");
  dom.featuredGrid = byId("featured-grid");

  dom.mapSection = byId("map-section");
  dom.map = byId("map");
  dom.mapCount = byId("map-count");
  dom.mapCountLabel = byId("map-count-label");
  dom.mapLegend = byId("map-legend");
  dom.mapZoom = byId("map-zoom");
  dom.mapCoords = byId("map-coords");

  dom.search = byId("search");
  dom.typeFilters = byId("type-filters");
  dom.countryFilter = byId("country-filter");
  dom.mediaFilter = byId("media-filter");
  dom.videoFilter = byId("video-filter");
  dom.situationFilters = byId("situation-filters");
  dom.comingFilter = byId("coming-filter");
  dom.resetFilters = byId("reset-filters");

  dom.dossierSection = byId("dossier");
  dom.dossierContent = byId("dossier-content");
  dom.dossierClose = byId("dossier-close");

  dom.registryList = byId("registry-list");
  dom.registryEmpty = byId("registry-empty");
  dom.registryCount = byId("registry-count");
  dom.registryCountLabel = byId("registry-count-label");
  dom.registryReset = byId("registry-reset");
  dom.sortSelect = byId("sort-select");

  dom.generatedAt = byId("generated-at");
  dom.statTotal = byId("stat-total");
  dom.statCountries = byId("stat-countries");
  dom.statMuseums = byId("stat-museums");
  dom.statMedia = byId("stat-media");
  dom.statComing = byId("stat-coming");
  dom.statWw2 = byId("stat-ww2");
  dom.typeBars = byId("type-bars");
  dom.coveragePct = byId("coverage-pct");
  dom.coverageBar = byId("coverage-bar");

  dom.aboutTitle = byId("about-title");
  dom.aboutText = byId("about-text");
  dom.socialLinks = byId("social-links");
  dom.footerText = byId("footer-text");
  dom.footerDate = byId("footer-date");
}

/* ---------- Utilidades ---------- */

function safeUrl(raw) {
  if (!raw) return "";

  try {
    const url = new URL(String(raw).trim(), document.baseURI);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.href;
  } catch {
    return "";
  }
}

function firstUrl(raw) {
  if (!raw) return "";

  for (const part of String(raw).trim().split(/\s+/)) {
    const url = safeUrl(part);
    if (url) return url;
  }

  return "";
}

function youtubeId(raw) {
  const value = safeUrl(raw);
  if (!value) return "";

  let url;
  try {
    url = new URL(value);
  } catch {
    return "";
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  let id = "";

  if (host === "youtu.be") {
    id = url.pathname.slice(1);
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v") || "";
    } else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{6,20})/);
      if (match) id = match[1];
    }
  }

  id = id.split(/[/?&#]/)[0];
  return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : "";
}

function isDirectVideo(url) {
  return /\.(mp4|webm|ogv|ogg|mov|m4v)(?:[?#].*)?$/i.test(String(url || ""));
}

function getVideoUrl(unit) {
  if (unit.videoUrl) return unit.videoUrl;
  if (youtubeId(unit.link)) return unit.link;
  return "";
}

function hasMedia(unit) {
  return Boolean(unit.image || getVideoUrl(unit));
}

function isFeatured(unit) {
  return unit.featured || Boolean(getVideoUrl(unit));
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/ø/gi, "o")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .trim();
}

function typeMeta(typeKey) {
  return TYPE_META[typeKey] || TYPE_META.diesel;
}

function situationMeta(key) {
  return SITUATION_META[key] || null;
}

function bilingualWords(prefix, key) {
  if (!key) return "";

  return LANGS.map((lang) => {
    const dictionary = state.i18n[lang];
    return dictionary ? dictionary[`${prefix}.${key}`] || "" : "";
  })
    .filter(Boolean)
    .join(" ");
}

function resolveSituation(raw) {
  const key = String(raw.situation || "")
    .toLowerCase()
    .trim();

  if (SITUATION_META[key]) return key;
  if (raw.afloat === true) return "flote";
  return "";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function parseDossierNumber(value) {
  const match = String(value || "").match(/(\d+)/);
  return match ? Number(match[1]) : 9999;
}

const DATE_FORMAT = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

function formatDate(raw) {
  if (!raw) return "--";

  const value = String(raw);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? "--" : DATE_FORMAT.format(date);
}

function formatCoords(unit) {
  const ns = unit.lat >= 0 ? "N" : "S";
  const ew = unit.lng >= 0 ? "E" : "W";
  return `${Math.abs(unit.lat).toFixed(2)}°${ns} / ${Math.abs(unit.lng).toFixed(2)}°${ew}`;
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function countByType() {
  const counts = {};
  for (const unit of state.units) counts[unit.typeKey] = (counts[unit.typeKey] || 0) + 1;
  return counts;
}

function sanitizeRich(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");

  const allowed = new Set(["B", "STRONG", "I", "EM", "BR", "P", "SPAN", "A"]);

  template.content.querySelectorAll("*").forEach((element) => {
    if (!allowed.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    for (const attribute of Array.from(element.attributes)) {
      if (element.tagName === "A" && attribute.name === "href") {
        const url = safeUrl(attribute.value);
        if (url) element.setAttribute("href", url);
        else element.removeAttribute("href");
      } else {
        element.removeAttribute(attribute.name);
      }
    }

    if (element.tagName === "A" && element.hasAttribute("href")) {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
  });

  return template.innerHTML;
}

/* ---------- Datos ---------- */

function resolveType(raw) {
  const key = String(raw.typeKey || "").toLowerCase();
  if (TYPE_META[key]) return key;

  const label = `${raw.type || ""} ${raw.typeLabel || ""}`.toLowerCase();
  if (label.includes("nuclear")) return "nuclear";
  if (label.includes("electric") || label.includes("eléctric")) return "electric";
  if (label.includes("hand") || label.includes("manivela")) return "hand-crank";
  return "diesel";
}

function normalizeUnit(raw, index) {
  if (!raw || typeof raw !== "object") return null;

  const lat = Number(raw.lat);
  const lng = Number(raw.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }

  const typeKey = resolveType(raw);
  const meta = TYPE_META[typeKey];
  const launchYear = Number(raw.launchYear);
  const situationKey = resolveSituation(raw);

  const unit = {
    id: String(raw.id || "").trim() || `unit-${index + 1}`,
    dossier: String(raw.dossier || "").trim(),
    name: String(raw.name || "Unidad sin nombre").trim(),
    type: String(raw.type || "").trim(),
    typeKey,
    typeLabel: meta.label,
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
    situation: situationKey,
    situationLabel: situationKey ? SITUATION_META[situationKey].label : "",
    featured: raw.featured === true,
    afloat: raw.afloat === true || situationKey === "flote" || situationKey === "agua",
    status: raw.status === "coming-soon" ? "coming-soon" : "open",
    description: String(raw.description || "").trim(),
    verticalVideo: raw.verticalVideo === true || raw.videoVertical === true
  };

  unit._search = normalizeText(
    [
      unit.name,
      unit.dossier,
      unit.museum,
      unit.city,
      unit.country,
      unit.nationality,
      unit.class,
      unit.typeLabel,
      unit.situationLabel,
      bilingualWords("type", typeKey),
      bilingualWords("situation", situationKey),
      bilingualCountry(unit.country)
    ].join(" ")
  );

  return unit;
}

async function fetchJSON(url) {
  const response = await fetch(url, { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`${t("error.file")} ${url} (HTTP ${response.status}).`);
  }

  return response.json();
}

/* ---------- Configuración y cifras ---------- */

function hydrateConfig(config) {
  const cfg = config || {};

  setText(dom.heroSubtitle, configText("heroSubtitle", cfg.heroSubtitle));
  setText(dom.featuredTitle, configText("featuredTitle", cfg.featuredTitle));
  setText(dom.aboutTitle, configText("aboutTitle", cfg.aboutTitle));

  const aboutText = configText("aboutText", cfg.aboutText);
  if (aboutText) dom.aboutText.innerHTML = sanitizeRich(aboutText);

  setText(dom.footerText, normalizeFooterYear(configText("footerText", cfg.footerText)));

  const logo = safeUrl(cfg.logo);
  if (logo) {
    document.querySelectorAll("img.brand__mark").forEach((image) => {
      image.src = logo;
    });

    const aboutLogo = document.querySelector(".about__logo img");
    if (aboutLogo) aboutLogo.src = logo;
  }

  const heroImage = safeUrl(cfg.heroImage);
  if (heroImage) {
    document.documentElement.style.setProperty(
      "--hero-image",
      `url("${heroImage.replace(/"/g, "%22")}")`
    );
  }

  renderSocial(cfg.social);

  const snapshot = formatDate(cfg.generatedAt);
  setText(dom.generatedAt, snapshot);
  setText(dom.footerDate, snapshot);
}

function socialLabel(key, url) {
  const name = String(key || "").toLowerCase();

  if (name.includes("face")) return "FACEBOOK";
  if (name.includes("insta")) return "INSTAGRAM";
  if (name.includes("you")) return "YOUTUBE";
  if (name.includes("twit") || name === "x" || name.includes("x_")) return "X";
  if (name.includes("link")) return "LINKEDIN";
  if (name.includes("tik")) return "TIKTOK";
  if (name.includes("web") || name.includes("site")) return "WEB";

  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".")[0].slice(0, 12).toUpperCase();
  } catch {
    return "ENLACE";
  }
}

function renderSocial(social) {
  if (!dom.socialLinks) return;

  const links = Object.entries(social && typeof social === "object" ? social : {})
    .map(([key, value]) => [key, safeUrl(value)])
    .filter(([, url]) => Boolean(url));

  dom.socialLinks.hidden = links.length === 0;
  dom.socialLinks.innerHTML = links
    .map(
      ([key, url]) =>
        `<a class="social__link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(
          socialLabel(key, url)
        )}</a>`
    )
    .join("");
}

function renderStats() {
  const units = state.units;
  const total = units.length;
  const countries = new Set(units.map((unit) => unit.country).filter(Boolean)).size;
  const museums = new Set(units.map((unit) => unit.museum).filter(Boolean)).size;
  const media = units.filter(hasMedia).length;
  const coming = units.filter((unit) => unit.status === "coming-soon").length;
  const ww2 = units.filter(
    (unit) => unit.launchYear && unit.launchYear >= 1939 && unit.launchYear <= 1945
  ).length;
  const types = new Set(units.map((unit) => unit.typeKey)).size;

  setText(dom.headerCount, total);
  setText(dom.heroTotal, total);
  setText(dom.heroCountries, countries);
  setText(dom.heroTypes, pad2(types));
  setText(dom.heroMedia, media);
  setText(dom.statTotal, total);
  setText(dom.statCountries, countries);
  setText(dom.statMuseums, museums);
  setText(dom.statMedia, media);
  setText(dom.statComing, coming);
  setText(dom.statWw2, ww2);

  const coverage = total ? Math.round((media / total) * 100) : 0;
  setText(dom.coveragePct, `${coverage}%`);
  if (dom.coverageBar) dom.coverageBar.style.width = `${coverage}%`;
}

function buildTypeFilters() {
  if (!dom.typeFilters) return;

  const counts = countByType();

  dom.typeFilters.innerHTML = TYPE_ORDER.map((key) => {
    const meta = TYPE_META[key];
    return `<button class="chip" type="button" data-type="${key}" aria-pressed="false" style="--type-color:${meta.color}">
      <span class="chip__dot" aria-hidden="true"></span>${esc(typeLabelOf(key))}<span class="chip__count">${
      counts[key] || 0
    }</span>
    </button>`;
  }).join("");
}

function buildSituationFilters() {
  if (!dom.situationFilters) return;

  const counts = new Map();

  for (const unit of state.units) {
    if (!unit.situation) continue;
    counts.set(unit.situation, (counts.get(unit.situation) || 0) + 1);
  }

  const keys = SITUATION_ORDER.filter((key) => counts.get(key));
  dom.situationFilters.hidden = keys.length === 0;
  dom.situationFilters.innerHTML = keys
    .map((key) => {
      const meta = SITUATION_META[key];
      return `<button class="chip" type="button" data-situation="${key}" aria-pressed="false" style="--sit-color:${meta.color}">
        <span class="sit-icon" aria-hidden="true"><svg class="icon"><use href="#${meta.icon}"></use></svg></span>${esc(
        situationLabelOf(key)
      )}<span class="chip__count">${counts.get(key)}</span>
      </button>`;
    })
    .join("");
}

function buildCountryFilter() {
  if (!dom.countryFilter) return;

  const counts = new Map();

  for (const unit of state.units) {
    if (!unit.country) continue;
    counts.set(unit.country, (counts.get(unit.country) || 0) + 1);
  }

  const countries = Array.from(counts.keys()).sort((a, b) =>
    countryLabel(a).localeCompare(countryLabel(b), state.lang)
  );
  const selected = state.filters.country;

  dom.countryFilter.innerHTML = "";

  const all = document.createElement("option");
  all.value = "all";
  all.textContent = t("filter.allCountries");
  dom.countryFilter.append(all);

  for (const country of countries) {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = `${countryLabel(country)} (${counts.get(country)})`;
    dom.countryFilter.append(option);
  }

  dom.countryFilter.value = selected === "all" || counts.has(selected) ? selected : "all";
  state.filters.country = dom.countryFilter.value;
}

function buildLegend() {
  if (!dom.mapLegend) return;

  const counts = countByType();

  dom.mapLegend.innerHTML = TYPE_ORDER.map((key) => {
    const meta = TYPE_META[key];
    return `<span class="legend-item" style="--type-color:${meta.color}">
      <span class="legend-dot" aria-hidden="true"></span>${esc(typeLabelOf(key))} <b>${
      counts[key] || 0
    }</b>
    </span>`;
  }).join("");
}

function buildTypeBars() {
  if (!dom.typeBars) return;

  const counts = countByType();
  const total = state.units.length;
  const max = Math.max(...TYPE_ORDER.map((key) => counts[key] || 0), 1);

  dom.typeBars.innerHTML = TYPE_ORDER.map((key) => {
    const meta = TYPE_META[key];
    const count = counts[key] || 0;
    const percent = total ? Math.round((count / total) * 100) : 0;
    const width = Math.max(2, Math.round((count / max) * 100));

    return `<div class="type-row" title="${esc(t("intel.ofArchive", { percent }))}">
      <span class="type-row__label"><span class="legend-dot" style="--type-color:${meta.color}" aria-hidden="true"></span>${esc(
      typeLabelOf(key)
    )}</span>
      <span class="type-row__bar"><span style="--w:${width}%;--type-color:${meta.color}"></span></span>
      <span class="type-row__num">${count}</span>
    </div>`;
  }).join("");
}

function featuredCardMarkup(unit) {
  const meta = typeMeta(unit.typeKey);
  const image = unit.image
    ? `<img src="${esc(unit.image)}" alt="${esc(
        t("alt.featured", { name: unit.name })
      )}" loading="lazy" referrerpolicy="no-referrer" data-card-fallback>`
    : `<span class="featured-card__fallback">${blueprintMarkup()}</span>`;
  const location =
    [unit.museum, unit.city].filter(Boolean).join(" · ") ||
    countryLabel(unit.country) ||
    t("featured.locationUndocumented");

  return `<button class="featured-card" type="button" data-unit="${esc(unit.id)}">
    <span class="featured-card__media">
      ${image}
      <span class="featured-card__type" style="--type-color:${meta.color}"><svg class="icon" aria-hidden="true"><use href="#${
    meta.icon
  }"></use></svg>${esc(typeLabelOf(unit.typeKey))}</span>
    </span>
    <span class="featured-card__body">
      <span class="featured-card__code">${esc(unit.dossier || unit.id)}</span>
      <span class="featured-card__name">${esc(unit.name)}</span>
      <span class="featured-card__loc">${esc(location)}</span>
    </span>
  </button>`;
}

function renderFeatured() {
  if (!dom.featuredGrid) return;

  const list = state.units.filter(isFeatured);

  setText(dom.featuredCount, list.length);
  setText(dom.featuredCountLabel, t(list.length === 1 ? "section.featured.one" : "section.featured.many"));
  dom.featuredGrid.innerHTML = list.map(featuredCardMarkup).join("");
}

function handleFeaturedMediaError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.hasAttribute("data-card-fallback")) return;

  image.outerHTML = `<span class="featured-card__fallback">${blueprintMarkup()}</span>`;
}

/* ---------- Mapa ---------- */
function initMap() {
  if (!window.L) throw new Error("No se pudo cargar el motor de mapas (Leaflet).");

  const L = window.L;

  const map = L.map(dom.map, {
    minZoom: 2,
    maxZoom: 16,
    zoomSnap: 0.5,
    worldCopyJump: true,
    attributionControl: true,
    zoomControl: true
  });

  state.map = map;
  map.setView([20, 0], 2);

  L.tileLayer(BASE_TILES, {
    maxZoom: 16,
    maxNativeZoom: 16,
    attribution:
      '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> · HERE, Garmin, NOAA'
  }).addTo(map);

  L.tileLayer(LABEL_TILES, {
    maxZoom: 16,
    maxNativeZoom: 16
  }).addTo(map);

  const clusterOptions = {
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    zoomToBoundsOnClick: true,
    animate: !state.prefersReduced,
    maxClusterRadius: (zoom) => (zoom > 8 ? 30 : 46),
    spiderfyDistanceMultiplier: 1.5,
    spiderLegPolylineOptions: { weight: 1, color: "#c6ff3d", opacity: 0.4 },
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      const size = count < 10 ? 34 : count < 100 ? 42 : 52;
      const variant = count < 10 ? "" : count < 100 ? " snk-cluster--mid" : " snk-cluster--lg";

      return L.divIcon({
        className: "snk-cluster-wrap",
        html: `<span class="snk-cluster${variant}" style="--size:${size}px" role="img" aria-label="${esc(
          t("map.cluster", { count })
        )}">${count}</span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });
    }
  };

  state.cluster =
    typeof L.markerClusterGroup === "function"
      ? L.markerClusterGroup(clusterOptions)
      : L.layerGroup();

  state.cluster.addTo(map);

  state.bounds = L.latLngBounds([]);

  for (const unit of state.units) {
    state.bounds.extend([unit.lat, unit.lng]);

    const meta = typeMeta(unit.typeKey);
    const sit = situationMeta(unit.situation);
    const sitBadge = sit
      ? `<span class="snk-marker__sit" style="--sit-color:${sit.color}" aria-hidden="true"><svg class="icon"><use href="#${sit.icon}"></use></svg></span>`
      : "";
    const marker = L.marker([unit.lat, unit.lng], {
      icon: L.divIcon({
        className: "snk-marker-wrap",
        html: `<span class="snk-marker" style="--type-color:${meta.color}"><svg class="icon" aria-hidden="true"><use href="#${meta.icon}"></use></svg>${sitBadge}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      title: unit.name,
      alt: `${unit.name} — ${unit.museum || unit.city}`,
      riseOnHover: true,
      keyboard: true
    });

    marker.bindTooltip(esc(unit.name), {
      direction: "top",
      offset: [0, -8],
      opacity: 1,
      className: "snk-tooltip"
    });

    marker.on("add", () => {
      const element = marker.getElement();
      if (!element) return;
      element.setAttribute("role", "button");
      element.setAttribute(
        "aria-label",
        `${unit.name}. ${
          unit.museum || unit.city || countryLabel(unit.country)
        }. ${t("map.openDossier")}`
      );

      const markerElement = element.querySelector(".snk-marker");
      if (markerElement) {
        markerElement.classList.toggle("is-active", unit.id === state.selectedId);
      }
    });

    marker.on("click", () => selectUnit(unit.id, { scroll: true, focusMap: false }));

    state.markers.set(unit.id, marker);
    state.cluster.addLayer(marker);
  }

  addRecenterControl(map);
  map.on("move zoomend", updateMapHud);
  map.on("zoomend moveend", refreshSelectionStyles);
  updateMapHud();
}

function addRecenterControl(map) {
  const L = window.L;

  const recenter = L.control({ position: "topleft" });

  recenter.onAdd = () => {
    const button = L.DomUtil.create("button", "map-recenter");
    button.type = "button";
    button.title = t("map.recenter");
    button.setAttribute("aria-label", t("map.recenterAria"));
    button.innerHTML =
      '<svg class="icon" aria-hidden="true"><use href="#i-crosshair"></use></svg>';

    L.DomEvent.disableClickPropagation(button);
    L.DomEvent.on(button, "click", () => {
      fitAll();
      button.blur();
    });

    return button;
  };

  recenter.addTo(map);
}

function fitAll() {
  if (!state.map || !state.bounds || !state.bounds.isValid()) return;

  const maxZoom = state.map.getSize().x < 700 ? 3 : 4;
  state.map.fitBounds(state.bounds, { padding: [26, 26], maxZoom });
}

function updateMapHud() {
  if (!state.map) return;

  const center = state.map.getCenter();
  const lat = `${Math.abs(center.lat).toFixed(1)}${center.lat >= 0 ? "N" : "S"}`;
  const lng = `${Math.abs(center.lng).toFixed(1)}${center.lng >= 0 ? "E" : "W"}`;

  setText(dom.mapZoom, `Z ${pad2(Math.round(state.map.getZoom()))}`);
  setText(dom.mapCoords, `${lat} / ${lng}`);
}

/* ---------- Filtros y registro ---------- */

function filtersActive() {
  const filters = state.filters;
  return Boolean(
    filters.q.trim() ||
      filters.types.size ||
      filters.situations.size ||
      filters.country !== "all" ||
      filters.media ||
      filters.video ||
      filters.coming
  );
}

function applyFilters() {
  const filters = state.filters;
  const query = normalizeText(filters.q);

  state.filtered = state.units.filter((unit) => {
    if (filters.types.size && !filters.types.has(unit.typeKey)) return false;
    if (filters.situations.size && !filters.situations.has(unit.situation)) return false;
    if (filters.country !== "all" && unit.country !== filters.country) return false;
    if (filters.media && !hasMedia(unit)) return false;
    if (filters.video && !getVideoUrl(unit)) return false;
    if (filters.coming && unit.status !== "coming-soon") return false;
    if (query && !unit._search.includes(query)) return false;
    return true;
  });

  if (dom.typeFilters) {
    dom.typeFilters.querySelectorAll("[data-type]").forEach((button) => {
      button.setAttribute("aria-pressed", String(filters.types.has(button.dataset.type)));
    });
  }

  if (dom.situationFilters) {
    dom.situationFilters.querySelectorAll("[data-situation]").forEach((button) => {
      button.setAttribute("aria-pressed", String(filters.situations.has(button.dataset.situation)));
    });
  }

  if (dom.mediaFilter) dom.mediaFilter.setAttribute("aria-pressed", String(filters.media));
  if (dom.videoFilter) dom.videoFilter.setAttribute("aria-pressed", String(filters.video));
  if (dom.comingFilter) dom.comingFilter.setAttribute("aria-pressed", String(filters.coming));
  if (dom.resetFilters) dom.resetFilters.hidden = !filtersActive();

  setText(dom.mapCount, state.filtered.length);
  setText(
    dom.mapCountLabel,
    t(state.filtered.length === 1 ? "section.map.one" : "section.map.many")
  );
  syncMarkers();
  renderRegistry();
}

function syncMarkers() {
  if (!state.cluster) return;

  const layers = state.filtered
    .map((unit) => state.markers.get(unit.id))
    .filter(Boolean);

  state.cluster.clearLayers();
  if (layers.length) state.cluster.addLayers(layers);

  refreshSelectionStyles();
}

function sortUnits(list) {
  const sorted = [...list];
  const byName = (a, b) => a.name.localeCompare(b.name, state.lang, { sensitivity: "base" });
  const byCountry = (a, b) =>
    a.country.localeCompare(b.country, state.lang, { sensitivity: "base" }) || byName(a, b);

  switch (dom.sortSelect ? dom.sortSelect.value : "default") {
    case "name":
      sorted.sort(byName);
      break;
    case "year-desc":
      sorted.sort(
        (a, b) =>
          (b.launchYear ?? -Infinity) - (a.launchYear ?? -Infinity) || byName(a, b)
      );
      break;
    case "year-asc":
      sorted.sort(
        (a, b) => (a.launchYear ?? Infinity) - (b.launchYear ?? Infinity) || byName(a, b)
      );
      break;
    case "country":
      sorted.sort(byCountry);
      break;
    default:
      sorted.sort(
        (a, b) => parseDossierNumber(a.dossier) - parseDossierNumber(b.dossier) || byName(a, b)
      );
  }

  return sorted;
}

function rowMarkup(unit) {
  const selected = unit.id === state.selectedId;
  const meta = typeMeta(unit.typeKey);
  const sit = situationMeta(unit.situation);
  const coming = unit.status === "coming-soon";
  const sitInline = sit
    ? `<span class="sit-inline" style="--sit-color:${sit.color}" title="${esc(
        situationLabelOf(unit.situation)
      )}" aria-hidden="true"><svg class="icon"><use href="#${sit.icon}"></use></svg></span>`
    : "";

  return `<button class="unit-row${selected ? " is-selected" : ""}" type="button" data-unit="${esc(
    unit.id
  )}"${selected ? ' aria-current="true"' : ""}>
    <span class="unit-row__code">${esc(unit.dossier || unit.id)}</span>
    <span class="unit-row__main">
      <span class="unit-row__name">${esc(unit.name)}</span>
      <span class="unit-row__museum">${esc(unit.museum || t("dossier.museumUndocumented"))}${
    coming ? ` · ${esc(t("dossier.badgeComing"))}` : ""
  }</span>
    </span>
    <span class="unit-row__type" style="--type-color:${meta.color}">${sitInline}<span class="unit-row__dot" aria-hidden="true"></span>${esc(
    typeLabelOf(unit.typeKey)
  )}</span>
    <span class="unit-row__country">${esc(countryLabel(unit.country) || "—")}</span>
    <span class="unit-row__year">${unit.launchYear || "—"}</span>
    <span class="unit-row__arrow" aria-hidden="true"><svg class="icon"><use href="#i-arrow"></use></svg></span>
  </button>`;
}

function renderRegistry() {
  if (!dom.registryList) return;

  const list = sortUnits(state.filtered);

  setText(dom.registryCount, list.length);
  setText(dom.registryCountLabel, t(list.length === 1 ? "section.registry.one" : "section.registry.many"));
  dom.registryList.hidden = list.length === 0;
  dom.registryEmpty.hidden = list.length !== 0;

  dom.registryList.innerHTML = list.map(rowMarkup).join("");
  refreshSelectionStyles();
}

function refreshSelectionStyles() {
  state.markers.forEach((marker, id) => {
    const active = id === state.selectedId;
    const element = marker.getElement();
    const markerElement = element ? element.querySelector(".snk-marker") : null;

    if (markerElement) markerElement.classList.toggle("is-active", active);
    marker.setZIndexOffset(active ? 1000 : 0);
  });

  if (dom.registryList) {
    dom.registryList.querySelectorAll(".unit-row").forEach((row) => {
      const active = row.dataset.unit === state.selectedId;
      row.classList.toggle("is-selected", active);
      if (active) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    });
  }
}

function resetFilters() {
  state.filters.q = "";
  state.filters.types.clear();
  state.filters.situations.clear();
  state.filters.country = "all";
  state.filters.media = false;
  state.filters.video = false;
  state.filters.coming = false;

  if (dom.search) dom.search.value = "";
  if (dom.countryFilter) dom.countryFilter.value = "all";

  applyFilters();
}

/* ---------- Dossier ---------- */

function blueprintMarkup() {
  return `<svg class="blueprint" viewBox="0 0 260 120" aria-hidden="true">
    <path d="M12 70h18l14-24h102l20 12h54l18 12-18 12h-46l-14 10H66L52 80H12z"/>
    <path d="M66 46V26h30v20M124 58h30M186 70h24M52 80h-8"/>
    <path d="M42 70h8M96 58h22M148 58h20" stroke-dasharray="3 4"/>
    <circle cx="52" cy="74" r="6"/>
    <path d="M58 74h12M12 82h238" stroke-dasharray="4 5"/>
  </svg>`;
}

function placeholderMedia(label) {
  return `<div class="dossier__media dossier__media--empty" data-media>
    <span class="media-tag">${esc(label || t("dossier.noMedia"))}</span>
    ${blueprintMarkup()}
    <span>${esc(t("dossier.blueprintPending"))}</span>
  </div>`;
}

function mediaMarkup(unit) {
  const videoUrl = getVideoUrl(unit);
  const videoId = youtubeId(videoUrl);
  const directVideo = videoUrl && isDirectVideo(videoUrl);
  const vertical =
    unit.verticalVideo || Boolean(videoId && /\/shorts\//i.test(videoUrl));

  if (videoId) {
    const thumbnail = unit.image || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return `<div class="dossier__media dossier__media--video${vertical ? " is-vertical" : ""}" data-media>
      <img src="${esc(thumbnail)}" alt="${esc(
        t("alt.view", { name: unit.name })
      )}" referrerpolicy="no-referrer" data-fallback>
      <span class="media-tag">VIDEO${vertical ? " // VERTICAL" : " // YOUTUBE"}</span>
      <button class="play" type="button" data-play="${esc(videoUrl)}" aria-label="${esc(
      t("dossier.playVideo", { name: unit.name })
    )}"><span><svg class="icon" aria-hidden="true"><use href="#i-play"></use></svg></span></button>
    </div>`;
  }

  if (directVideo) {
    return `<div class="dossier__media dossier__media--video${vertical ? " is-vertical" : ""}" data-media>
      <video controls playsinline preload="metadata"${
        unit.image ? ` poster="${esc(unit.image)}"` : ""
      } src="${esc(videoUrl)}"></video>
      <span class="media-tag">VIDEO</span>
    </div>`;
  }

  if (unit.image) {
    const tag = unit.link ? t("dossier.photoSource") : t("dossier.photoArchive");
    const inner = `<img src="${esc(unit.image)}" alt="${esc(
      t("alt.featured", { name: unit.name })
    )}" referrerpolicy="no-referrer" data-fallback><span class="media-tag">${esc(tag)}</span>`;

    if (unit.link) {
      return `<a class="dossier__media" href="${esc(unit.link)}" target="_blank" rel="noopener noreferrer" data-media>${inner}</a>`;
    }

    return `<div class="dossier__media" data-media>${inner}</div>`;
  }

  return placeholderMedia(t("dossier.noMedia"));
}

function specMarkup(label, value) {
  return `<div><dt>${esc(label)}</dt><dd>${esc(value || "—")}</dd></div>`;
}

function renderDossier(unit) {
  if (!dom.dossierContent) return;

  const meta = typeMeta(unit.typeKey);
  const sit = situationMeta(unit.situation);
  const statusBadges = [
    unit.status === "coming-soon"
      ? `<span class="status-badge">${esc(t("dossier.badgeComing"))}</span>`
      : "",
    sit
      ? `<span class="sit-badge" style="--sit-color:${sit.color}"><span class="sit-icon" aria-hidden="true"><svg class="icon"><use href="#${sit.icon}"></use></svg></span>${esc(
          situationLabelOf(unit.situation)
        )}</span>`
      : unit.afloat
        ? `<span class="status-badge status-badge--afloat">${esc(t("dossier.badgeAfloat"))}</span>`
        : ""
  ].join("");

  const linkButton = unit.link
    ? `<a class="btn btn--primary btn--sm" href="${esc(
        unit.link
      )}" target="_blank" rel="noopener noreferrer">${esc(
        t("dossier.openSource")
      )} <svg class="icon" aria-hidden="true"><use href="#i-external"></use></svg></a>`
    : "";

  const undocumented = t("dossier.undocumented");
  const specs = [
    specMarkup(t("dossier.specClass"), unit.class || undocumented),
    specMarkup(t("dossier.specLaunch"), unit.launchYear ? String(unit.launchYear) : undocumented),
    specMarkup(t("dossier.specCountry"), countryLabel(unit.country)),
    specMarkup(t("dossier.specNavy"), unit.nationality || countryLabel(unit.country)),
    specMarkup(t("dossier.specCity"), unit.city),
    specMarkup(t("dossier.specMuseum"), unit.museum),
    specMarkup(t("dossier.specSituation"), sit ? situationLabelOf(unit.situation) : undocumented),
    specMarkup(
      t("dossier.specState"),
      unit.status === "coming-soon" ? t("dossier.stateComing") : t("dossier.stateOpen")
    ),
    specMarkup(t("dossier.specCoords"), formatCoords(unit))
  ].join("");

  dom.dossierContent.classList.remove("is-empty");
  dom.dossierContent.innerHTML = `${mediaMarkup(unit)}
    <article class="dossier__body" aria-labelledby="dossier-title">
      <div class="dossier__top">
        <span class="type-badge type-badge--icon" style="--type-color:${meta.color}">
          <svg class="icon" aria-hidden="true"><use href="#${meta.icon}"></use></svg>${esc(
    typeLabelOf(unit.typeKey)
  )}
        </span>
        ${statusBadges}
        <span class="dossier__code">${esc(unit.dossier || unit.id)}</span>
      </div>
      <h3 class="dossier__title" id="dossier-title">${esc(unit.name)}</h3>
      <p class="dossier__location">${esc(
        unit.museum || t("dossier.museumUndocumented")
      )}<br>${esc(unit.city)}, ${esc(countryLabel(unit.country))} // ${formatCoords(unit)}</p>
      <p class="dossier__desc">${esc(unit.description || t("dossier.noDescription"))}</p>
      <dl class="specs">${specs}</dl>
      <div class="actions">
        ${linkButton}
        <button class="btn btn--ghost btn--sm" type="button" data-focus="${esc(
          unit.id
        )}"><svg class="icon" aria-hidden="true"><use href="#i-pin"></use></svg> ${esc(
    t("dossier.viewMap")
  )}</button>
        <button class="btn btn--ghost btn--sm" type="button" data-copy="${esc(
          unit.id
        )}"><svg class="icon" aria-hidden="true"><use href="#i-copy"></use></svg> ${esc(
    t("dossier.copyLink")
  )}</button>
      </div>
    </article>`;

  if (dom.dossierClose) dom.dossierClose.hidden = false;
}

function emptyDossierMarkup() {
  return `<div class="dossier__empty">
    <div class="empty-sonar" aria-hidden="true">
      <span></span><span></span><span></span>
      <svg class="icon"><use href="#i-sub"></use></svg>
    </div>
    <p class="kicker">${esc(t("dossier.emptyKicker"))}</p>
    <p>${esc(t("dossier.emptyText"))}</p>
  </div>`;
}

function clearSelection({ updateUrl = true } = {}) {
  state.selectedId = null;

  if (updateUrl) updateURL(null);

  if (dom.dossierContent) {
    dom.dossierContent.classList.add("is-empty");
    dom.dossierContent.innerHTML = emptyDossierMarkup();
  }

  if (dom.dossierClose) dom.dossierClose.hidden = true;

  hideHalo();
  refreshSelectionStyles();
}

function selectUnit(
  id,
  { scroll = false, focusMap = false, updateUrl = true, instant = false } = {}
) {
  const unit = state.unitById.get(id);
  if (!unit) return;

  state.selectedId = id;

  if (updateUrl) updateURL(id);

  renderDossier(unit);
  refreshSelectionStyles();
  showHalo(unit);

  if (focusMap && state.map) {
    state.map.flyTo([unit.lat, unit.lng], Math.max(state.map.getZoom(), 5), {
      duration: state.prefersReduced ? 0 : 0.8
    });
  }

  if (scroll) {
    setTimeout(() => scrollToDossier(instant), focusMap ? 260 : 70);
  }
}

function showHalo(unit) {
  if (!window.L || !state.map) return;

  const position = [unit.lat, unit.lng];

  if (!state.halo) {
    state.halo = window.L.marker(position, {
      icon: window.L.divIcon({
        className: "snk-halo-wrap",
        html: '<span class="snk-halo"></span>',
        iconSize: [46, 46],
        iconAnchor: [23, 23]
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: 1500
    });
  } else {
    state.halo.setLatLng(position);
  }

  if (!state.map.hasLayer(state.halo)) state.halo.addTo(state.map);
}

function hideHalo() {
  if (state.halo && state.map && state.map.hasLayer(state.halo)) {
    state.map.removeLayer(state.halo);
  }
}

function scrollToDossier(instant = false) {
  if (!dom.dossierSection) return;

  dom.dossierSection.scrollIntoView({
    behavior: instant || state.prefersReduced ? "auto" : "smooth",
    block: "start"
  });
}

function scrollToMap() {
  if (!dom.mapSection) return;

  dom.mapSection.scrollIntoView({
    behavior: state.prefersReduced ? "auto" : "smooth",
    block: "start"
  });
}

function focusUnitOnMap(id) {
  const unit = state.unitById.get(id);
  if (!unit || !state.map) return;

  selectUnit(id, { scroll: false, focusMap: false, updateUrl: true });

  state.map.flyTo([unit.lat, unit.lng], Math.max(state.map.getZoom(), 6), {
    duration: state.prefersReduced ? 0 : 0.85
  });

  setTimeout(() => {
    const marker = state.markers.get(id);
    if (marker && marker.getElement()) marker.openTooltip();
  }, 720);

  scrollToMap();
}

function playVideo(button) {
  const url = button.dataset.play;
  const media = button.closest("[data-media]");
  const id = youtubeId(url);

  if (!media) return;

  if (!id) {
    window.open(url, "_blank", "noopener");
    return;
  }

  const unit = state.unitById.get(state.selectedId);
  const title = unit ? unit.name : t("dossier.videoFallback");

  media.classList.add("is-playing");
  media.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(
    id
  )}?autoplay=1&rel=0" title="${esc(
    `Video: ${title}`
  )}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
}

function handleMediaError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.hasAttribute("data-fallback")) return;

  const media = image.closest("[data-media]");
  if (!media) return;

  if (media.classList.contains("dossier__media--video")) {
    image.remove();
    if (!media.querySelector(".media-fallback")) {
      media.insertAdjacentHTML("afterbegin", `<div class="media-fallback">${blueprintMarkup()}</div>`);
    }
    return;
  }

  media.outerHTML = placeholderMedia(t("dossier.imageUnavailable"));
}

/* ---------- Enlaces, URL y avisos ---------- */

function updateURL(id) {
  try {
    const url = new URL(window.location.href);

    if (id) url.searchParams.set("unit", id);
    else url.searchParams.delete("unit");

    if (state.lang && state.lang !== DEFAULT_LANG) url.searchParams.set("lang", state.lang);
    else url.searchParams.delete("lang");

    window.history.replaceState(
      { unit: id || null },
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  } catch {
    /* El historial puede no estar disponible en algunos contextos locales. */
  }
}

function handleRoute() {
  const id = new URLSearchParams(window.location.search).get("unit");

  if (id && state.unitById.has(id)) {
    if (id !== state.selectedId) {
      selectUnit(id, { scroll: false, focusMap: true, updateUrl: false });
    }
  } else if (!id && state.selectedId) {
    clearSelection({ updateUrl: false });
  }
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    /* Se intenta el método clásico. */
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-1000px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  area.remove();

  if (!copied) throw new Error("No se pudo copiar el enlace.");
}

async function copyUnitLink(id) {
  const unit = state.unitById.get(id);
  if (!unit) return;

  const url = new URL(window.location.href);
  url.searchParams.set("unit", unit.id);
  url.hash = "";

  try {
    await copyText(url.toString());
    showToast(t("toast.copied"));
  } catch {
    showToast(t("toast.copyFailed"));
  }
}

function showToast(message) {
  if (!dom.toast) return;

  window.clearTimeout(state.toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");

  state.toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, 2600);
}

/* ---------- Eventos ---------- */

function bindEvents() {
  if (dom.search) {
    dom.search.addEventListener("input", () => {
      state.filters.q = dom.search.value;

      if (state.searchFrame) cancelAnimationFrame(state.searchFrame);
      state.searchFrame = requestAnimationFrame(() => {
        state.searchFrame = 0;
        applyFilters();
      });
    });
  }

  if (dom.typeFilters) {
    dom.typeFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-type]");
      if (!button) return;

      const key = button.dataset.type;
      if (state.filters.types.has(key)) state.filters.types.delete(key);
      else state.filters.types.add(key);

      applyFilters();
    });
  }

  if (dom.countryFilter) {
    dom.countryFilter.addEventListener("change", () => {
      state.filters.country = dom.countryFilter.value;
      applyFilters();
    });
  }

  if (dom.mediaFilter) {
    dom.mediaFilter.addEventListener("click", () => {
      state.filters.media = !state.filters.media;
      applyFilters();
    });
  }

  if (dom.videoFilter) {
    dom.videoFilter.addEventListener("click", () => {
      state.filters.video = !state.filters.video;
      applyFilters();
    });
  }

  if (dom.situationFilters) {
    dom.situationFilters.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-situation]");
      if (!chip) return;

      const key = chip.dataset.situation;
      if (state.filters.situations.has(key)) state.filters.situations.delete(key);
      else state.filters.situations.add(key);

      applyFilters();
    });
  }

  if (dom.comingFilter) {
    dom.comingFilter.addEventListener("click", () => {
      state.filters.coming = !state.filters.coming;
      applyFilters();
    });
  }

  if (dom.featuredGrid) {
    dom.featuredGrid.addEventListener("error", handleFeaturedMediaError, true);
    dom.featuredGrid.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest("[data-unit]");
      if (card) selectUnit(card.dataset.unit, { scroll: true, focusMap: true });
    });
  }

  if (dom.resetFilters) dom.resetFilters.addEventListener("click", resetFilters);
  if (dom.registryReset) dom.registryReset.addEventListener("click", resetFilters);

  if (dom.sortSelect) {
    dom.sortSelect.addEventListener("change", renderRegistry);
  }

  if (dom.registryList) {
    dom.registryList.addEventListener("click", (event) => {
      const row = event.target.closest("[data-unit]");
      if (row) selectUnit(row.dataset.unit, { scroll: true, focusMap: true });
    });
  }

  if (dom.dossierClose) {
    dom.dossierClose.addEventListener("click", () => clearSelection());
  }

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.lang !== state.lang) setLang(button.dataset.lang);
    });
  });

  if (dom.dossierContent) {
    dom.dossierContent.addEventListener("error", handleMediaError, true);

    dom.dossierContent.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;

      const play = event.target.closest("[data-play]");
      if (play) {
        event.preventDefault();
        playVideo(play);
        return;
      }

      const focus = event.target.closest("[data-focus]");
      if (focus) {
        event.preventDefault();
        focusUnitOnMap(focus.dataset.focus);
        return;
      }

      const copy = event.target.closest("[data-copy]");
      if (copy) {
        event.preventDefault();
        copyUnitLink(copy.dataset.copy);
      }
    });
  }

  window.addEventListener("popstate", handleRoute);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !state.selectedId) return;

    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    clearSelection();
  });
}

/* ---------- Arranque ---------- */

function renderAll() {
  applyStaticI18n();
  hydrateConfig(state.config);
  renderStats();
  renderFeatured();
  buildTypeFilters();
  buildSituationFilters();
  buildCountryFilter();
  buildLegend();
  buildTypeBars();
  applyFilters();

  if (state.selectedId) {
    const unit = state.unitById.get(state.selectedId);
    if (unit) renderDossier(unit);
  }
}

function setLang(lang, { persist = true } = {}) {
  const next = LANGS.includes(lang) ? lang : DEFAULT_LANG;
  if (next === state.lang) return;

  state.lang = next;

  if (persist) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* localStorage puede no estar disponible en este contexto. */
    }
  }

  renderAll();
  updateURL(state.selectedId);
}

function showBootError(message, hint) {
  if (!dom.boot) return;

  if (dom.app) dom.app.hidden = true;

  dom.boot.classList.remove("is-done");
  dom.boot.setAttribute("role", "alert");
  dom.boot.innerHTML = `<div class="boot__error">
    <p class="kicker">${esc(t("error.kicker"))}</p>
    <h2>${esc(t("error.title"))}</h2>
    <p>${esc(message)}</p>
    <p class="boot__sub">${esc(hint)}</p>
    <button class="btn btn--primary" type="button" id="boot-retry">${esc(t("error.retry"))}</button>
  </div>`;

  const retry = document.getElementById("boot-retry");
  if (retry) retry.addEventListener("click", () => window.location.reload());
}

async function init() {
  cacheDom();

  state.lang = resolveLang();

  try {
    const dictionary = await fetchJSON(I18N_URL);
    state.i18n = dictionary && typeof dictionary === "object" ? dictionary : {};
  } catch (error) {
    console.warn("No se pudo cargar el diccionario de idiomas.", error);
    state.i18n = {};
  }

  try {
    if (!window.L) throw new Error(t("error.leaflet"));

    const [rawUnits, config] = await Promise.all([fetchJSON(DATA_URL), fetchJSON(CONFIG_URL)]);

    if (!Array.isArray(rawUnits)) {
      throw new Error(t("error.format"));
    }

    const units = rawUnits.map(normalizeUnit).filter(Boolean);

    if (!units.length) {
      throw new Error(t("error.empty"));
    }

    state.units = units;
    state.unitById = new Map(units.map((unit) => [unit.id, unit]));
    state.config = config && typeof config === "object" ? config : {};

    renderAll();

    if (dom.app) dom.app.hidden = false;

    await nextFrame();

    initMap();
    bindEvents();
    applyFilters();

    state.map.invalidateSize();
    fitAll();

    const routeId = new URLSearchParams(window.location.search).get("unit");
    const hasRoute = Boolean(routeId && state.unitById.has(routeId));

    updateURL(hasRoute ? routeId : null);

    if (hasRoute) {
      window.setTimeout(() => {
        selectUnit(routeId, {
          scroll: true,
          focusMap: true,
          updateUrl: false,
          instant: true
        });
      }, 320);
    }

    window.setTimeout(() => {
      if (dom.boot) dom.boot.classList.add("is-done");
    }, 620);
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : t("error.unexpected");

    const hint =
      window.location.protocol === "file:" ? t("error.fileHint") : t("error.networkHint");

    showBootError(message, hint);
  }
}

init();
