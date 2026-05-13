# Project evolution — inception to latest tooling

This is a **structured narrative** of how the project grew, combining **git history** (authoritative for committed milestones) with **README.md** and workspace layout (for product intent and features that may exist ahead of commits). There is no separate “development log” dump in the repo; this file is the consolidated substitute.

## 1. Timeline from git

| Date | Commit | Summary |
|------|--------|---------|
| 2025-11-28 | `f4b503a` | **Initial commit** — project bootstrap. |
| 2025-11-28 | `d633dbb` | **YoutubeTranscriberSummarizer** — naming / scope aligned with YouTube transcription. |
| 2025-11-28 | `91b2589` | **LICENSE** — MIT (per README). |
| 2025-12-10 | `7372826` | **Playlist + YTTOOL** — entire playlist download; added **`yttool.py`** and **`yttool.js`** with `convert` and URL-driven flows (`python3 yttool.py convert …` / `node yttool.js convert …`). |
| 2025-12-10 | `8f60a3f` | **`.gitignore`** — tightened ignores for generated media and outputs. |

Anything after the last commit (for example **`ytools-cli`**, pnpm workspace, transcript save defaults, Puppeteer Chrome resolution) may live only in the working tree until committed; treat git as partial and the repo + README as the full “current product” picture.

## 2. Evolution by capability (README-aligned)

### Phase A — Core transcript extractor (Node)

- **`index.js`** became the primary **caption / transcript** tool.
- Design: **try several methods in sequence** because YouTube progressively restricted programmatic caption access (documented in README as roughly 30–60% success for pure API paths depending on era and video).
- Dependencies settled on **youtube-transcript**, **@treeee/youtube-caption-extractor**, **yt-dlp** (shell from Node), **Puppeteer** (browser last resort), **yargs**, **chalk**.
- User story: “paste URL → get text (and optionally SRT / JSON / timestamped).”

### Phase B — Whisper fallback (Python)

- **`whisper_transcribe.py`** added for **any video** via local ASR.
- README emphasizes **Python 3.12 LTS**, **ffmpeg**, and a dedicated **`whisper-env`** virtualenv; setup scripts (`setup.sh`, `fix_whisper_install.sh`) and docs (`PYENV_SETUP.md`, `INSTALLATION_COMPLETE.md`, `QUICKSTART.md`) support onboarding.
- User story: “captions failed → same URL, run Whisper → transcript in `output/`.”

### Phase C — Unified CLI (YTTOOL)

- **`yttool.js`** / **`yttool.py`** unify **MP3 (single)**, **MP3 (playlist)**, and **txt** (wire into `index.js` + Whisper) behind one `convert` command with optional `--format` or interactive prompt.
- User story: “one tool for audio archive + transcript.”

### Phase D — Interactive CLI (`ytools-cli`)

- **pnpm workspace** at repo root (`pnpm-workspace.yaml`): root package + **`ytools-cli`**.
- **`ytools-cli`**: React **Ink** UI for non-technical users — paste URL, **multi-select** outputs (e.g. MP3 + transcript), confirm, then run **`yttool.js`** logic sequentially.
- **`YTTOOL_ROOT`**: allows the CLI to live in a subfolder while still finding `index.js` / `whisper_transcribe.py` at the repo root.
- Build: **esbuild** produces **`dist/cli.mjs`** with external node_modules (small artifact, full deps from install).

### Phase E — Hardening (cross-cutting, README + code)

Examples reflected in README or implementation discussions:

- **Transcript save default** — `index.js` saves to `output/` by default (`--save` / `--no-save`) so CLI runs do not “print only.”
- **Puppeteer + pnpm** — system Chrome / `PUPPETEER_EXECUTABLE_PATH` / `channel: 'chrome'` to avoid missing downloaded Chromium.
- **Whisper install hints** — clearer errors when `whisper-env` exists but packages are missing.

## 3. README as the product spec

The root README is the **long-form manual**: quick start, installation (Node + Python tracks), full command reference, workflows, troubleshooting, performance, cost comparison, credits.

Notable README sections (headings):

- Quick Start (Methods 1–3 + Interactive UI)
- Output files location
- Installation & prerequisites
- Complete command reference
- Which method to use
- Workflows & use cases
- Troubleshooting
- File structure (high level; see [ARCHITECTURE.md](./ARCHITECTURE.md) for an updated structural view including `docs/` and `ytools-cli/`)

## 4. Gaps and honesty

- **No `CHANGELOG.md`** or dated engineering diary in-repo at the time this doc was written.
- **`codebase.md`** is a snapshot export (dated in its header); use for historical file listing, not for runtime truth.
- For **exact** line-level history, use `git log -p` on specific files.

## 5. Suggested maintainer ritual

1. After meaningful releases, append a short **“Release notes”** subsection here or add `CHANGELOG.md`.
2. Keep [ARCHITECTURE.md](./ARCHITECTURE.md) updated when adding entry points or dependencies.
3. Align README “File Structure” block with `docs/` + `ytools-cli/` when convenient.

---

*Consolidated from git log, README structure, and workspace inspection.*
