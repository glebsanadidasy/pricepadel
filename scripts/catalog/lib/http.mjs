// Polite fetcher for the catalogue collector: robots.txt, one request per second, stop on any sign of blocking.
import fs from "node:fs";
import path from "node:path";
import { RAW_DIR, writeJson } from "./store.mjs";

export const USER_AGENT = "PricePadelCatalog/1.0 (+contact@pricepadel.com)";
export const ORIGIN = "https://www.padelnuestro.com";
const MIN_GAP_MS = 2000; // owner, stage 3: at most one request every 2 seconds
const STATS_FILE = path.join(RAW_DIR, "http-stats.json");
const MAX_503_HOURS = 3; // 503 without a single good answer for this long → stop the collection

/** Thrown when collection must stop (block, captcha, 403/429, robots.txt). The owner has to be told. */
export class StopError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "StopError";
    this.details = details;
  }
}

let lastRequestAt = 0;
let requestCount = 0;
let robots = null;

export function stats() {
  return { requests: requestCount };
}

async function throttle() {
  const wait = lastRequestAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
  requestCount++;
}

// ---------- 503 statistics (pages, photos and colour data; robots.txt and the sitemap are not counted) ----------
//   .source-data/http-stats.json: { requests, s503, periods: [{ start, end, count }], open: { start, last, count } | null }

export function readHttpStats() {
  try {
    return JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
  } catch {
    return { requests: 0, s503: 0, periods: [], open: null };
  }
}

/**
 * A page served from the source's CDN cache (x-cache: HIT) never reached their server, so it does not prove the server
 * answers us again: it is counted, but it does not end a 503 period.
 */
function recordStatus(status, cacheHit) {
  const st = readHttpStats();
  const now = new Date().toISOString();
  st.requests++;
  if (cacheHit && status !== 503) {
    st.cacheHits = (st.cacheHits ?? 0) + 1;
    if (st.open) st.open.cacheHits = (st.open.cacheHits ?? 0) + 1;
  } else if (status === 503) {
    st.s503++;
    st.open = st.open ? { ...st.open, last: now, count: st.open.count + 1 } : { start: now, last: now, count: 1 };
  } else if (st.open) {
    // A good answer ends the 503 period.
    st.periods.push({ start: st.open.start, end: st.open.last, count: st.open.count, cacheHits: st.open.cacheHits ?? 0, estimated: st.open.estimated, endedBy: `HTTP ${status} at ${now}` });
    st.open = null;
  }
  writeJson(STATS_FILE, st);
  if (st.open && Date.now() - Date.parse(st.open.start) >= MAX_503_HOURS * 3600 * 1000) {
    throw new StopError(`HTTP 503 for ${MAX_503_HOURS} hours in a row (since ${st.open.start}, ${st.open.count} answers). Collection stopped.`, {
      sustained503: true,
      since: st.open.start,
    });
  }
}

async function rawFetch(url, accept, counted = true) {
  await throttle();
  let res;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: accept, "Accept-Language": "en-GB,en;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    throw Object.assign(new Error(`Network error for ${url}: ${e.message}`), { network: true });
  }
  if (counted) recordStatus(res.status, /\bHIT\b/.test(res.headers.get("x-cache") ?? ""));
  return res;
}

// ---------- robots.txt ----------

/** Rules of the group that applies to us (User-agent: *). Google-style matching: longest rule wins, Allow wins a tie. */
function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const line of text.split(/\r?\n/)) {
    const clean = line.replace(/#.*/, "").trim();
    const m = clean.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      if (!lastWasAgent) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (current && (key === "allow" || key === "disallow") && value) current.rules.push({ allow: key === "allow", pattern: value });
    }
  }
  const mine = groups.filter((g) => g.agents.includes("pricepadelcatalog"));
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  return chosen.flatMap((g) => g.rules);
}

function ruleMatches(pattern, target) {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const re = new RegExp("^" + body.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (anchored ? "$" : ""));
  return re.test(target);
}

export function robotsAllows(url) {
  if (!robots) throw new Error("robots.txt not loaded");
  const u = new URL(url);
  if (u.origin !== ORIGIN) return false;
  const target = u.pathname + u.search;
  let best = null;
  for (const r of robots.rules) {
    if (!ruleMatches(r.pattern, target)) continue;
    const len = r.pattern.length;
    if (!best || len > best.len || (len === best.len && r.allow)) best = { len, allow: r.allow };
  }
  return best ? best.allow : true;
}

/** Always read live at the start of a run; a copy is kept for the record. */
export async function loadRobots() {
  const res = await rawFetch(`${ORIGIN}/robots.txt`, "text/plain", false);
  checkStatus(res, "robots.txt");
  const text = await res.text();
  fs.writeFileSync(path.join(RAW_DIR, "robots.txt"), text);
  robots = { rules: parseRobots(text), fetchedAt: new Date().toISOString() };
  return robots;
}

// ---------- requests ----------

function checkStatus(res, what) {
  if (res.status === 403 || res.status === 429) {
    throw new StopError(`HTTP ${res.status} on ${what} — the site is limiting or blocking us. Collection stopped.`, { status: res.status, url: res.url });
  }
  if (res.status === 503 && /captcha|challenge/i.test(res.headers.get("server") ?? "")) {
    throw new StopError(`Bot challenge on ${what}. Collection stopped.`, { status: res.status, url: res.url });
  }
}

const CHALLENGE = /captcha-delivery|g-recaptcha|h-captcha|cf-chl|challenge-platform|are you a robot|access denied|request blocked|unusual traffic/i;

/**
 * The source's CDN answers "503 backend read error" when its server is slow. That is not a block:
 * we wait much longer than the 1 s minimum (20 s, then 40 s) and try again, at most twice.
 */
async function fetchWithBackoff(url, accept) {
  for (let attempt = 0; ; attempt++) {
    const res = await rawFetch(url, accept);
    checkStatus(res, url);
    if (![500, 502, 503, 504].includes(res.status) || attempt >= 2) return res;
    await res.arrayBuffer();
    await new Promise((r) => setTimeout(r, 20000 * (attempt + 1)));
  }
}

/** HTML page. Returns { status, url, html } for 200/404/410; stops on block signs; throws on other errors. */
export async function fetchPage(url) {
  if (!robotsAllows(url)) return { status: "robots", url, html: "" };
  const res = await fetchWithBackoff(url, "text/html,application/xhtml+xml");
  if (!robotsAllows(res.url)) return { status: "robots", url: res.url, html: "" };
  const html = await res.text();
  if (res.status === 404 || res.status === 410) return { status: res.status, url: res.url, html: "" };
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  // A real product page always has Magento's product body class; a challenge page never does.
  if (!html.includes("catalog-product-view") && CHALLENGE.test(html.slice(0, 200000))) {
    fs.writeFileSync(path.join(RAW_DIR, "last-block-page.html"), html);
    throw new StopError(`The site answered with a protection / captcha page for ${url}. Collection stopped.`, { url });
  }
  return { status: 200, url: res.url, html };
}

/**
 * JSON from a public endpoint the source's own pages call (e.g. colour photos). One attempt only:
 * returns null on 5xx so a slow optional endpoint never holds the collection up. Blocks still stop the run.
 */
export async function fetchJson(url) {
  if (!robotsAllows(url)) return null;
  const res = await rawFetch(url, "application/json");
  checkStatus(res, url);
  if (!res.ok) return null;
  const body = await res.text();
  if (CHALLENGE.test(body) && !body.trim().startsWith("{")) throw new StopError(`Protection page instead of data (${url}). Collection stopped.`, { url });
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export async function fetchText(url) {
  if (!robotsAllows(url)) throw new StopError(`robots.txt disallows ${url}`);
  const res = await rawFetch(url, "application/xml,text/xml", false);
  checkStatus(res, url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/**
 * Photo bytes in the best quality the source serves. Its image CDN re-encodes every photo; asking for JPEG/PNG
 * (not WebP/AVIF) and quality=95 gives the full 1500 px original with the least loss.
 * Anything that is not an image (e.g. an HTML block page) stops the run.
 */
export async function fetchImage(cleanUrl) {
  const url = `${cleanUrl}?quality=95`;
  if (!robotsAllows(url)) return null;
  const res = await fetchWithBackoff(url, "image/jpeg,image/png;q=0.9,image/*;q=0.5");
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) {
    const body = await res.text();
    if (CHALLENGE.test(body)) throw new StopError(`Protection page instead of a photo (${url}). Collection stopped.`, { url });
    throw new Error(`Not an image (${type}) for ${url}`);
  }
  return { type, bytes: Buffer.from(await res.arrayBuffer()) };
}

export function saveStop(err) {
  writeJson(path.join(RAW_DIR, "last-stop.json"), { at: new Date().toISOString(), message: err.message, ...err.details });
}
