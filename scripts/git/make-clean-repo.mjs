// New private repository with a fresh history built from the current clean state (owner, stage 5).
//   node scripts/git/make-clean-repo.mjs build    → creates/checks the private repo, builds the new history in a temp folder, scans it, pushes it
//   node scripts/git/make-clean-repo.mjs dry      → same build and scan in the temp folder, no GitHub at all
//   node scripts/git/make-clean-repo.mjs switch   → points this checkout at the new repo (old history kept on a local branch; nothing deleted)
// Rules: the new repo must be private (otherwise nothing is pushed); never force-push; the old repository is not touched.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const OWNER = "glebsanadidasy";
const NAME = "pricepadel-clean";
const REPO = `${OWNER}/${NAME}`;
const URL = `https://github.com/${REPO}.git`;
const BATCH = 900 * 1024 * 1024; // < 1 GB per push
const WORK = path.join(os.tmpdir(), "pricepadel-clean-build");
const FORBIDDEN_PATHS = [/^sources\//, /^\.source-data\//, /(^|\/)\.env(\.|$)/, /^\.data\//, /^outbox\//];

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 1024, ...opts });
const git = (args, cwd = WORK) => sh("git", args, { cwd });
const log = (m) => console.log(`${new Date().toISOString().slice(11, 19)} ${m}`);

function repoIsPrivate() {
  const r = spawnSync("gh", ["repo", "view", REPO, "--json", "isPrivate", "-q", ".isPrivate"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() === "true" : null; // null = does not exist
}

/** Source codes that must never appear: every source SKU from the supplier data (which itself is never in Git). */
function sourceCodes() {
  const offers = JSON.parse(fs.readFileSync(path.join(ROOT, "sources", "pn-uk", "offers.json"), "utf8"));
  const codes = new Set();
  for (const o of Object.values(offers)) {
    for (const c of [o.sourceSku, ...Object.values(o.variants).map((v) => v.sourceSku)]) {
      const s = String(c ?? "").toUpperCase().replace(/^C-/, "");
      if (s.length >= 7) codes.add(s);
    }
  }
  return codes;
}

/** Scans every commit of the new history: forbidden paths, source names and codes in data, photo names and texts. */
function scanHistory() {
  const codes = sourceCodes();
  const problems = [];
  const notes = new Set();
  const commits = git(["rev-list", "--all"]).split("\n").filter(Boolean);
  const seenBlobs = new Set();
  for (const c of commits) {
    for (const line of git(["ls-tree", "-r", c]).split("\n").filter(Boolean)) {
      const [meta, file] = line.split("\t");
      const blob = meta.split(" ")[2];
      if (FORBIDDEN_PATHS.some((re) => re.test(file))) problems.push(`${c.slice(0, 7)} forbidden path ${file}`);
      const upperName = file.toUpperCase();
      for (const code of codes) if (upperName.includes(code)) problems.push(`${c.slice(0, 7)} source code ${code} in file name ${file}`);
      if (/nuestro/i.test(file)) problems.push(`${c.slice(0, 7)} source name in file name ${file}`);
      if (seenBlobs.has(blob) || /\.(jpe?g|png|webp|gif|ico|woff2?)$/i.test(file)) continue;
      seenBlobs.add(blob);
      const text = git(["cat-file", "-p", blob]);
      const isData = file.startsWith("data/") || file.startsWith("public/");
      if (/nuestro/i.test(text)) {
        if (isData) problems.push(`${file}: mentions the source by name`);
        else notes.add(`${file}: mentions the source by name (code / documentation, no supplier data)`);
      }
      if (/sourcePrice|sourceUrl|sourceSku|scrapedAt/.test(text) && isData) problems.push(`${file}: supplier fields`);
      if (isData) {
        const upper = text.toUpperCase();
        for (const code of codes) if (upper.includes(code)) problems.push(`${file}: source code ${code}`);
      }
    }
  }
  return { commits: commits.length, problems, notes: [...notes] };
}

function build(dry = false) {
  const vis = dry ? true : repoIsPrivate();
  if (vis === false) throw new Error(`${REPO} exists and is PUBLIC — nothing pushed. Tell the owner.`);
  if (vis === null) {
    log(`creating private repository ${REPO}`);
    sh("gh", ["repo", "create", REPO, "--private", "--description", "Price Padel online store (private, clean history)"]);
  }
  if (!dry && repoIsPrivate() !== true) throw new Error(`${REPO} is not private — nothing pushed.`);

  // 1. The current clean state: exactly the files tracked at HEAD (git-ignored data never comes along).
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  const tar = path.join(os.tmpdir(), "pricepadel-head.tar");
  sh("git", ["archive", "--format=tar", "-o", tar, "HEAD"], { cwd: ROOT });
  sh("tar", ["-xf", tar, "-C", WORK]);
  fs.rmSync(tar);
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", sh("git", ["config", "user.name"], { cwd: ROOT }).trim()]);
  git(["config", "user.email", sh("git", ["config", "user.email"], { cwd: ROOT }).trim()]);
  git(["remote", "add", "origin", URL]);

  // 2. Fresh history: code + catalogue first, then photos in batches under 1 GB.
  const all = git(["ls-files", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean);
  const photos = all.filter((f) => f.startsWith("public/images/products/"));
  const rest = all.filter((f) => !f.startsWith("public/images/products/"));
  for (let i = 0; i < rest.length; i += 500) git(["add", "--", ...rest.slice(i, i + 500)]);
  git(["commit", "-q", "-m", "Price Padel: code, catalogue and settings (clean history)\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"]);
  let batch = [];
  let bytes = 0;
  let n = 0;
  const flush = () => {
    if (!batch.length) return;
    for (let i = 0; i < batch.length; i += 500) git(["add", "--", ...batch.slice(i, i + 500)]);
    n++;
    git(["commit", "-q", "-m", `Product photos, batch ${n} (${batch.length} files, ${(bytes / 1048576).toFixed(0)} MB)\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`]);
    batch = [];
    bytes = 0;
  };
  for (const f of photos) {
    const size = fs.statSync(path.join(WORK, f)).size;
    if (bytes + size > BATCH) flush();
    batch.push(f);
    bytes += size;
  }
  flush();
  log(`new history: ${1 + n} commits, ${rest.length} files + ${photos.length} photos`);

  // 3. Scan before anything leaves this computer.
  const scan = scanHistory();
  fs.writeFileSync(path.join(os.tmpdir(), "pricepadel-clean-scan.json"), JSON.stringify(scan, null, 2));
  if (scan.problems.length) throw new Error(`history scan found ${scan.problems.length} problem(s), nothing pushed:\n${scan.problems.slice(0, 30).join("\n")}`);
  log(`history scan OK (${scan.commits} commits); notes: ${scan.notes.length}`);
  if (dry) return log("dry run: nothing pushed");

  // 4. Push commit by commit (each < 1 GB), checking the repo is still private. Never forced.
  for (const sha of git(["rev-list", "--reverse", "main"]).split("\n").filter(Boolean)) {
    if (repoIsPrivate() !== true) throw new Error("repository is no longer private — push stopped");
    git(["push", "-q", "origin", `${sha}:refs/heads/main`]);
    log(`pushed ${sha.slice(0, 7)}`);
  }
  log("build done");
}

function switchOrigin() {
  if (repoIsPrivate() !== true) throw new Error(`${REPO} is not private (or missing) — not switching.`);
  // Keep the old history on a local branch (nothing is deleted), then make main follow the clean history.
  sh("git", ["fetch", "-q", URL, "main:refs/remotes/clean/main"], { cwd: ROOT });
  const same = spawnSync("git", ["diff", "--quiet", "HEAD", "refs/remotes/clean/main"], { cwd: ROOT }).status === 0;
  if (!same) throw new Error("the clean history does not match HEAD — commit first, then rebuild");
  sh("git", ["branch", "-f", "history-before-clean", "HEAD"], { cwd: ROOT });
  sh("git", ["reset", "-q", "--soft", "refs/remotes/clean/main"], { cwd: ROOT });
  sh("git", ["remote", "set-url", "origin", URL], { cwd: ROOT });
  sh("git", ["fetch", "-q", "origin"], { cwd: ROOT });
  sh("git", ["branch", "-u", "origin/main", "main"], { cwd: ROOT });
  log(`origin → ${URL}; old history kept on local branch history-before-clean`);
}

const step = process.argv[2];
try {
  if (step === "build") build();
  else if (step === "dry") build(true);
  else if (step === "switch") switchOrigin();
  else console.log("usage: node scripts/git/make-clean-repo.mjs build|switch");
} catch (e) {
  console.error(`STOPPED: ${e.message}`);
  process.exit(1);
}
