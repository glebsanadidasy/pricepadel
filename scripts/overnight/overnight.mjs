// Overnight catalogue run: collect everything in the sitemap, import every 30 minutes, commit + push photos and catalogue.
// Started by scripts/overnight/run.sh (caffeinate + restart after a crash); resumes from .overnight/state.json.
//
//   collector exit 0 → time slice used (or finished)    exit 2 → blocked (block / captcha / 403 / 429)
//   blocked:  import + push, wait 1 hour, try once more; blocked again → stop, keep everything, write the reason
//   push:     only to the private repo (checked before every push), commit by commit, each batch < 1 GB;
//             a failed push is retried with the next batch; .git over 8 GB → photos stop going into Git
//   end:      final import, production build, price + source-data leak check, push
// Exit 0 = finished, 3 = stopped because of a block. Anything else is a crash (run.sh restarts it).
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIR = path.join(ROOT, ".overnight");
const STATE = path.join(DIR, "state.json");
const LOCK = path.join(DIR, "git.lock");
const REPORT = path.join(ROOT, "overnight-report.md");
const REPO = "glebsanadidasy/pricepadel";
const SLICE_MIN = 30;
const BATCH_BYTES = 900 * 1024 * 1024; // < 1 GB per push
const GIT_LIMIT_BYTES = 8 * 1024 ** 3;
const PHOTO_DIR = "public/images/products";

fs.mkdirSync(DIR, { recursive: true });
const readState = () => {
  try {
    return JSON.parse(fs.readFileSync(STATE, "utf8"));
  } catch {
    return { startedAt: new Date().toISOString(), cycles: 0, pushes: [], blocks: [], photosInGit: true, events: [] };
  }
};
const state = readState();
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
const log = (msg) => {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  state.events = [...(state.events ?? []), line].slice(-200);
  save();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, ...opts });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

/** Child process with output appended to a log file; resolves with the exit code. */
function run(cmd, args, logName, env = {}) {
  return new Promise((resolve) => {
    const out = fs.openSync(path.join(DIR, logName), "a");
    const child = spawn(cmd, args, { cwd: ROOT, stdio: ["ignore", out, out], env: { ...process.env, ...env } });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

const collectorState = () => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, ".source-data", "state.json"), "utf8"));
  } catch {
    return {};
  }
};

// ---------- git ----------

async function withGitLock(fn) {
  for (let i = 0; ; i++) {
    try {
      fs.mkdirSync(LOCK);
      break;
    } catch {
      const age = Date.now() - fs.statSync(LOCK).mtimeMs;
      if (age > 20 * 60000) fs.rmSync(LOCK, { recursive: true, force: true });
      else await sleep(5000);
    }
  }
  try {
    while (fs.existsSync(path.join(ROOT, ".git", "index.lock"))) await sleep(2000);
    return await fn();
  } finally {
    fs.rmSync(LOCK, { recursive: true, force: true });
  }
}

const gitSize = () => Number(sh("du", ["-sk", ".git"]).out.split(/\s/)[0]) * 1024;

function repoIsPrivate() {
  const r = sh("gh", ["repo", "view", REPO, "--json", "isPrivate", "-q", ".isPrivate"]);
  return r.code === 0 && r.out.trim() === "true";
}

function pushPending() {
  if (!repoIsPrivate()) {
    log("PUSH SKIPPED: the GitHub repository is not private (or could not be checked).");
    state.lastPushError = "repository not private / not reachable";
    return;
  }
  const hasRemoteMain = sh("git", ["rev-parse", "--verify", "-q", "refs/remotes/origin/main"]).code === 0;
  const range = hasRemoteMain ? "origin/main..main" : "main";
  const commits = sh("git", ["rev-list", "--reverse", range]).out.split("\n").filter(Boolean);
  for (const sha of commits) {
    const r = sh("git", ["push", "origin", `${sha}:refs/heads/main`], { timeout: 3600000 });
    if (r.code !== 0) {
      log(`push failed at ${sha.slice(0, 7)}: ${r.out.trim().split("\n").slice(-2).join(" ")} — will retry with the next batch`);
      state.lastPushError = r.out.slice(-500);
      return;
    }
  }
  if (commits.length) {
    sh("git", ["branch", "--set-upstream-to=origin/main", "main"]);
    state.lastPushAt = new Date().toISOString();
    state.lastPushError = null;
    state.pushes.push({ at: state.lastPushAt, commits: commits.length });
    log(`pushed ${commits.length} commit(s)`);
  }
}

/** Commits the catalogue, then new photos in batches < 1 GB, pushing after each commit. */
async function commitAndPush(label) {
  await withGitLock(async () => {
    sh("git", ["add", "-A", "--", "data/catalog"]);
    // Only this runner stages files while it holds the lock, so a plain commit takes exactly what was added.
    if (sh("git", ["diff", "--cached", "--quiet"]).code !== 0) sh("git", ["commit", "-q", "-m", `Catalogue update: ${label}`]);
    pushPending();

    if (state.photosInGit && gitSize() > GIT_LIMIT_BYTES) {
      state.photosInGit = false;
      log(".git is larger than 8 GB — photos are no longer added to Git.");
    }
    if (!state.photosInGit) return;

    const status = sh("git", ["status", "--porcelain", "-uall", "--", PHOTO_DIR]).out.split("\n").filter(Boolean);
    const changed = status.map((l) => ({ code: l.slice(0, 2), file: l.slice(3) }));
    let batch = [];
    let bytes = 0;
    let n = 0;
    let added = 0;
    const base = gitSize();
    const flush = () => {
      if (!batch.length) return;
      for (let i = 0; i < batch.length; i += 500) sh("git", ["add", "-A", "--", ...batch.slice(i, i + 500)]);
      n++;
      sh("git", ["commit", "-q", "-m", `Product photos: ${label} (batch ${n}, ${batch.length} files, ${(bytes / 1048576).toFixed(0)} MB)`]);
      added += bytes;
      pushPending();
      batch = [];
      bytes = 0;
    };
    for (const c of changed) {
      let size = 0;
      try {
        size = fs.statSync(path.join(ROOT, c.file)).size;
      } catch {
        /* deleted file */
      }
      if (bytes + size > BATCH_BYTES) flush();
      batch.push(c.file);
      bytes += size;
      if (base + added + bytes > GIT_LIMIT_BYTES) {
        flush();
        state.photosInGit = false;
        log(".git reached 8 GB — photos are no longer added to Git.");
        return;
      }
    }
    flush();
  });
  save();
}

// ---------- report ----------

const fmt = (iso) => (iso ? iso.slice(0, 16).replace("T", " ") + " UTC" : "—");

/** 503 periods (pages, photos, colour data) from .source-data/http-stats.json, written by the collector. */
function report503() {
  let st;
  try {
    st = JSON.parse(fs.readFileSync(path.join(ROOT, ".source-data", "http-stats.json"), "utf8"));
  } catch {
    return ["- Ответы 503: статистики ещё нет"];
  }
  const share = st.requests ? ((st.s503 / st.requests) * 100).toFixed(1) : "0";
  const lines = [`- Ответы 503: ${st.s503} из ${st.requests} запросов (${share} %). Robots.txt и карта сайта не считаются.`];
  const periods = [...(st.periods ?? []), ...(st.open ? [{ start: st.open.start, end: null, count: st.open.count, open: true, estimated: st.open.estimated }] : [])];
  if (periods.length === 0) lines.push("  - периодов с 503 не было");
  for (const p of periods.slice(-30)) {
    const end = p.open ? `продолжается (последний 503: ${fmt(st.open.last)})` : fmt(p.end);
    lines.push(`  - с ${fmt(p.start)} по ${end}: ${p.count} ответов 503${p.estimated ? " (начало периода восстановлено по логам)" : ""}`);
  }
  return lines;
}

function updateReport(extra = "") {
  const s = collectorState();
  const processed = Object.values(s.processed ?? {});
  const count = (st) => processed.filter((p) => p.status === st).length;
  let summary = {};
  try {
    summary = JSON.parse(fs.readFileSync(path.join(ROOT, "sources", "import-summary.json"), "utf8"));
  } catch {
    /* no import yet */
  }
  const block = [
    "<!-- overnight:start (written by scripts/overnight/overnight.mjs) -->",
    "## Ночной сбор — состояние (обновляется автоматически)",
    "",
    `- Ночной сбор запущен: ${fmt(state.startedAt)}${state.finishedAt ? `; закончен: ${fmt(state.finishedAt)}` : ""}`,
    `- Скорость: не больше 1 запроса в 2 секунды (с ${fmt(state.rateChangedAt)}; до этого 1 запрос в 1,1 с)`,
    `- Обновлено: ${new Date().toISOString()}`,
    `- Страниц обработано: ${processed.length}; в наличии с фото: ${count("accepted")}; без наличия (сохранены без фото): ${count("stored")}; пропущено: ${count("skipped")}`,
    `- Сбор завершён: ${s.complete ? "да" : "нет"}${state.stoppedReason ? ` — ОСТАНОВЛЕН: ${state.stoppedReason}` : ""}`,
    `- Последний импорт: ${summary.at ?? "—"}; товаров ${summary.products ?? "—"}, в продаже ${summary.onSale ?? "—"}, фото ${summary.photos ?? "—"}, отклонено фото ${summary.rejectedPhotos ?? "—"}`,
    `- Фото цветов: ${s.colourPhotos ? `${s.colourPhotos.status}${s.colourPhotos.reason ? ` (${s.colourPhotos.reason})` : ""}` : "ещё не встречались"}`,
    `- Последний push: ${state.lastPushAt ?? "—"}${state.lastPushError ? `; последняя ошибка push: ${String(state.lastPushError).split("\n")[0]}` : ""}`,
    `- Размер .git: ${(gitSize() / 1024 ** 3).toFixed(2)} ГБ; фото в Git: ${state.photosInGit ? "да" : "нет (превышен лимит 8 ГБ)"}`,
    `- Блокировки: ${state.blocks.length ? state.blocks.map((b) => `${b.at} ${b.message}`).join("; ") : "нет"}`,
    `- Паузы из-за ошибок 503 (по 15 минут): ${(s.pauses ?? []).length}`,
    ...report503(),
    extra,
    "<!-- overnight:end -->",
  ].join("\n");
  let text = "";
  try {
    text = fs.readFileSync(REPORT, "utf8");
  } catch {
    text = "# Ночной отчёт\n\n";
  }
  text = /<!-- overnight:start[\s\S]*<!-- overnight:end -->/.test(text) ? text.replace(/<!-- overnight:start[\s\S]*<!-- overnight:end -->/, block) : `${text.trimEnd()}\n\n${block}\n`;
  fs.writeFileSync(REPORT, text);
}

// ---------- final checks ----------

async function finalChecks() {
  log("final import");
  await run("node", ["scripts/catalog/import.mjs"], "import.log");
  log("production build for the leak / price check");
  const env = { NEXT_DIST_DIR: ".next-overnight", NEXT_TELEMETRY_DISABLED: "1" };
  const built = await run("npx", ["next", "build"], "final-check.log", env);
  let result = `build failed (exit ${built})`;
  if (built === 0) {
    const server = spawn("npx", ["next", "start", "-p", "3101"], { cwd: ROOT, env: { ...process.env, ...env }, stdio: "ignore", detached: true });
    for (let i = 0; i < 60; i++) {
      await sleep(2000);
      try {
        if ((await fetch("http://localhost:3101/")).ok) break;
      } catch {
        /* not up yet */
      }
    }
    const code = await run("node", ["scripts/catalog/check-public.mjs", "http://localhost:3101", "--sample", "400"], "final-check.log");
    result = code === 0 ? "OK (no source data in pages, prices match)" : "PROBLEMS — see .overnight/final-check.log";
    try {
      process.kill(-server.pid);
    } catch {
      /* already gone */
    }
  }
  state.finalCheck = result;
  log(`final check: ${result}`);
}

// ---------- main loop ----------

async function main() {
  log(`overnight runner started (pid ${process.pid})`);
  for (;;) {
    if (state.finished) return 0;
    const minutes = state.cycles === 0 ? 6 : SLICE_MIN; // a short first slice proves import + push work early
    const retrying = !!state.blockRetryAt;
    const before = collectorState().lastOkAt;
    log(`cycle ${state.cycles + 1}: collecting for up to ${minutes} min`);
    const code = await run("node", ["scripts/catalog/collect.mjs", "--limit", "0", "--minutes", String(minutes)], "collect.log");
    state.cycles++;
    save();
    const cs = collectorState();

    if (code === 4) {
      // HTTP 503 without a single good answer for 3 hours: stop for good, keep everything collected.
      let message = "HTTP 503 for 3 hours in a row";
      try {
        message = JSON.parse(fs.readFileSync(path.join(ROOT, ".source-data", "last-stop.json"), "utf8")).message;
      } catch {
        /* keep default */
      }
      log(`STOP: ${message}`);
      await run("node", ["scripts/catalog/import.mjs"], "import.log");
      await commitAndPush("after 3 hours of HTTP 503");
      state.stoppedReason = `${message} Everything collected so far is kept, imported and pushed.`;
      state.finished = true;
      state.finishedAt = new Date().toISOString();
      updateReport();
      save();
      return 3;
    }
    if (code === 2) {
      let message = "blocked";
      try {
        message = JSON.parse(fs.readFileSync(path.join(ROOT, ".source-data", "last-stop.json"), "utf8")).message;
      } catch {
        /* keep default */
      }
      const progressedSinceRetry = retrying && cs.lastOkAt && cs.lastOkAt > state.blockRetryAt;
      state.blocks.push({ at: new Date().toISOString(), message });
      log(`BLOCK: ${message}`);
      await run("node", ["scripts/catalog/import.mjs"], "import.log");
      await commitAndPush(`after block at ${new Date().toISOString().slice(0, 16)}`);
      if (retrying && !progressedSinceRetry) {
        state.stoppedReason = `the source blocked us again after a 1-hour pause: ${message}`;
        state.finished = true;
        log(`STOPPED: ${state.stoppedReason}`);
        updateReport();
        save();
        return 3;
      }
      log("waiting 1 hour before one more try");
      updateReport();
      await sleep(3600000);
      state.blockRetryAt = new Date().toISOString();
      save();
      continue;
    }
    if (code !== 0) {
      log(`collector exited with ${code}; retrying in 2 minutes`);
      await sleep(120000);
      continue;
    }
    if (retrying && cs.lastOkAt && cs.lastOkAt !== before) state.blockRetryAt = null;

    log("import");
    const ic = await run("node", ["scripts/catalog/import.mjs"], "import.log");
    if (ic !== 0) log(`import exited with ${ic} (see .overnight/import.log)`);
    await commitAndPush(`${Object.keys(cs.processed ?? {}).length} pages processed`);
    updateReport();

    if (cs.complete) {
      await finalChecks();
      await commitAndPush("final");
      state.finished = true;
      state.finishedAt = new Date().toISOString();
      updateReport(`- Финальная проверка цен и утечек: ${state.finalCheck}`);
      log("finished");
      save();
      return 0;
    }
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    log(`crash: ${err.stack ?? err}`);
    process.exit(1);
  },
);
