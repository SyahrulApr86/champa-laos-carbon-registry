# AI Continuation Document — Champa (Lao PDR National Carbon Registry)

Generated: 2026-08-05 11:37 +07:00 (Asia/Vientiane)

## 1. Project Identity

**Project Name**: Champa — Lao PDR National Carbon Registry

**What This Project Is**: A fork of UNDP's open-source "National Carbon Registry" (a Digital Public Good, AGPL-3.0, `github.com/undp/carbon-registry`), localized end-to-end for Lao PDR. Built for a client whose engagement is with Kementerian Lingkungan Hidup (Indonesia) context, using Indonesia's own government carbon registry SRN (`srnindonesia.kemenlh.go.id`) as the feature/visual parity benchmark, but the deliverable itself is Laos-branded and Laos-localized (name references *Dok Champa*, the national flower of Laos).

**Primary Objective**: Build, implement, test, and document a fully-localized, production-demo-ready carbon registry for Laos ("Champa"), with comprehensive (not superficial) customization, feature parity with SRN Indonesia where honestly replicable, realistic seeded demo data, full documentation with screenshots, and every meaningful change committed + pushed to the client's own GitHub repo.

**Strategic Intent**: A client-billable, demoable deliverable. User explicitly stated shallow/template-level customization is unacceptable ("nanti saya tidak dibayar kalau gitu" — paraphrased: superficial work risks non-payment). The bar is a registry that could plausibly be shown to a real Lao government stakeholder as a working prototype.

**Hard Constraints** (non-negotiable, established across the session):

- **Never fabricate data or features that don't correspond to real, honestly-derivable Lao/Champa state.** Where SRN Indonesia has something Lao/Champa genuinely cannot replicate honestly (Indonesia-specific programs, Indonesia-only datasets, missing OAuth credentials), it must be **explicitly documented as an exception**, never silently skipped or faked.
- **Champa's own blue/red palette must never be replaced with SRN's colors.** Visual work matches SRN's *layout/density*, not its color scheme. (Explicit user correction mid-session: "warnanya tetap seperti desain warna champa saat ini jangan ganti seperti mirip srn".)
- Test credentials (4 seeded accounts, password `ChampaLaos2026!`) and CSV seed files are dev-only and must be changed/removed before any real production deployment — documented in README-LAOS.md, never treat as safe for prod.
- Every meaningful change → commit + push to `laos` remote (`git@github.com:SyahrulApr86/champa-laos-carbon-registry.git`). The upstream `origin` (`github.com/undp/carbon-registry`) is fetch/push-configured but must never be pushed to — it's the original UNDP repo, read-only reference.

**Project Memory Files**:

- `/home/syahrul/projects/srn/undp-carbon-registry/README-LAOS.md` — customization overview, running-locally instructions, test credentials, Known Issues section (Programme vs ProjectEntity gap, translation coverage, etc.)
- `/home/syahrul/projects/srn/undp-carbon-registry/CHECKLIST.md` — SRN→Champa feature parity checklist (38/42 items `[x]` as of this session; 4 remaining are explicit documented exceptions, not gaps)
- `/home/syahrul/projects/srn/undp-carbon-registry/SRN_PARITY_AUDIT.md` — deeper technical audit doc
- `/home/syahrul/projects/srn/laporan-audit-srn-ndc.md` and `/home/syahrul/projects/srn/bukti-screenshot-srn.md` — **live OUTSIDE the git repo**, in the parent directory `/home/syahrul/projects/srn/` (not tracked by git — confirmed `git rev-parse --show-toplevel` fails there). These are the original SRN Indonesia audit source docs (screenshots + data), annotated with a "Status Champa" column per row, used as the parity checklist source of truth.
- No `CLAUDE.md`/`AGENTS.md` exists inside `undp-carbon-registry/` itself; the operative project conventions live in the docs above.

## 2. What Exists Right Now

**Repo state** (verified via `git status`/`git log -1` this session, HIGH CONFIDENCE):

- Path: `/home/syahrul/projects/srn/undp-carbon-registry`
- Branch: `main`, working tree **clean**
- `HEAD` = `9a1c7942123c393406fc62407550931c1b3a1f7c` — "feat: add Number of Proponents/SPE by Registry Scheme donuts"
- `HEAD` is **identical** to `laos/main` on GitHub (verified via `git ls-remote laos main` — SHA matches exactly). Nothing uncommitted, nothing unpushed.
- `origin` remains the original `github.com/undp/carbon-registry.git` (88 commits behind local `main` — expected, never push here).

**Does it run right now?**: **NOT currently reachable end-to-end.** (HIGH CONFIDENCE, verified live this session)

- `docker compose ps`: only `db`, `replicator`, `stats`, `web` containers are `Up`. The **`national` container is stopped** — I stopped it mid-session to run the backend locally instead (`yarn start:dev` against the same Postgres, for faster iteration than full Docker rebuilds), and never restarted the Docker one.
- The local dev backend process (`national-local`, tracked via `hub`) has since **exited** (session/broker teardown between turns — not a code crash; last logs show only benign "Missing x-apigateway-event..." request-log noise, not an error trace).
- `curl http://localhost:3000/...` → connection fails (no backend listening on 3000 right now).
- `curl http://localhost:3030/` → HTTP 200 (nginx serving the web build), but it will show broken/empty data since it can't reach the API.
- **Fix**: either `docker compose up -d national` (uses whatever image was last built — see staleness note below), or restart the local dev backend (see Section 3 "Commands that matter").

**Docker image staleness** (HIGH CONFIDENCE, verified via `docker images ... --format {{.CreatedAt}}` vs `git log`):

- `undp-carbon-registry-web` image built 2026-08-05 10:02
- `undp-carbon-registry-national` image built 2026-08-05 10:17
- But commits `d3f36bfec` (10:25) and `9a1c79421` (10:43) landed **after both builds**. **The Docker images do NOT contain the last 2 commits** (Daily Trading widget, Registry Scheme donuts). Those were verified live only via `national-local` (port 3000) + the Vite dev server on port 3031, not via the Docker-served app on 3030/3000.
- **Before any demo/handoff using Docker**, rebuild: `docker compose build national web && docker compose up -d`.

**What is built and working** (HIGH CONFIDENCE, browser-verified this session or earlier this session):

- Full Lao PDR localization: ministries, government departments, provinces (18 real), sectors (+IPPU), Lao PDR-scoped location dropdowns, Lao language file skeleton (i18next), Champa blue/red/gold branding throughout, NFMS forest-boundary map overlay integration.
- 4 new feature modules beyond base UNDP registry: Adaptation projects, Climate Finance/Technology Transfer/Capacity Building (Resources), Community Programs, REDD+, plus Recognized Mitigation Actions, NDC Target tracking, Emission Ceiling & Trading (PTBAE-PU equivalent), Expert Roster, Guidance Documents.
- **Shared `AppHeader` component** (`web/src/Components/AppHeader/appHeader.tsx` + `.scss`) — single source of truth for the public navbar, retrofitted onto **16 public pages** this session (see Section 4). Fixes a real bug: previously every public page had its own hand-copied/inconsistent header, and several (About, all `/public/*/:id` detail pages, legal pages) had **no nav at all**.
- 2030 Target NDC card contrast bug fixed (was dark-blue-on-navy, effectively invisible for negative values — user caught this via screenshot).
- Indonesia-specific regulatory acronym leaks removed from UI text: `PTBAE-PU`→"Ceiling Series"/"Emission Ceiling & Trading Scheme", `SPEI`→"Emission Reduction Certificate Scheme", `DRAM`/`LCAM`→dropped in favor of English descriptions. `IPPU` deliberately **left untouched** — it's a standard global IPCC/UNFCCC inventory category used by every UNFCCC Party including Laos, not Indonesia-specific (verified via reasoning, not blindly changed).
- Real "Daily Trading" widget (today's trade volume/value, honestly `0` when no trades happened today — same behavior SRN's own live site shows).
- Two new donuts: "Number of Proponents by Registry Scheme" and "Number of SPE by Registry Scheme" — honest single-bucket charts (Champa National Registry vs JCM/Gold Standard/Verra/Others all at 0), matching the fact that SRN Indonesia's own live data is also ~100% one scheme.
- **`backend/services/src/demo-seeder/`** — internal `RUN_MODULE=demo-seeder` process (bypasses login CAPTCHA by running in-process against the real service layer, same pattern as the existing `data-importer`). Seeds realistic multi-month production data across all 12 registry modules. Verified: currently 12 programmes live in the DB from a prior seeding run (`SELECT count(*) FROM programme` → 12).
- `CHECKLIST.md`: 38/42 items `[x]`. Remaining 4 are explicit, documented exceptions (ProKlim deep link — Indonesia-specific program name; Village/Sub-district Vulnerability Data — no Lao SIDIK-equivalent dataset; Google OAuth — no real client credentials; SRN's own documented data-quality bugs — deliberately not replicated).

**What is partially built** (MEDIUM CONFIDENCE — carried from earlier in the session, not re-verified this turn):

- Lao (`lo`) translation coverage: fully translated for common/nav/login/forgotPassword/resetPassword/passwordReset namespaces; partial for dashboard/homepage; remainder falls back to English. User explicitly deferred full-scope translation to a follow-up round rather than guessing native Lao text.
- "Cancelled"/"Assigned" credit states on the Emission Reduction Certificate panel — explicitly left at 0/N/A this session (see Section 4) because no real cancel-credit or assign-to-exchange workflow exists in Champa yet (only `retire` is real). Flagged to the user as a legitimate follow-up feature, not silently faked.

**What is broken or blocked**: Nothing known broken in the *code*. The only "broken" state right now is operational: **backend not running** (see "Does it run right now?" above) — trivially fixable, not a code defect.

**What has NOT been started**:

- Adding an "Available Carbon Exchange" ceiling sub-allocation (explicitly judged not relevant without a real Lao business rule backing it — see Section 4 reasoning).
- Adding a real "Proponent Category" institutional-classification donut (SRN's Local/Central Government/Business/NGO/Community taxonomy) — Champa's registration form doesn't collect this field at all; would need either a new form field (schema change) or an invented `CompanyRole` mapping. Explicitly deferred, not silently dropped.
- A real credit-cancellation / assign-to-exchange workflow (see above).
- IDXCarbon-equivalent (Indonesia's specific state-run carbon exchange platform) — explicitly judged **not relevant**, no Lao equivalent exists, stays a documented exception, not a to-do.

## 3. Architecture & Technical Map

**Tech stack**: NestJS (backend, TypeORM + PostgreSQL) + React/Vite (frontend) monorepo. Docker Compose orchestrates 5 services: `db` (Postgres), `national` (national-api, port 3000), `stats` (analytics-api), `replicator` (ledger-replicator — event-sourcing style read-model sync, see gotcha in Section 5), `web` (nginx-served Vite build, port 3030).

**Key files/folders**:

- `backend/services/libs/shared/src/` — all shared entities, services, enums, DTOs (the actual business logic lives here, not in `src/`)
- `backend/services/src/national-api/` — the public/authenticated HTTP controllers
- `backend/services/src/demo-seeder/` — this session's new internal seeding module (module/service/handler pattern, mirrors `src/data-importer/`)
- `backend/services/organisations.csv`, `users.csv` — base seed data (9 orgs, 4 real login accounts), imported on `national-api` boot via `setup/handler.ts`
- `web/src/Components/AppHeader/appHeader.tsx` — **new shared navbar component**, use this on every new public page going forward, never hand-copy header markup again
- `web/src/Components/Homepage/CarbonDashboard.tsx` — the main public dashboard, most donut/KPI chart logic lives here
- `web/src/Components/Homepage/EmissionCeilingTradingTabs.tsx` — PTBAE-PU-equivalent tabs (Ceiling Series / Carbon Exchange Transactions / Participants)
- `CHECKLIST.md`, `README-LAOS.md`, `SRN_PARITY_AUDIT.md` (repo root) — living docs, update alongside code changes
- `/home/syahrul/projects/srn/laporan-audit-srn-ndc.md`, `bukti-screenshot-srn.md` (**outside the repo**, parent dir) — SRN source-of-truth audit docs with per-row Champa status annotations

**How the system works end-to-end**:

1. `docker compose up -d` boots Postgres, then `national-api` (imports `organisations.csv`/`users.csv` on first boot if tables are empty), `analytics-api`, `ledger-replicator`, and the static `web` nginx server.
2. Programme (mitigation project) creation goes through `ProgrammeService.create()` → writes to Postgres directly (`PgSqlLedgerService`, not AWS QLDB) → the `replicator` service **asynchronously replays** the create event onto the read-model row. **Gotcha**: mutating a just-created Programme's fields (e.g. `currentStage`) immediately after `create()` races this async replay and gets silently reverted — see Section 5.
3. Public frontend pages fetch from unauthenticated `/public/...` endpoints; authenticated proponent/admin flows sit behind JWT + CASL policy guards.
4. `demo-seeder` bypasses all HTTP/auth entirely by running as a standalone Nest application context (`NestFactory.createApplicationContext`) that calls services directly in-process — same trick as `data-importer`.

**Commands that matter**:

- Full stack: `cd undp-carbon-registry && docker compose up -d --build`
- Backend typecheck: `cd backend/services && npx tsc --noEmit -p .`
- Frontend typecheck: `cd web && npx tsc --noEmit -p .`
- Run demo seeder (idempotency guard: refuses if `programme` table already has >3 rows — reset with `docker compose down -v` first for a clean re-seed): `docker compose run --rm -e RUN_MODULE=demo-seeder national`
- **Local backend dev (no Docker rebuild needed)**: `cd backend/services && yarn start:dev` with env vars `DB_HOST=localhost DB_PORT=5433 DB_USER=root DB_PASSWORD="<ANY PASSOWORD>" DB_NAME=carbondev RUN_MODULE=national-api RUN_PORT=3000` (+ the other non-DB env vars mirrored from `docker-compose.yml`'s `national` service block — country name, email flags, etc.). Requires the Docker `national` container to be **stopped first** (port 3000 conflict) and the Docker `db` container to stay running (host-exposed on `5433:5432`).
- Frontend dev server: already has a background `web-dev` process pattern (Vite on port 3031) proxying to whatever backend is on port 3000 — check `hub ps`/`hub start` if not running.

**Naming conventions**: TypeScript camelCase throughout; NestJS module/service/controller triads per domain; SCSS files co-located per-page/component; i18next namespace-per-feature-area for translations.

**External dependencies**: None requiring live credentials for the current build (Google OAuth explicitly excluded — no client credentials provided). NFMS map overlay hits a real Lao government ArcGIS REST endpoint (`nfms.dof.maf.gov.la`) — public, no auth.

## 4. Recent Work — What Just Happened (High Priority)

This session picked up from a prior session that had already completed: SRN↔Champa feature parity build-out (25-item screenshot checklist, all ✅), production-scale demo seed script, and full Docker verification. This session's work, in order:

1. **Re-confirmed the goal-mode objective was already complete** (checklist docs, seed script) via independent verification (local git, `git fetch`, `git ls-remote`, and a direct GitHub API call to the commits endpoint) after the user repeatedly asked "push ke repo" — determined there was genuinely nothing new to push each time, eventually clarified with the user via `ask` and got "Nothing more needed" confirmation. **Lesson**: don't keep re-running identical no-op verification loops when a user repeats a request with zero state change between asks — either state the deterministic result once and stop re-verifying, or ask directly.

2. **Navbar consistency bug (user-reported, with screenshot)**: user found the About page and `/public/adaptation/ADP-0008` had inconsistent/missing navbars, and asked point-blank "memangnya tidak pakai component reusable kah untuk navbar?" (isn't there a reusable navbar component?). **Root cause confirmed**: there wasn't one — `homepage.tsx` and `mapPage.tsx` each hand-copied near-duplicate header markup, and 14 other public pages either had no nav or a stripped-down logo-only version.
   - **Decision**: extract a single `AppHeader` component (`web/src/Components/AppHeader/`), byte-for-byte matching the original homepage markup (including the About/Instruments dropdown submenus and the NDC-Achievement scroll-to-hash behavior), then retrofit every public page to use it.
   - **Why this way, not a per-page patch**: the user's own question ("isn't there a reusable component") was the correct diagnosis — patching each page's header individually would have reintroduced the same class of bug the next time someone added a page.
   - Retrofitted `homepage.tsx`, `mapPage.tsx`, `about.tsx`, `verificationAgencyDetail.tsx` myself first (to establish the exact pattern), then **delegated the remaining 12 pages to 3 parallel subagents** (`NavbarLegalPages`, `NavbarInfoPages`, `NavbarPublicDetailPages`) with the established pattern as their spec, then **personally re-verified**: full-repo grep sweep confirmed zero remaining `header-container`/`sliderLogo` references anywhere in `Pages/`, `tsc --noEmit` clean for both backend and frontend, and live browser checks on the exact URLs the user flagged.
   - Also cleaned up now-dead per-page header CSS in every retrofitted page's `.scss` file (not left as orphaned dead code).

3. **Same screenshot flagged a real contrast bug**: the 2030 Target value on the NDC Achievement contribution card was rendering `#0D2E63` (dark blue) text on a `#0A2350` (dark navy) card background — the generic `.ndc-kpi-card-value` color rule wasn't overridden inside the dark `.ndc-kpi-card-contribution-bottom` container. Fixed by adding an explicit white color override scoped to that container. Verified via computed-style check in browser: `rgb(255,255,255)` on `rgb(10,35,80)`.

4. **Indonesia-specific term leaks**: user flagged `PTBAE-PU` and `IPPU` as possibly-Indonesia-specific and asked for the Lao equivalent. **Investigated both, decided differently per-term** (this reasoning matters for next session — don't blindly "translate" every acronym):
   - `PTBAE-PU`, `SPEI`, `DRAM`, `LCAM` — genuinely Indonesia-specific regulatory/program acronyms (Indonesia's own certification scheme name, Indonesia's own document names). Renamed to Champa-generic equivalents already established elsewhere in the codebase.
   - `IPPU` (Industrial Processes and Product Use) — **deliberately left untouched**. This is a standard IPCC/UNFCCC GHG-inventory sector category used by every UNFCCC Party, including Laos' own national inventory reporting. Verified this reasoning was correct via the existing `NdcSector` enum, which already stores the full English name and matches SRN's own tab-label pattern (short acronym in the pill, full name as the enum value). **Don't "localize" this term if asked again** — it's not a localization gap.

5. **Follow-up question, same screenshot theme**: user pasted SRN's Mitigation NEK panel (PTBAE-PU stats + Emission Reduction Certificate stats: Issued/Available/Available-Carbon-Exchange/Retired/Cancelled/Assigned/Daily-Trading) and asked "bisa diadakan di champa?" (can this be built in Champa?). **Per-item verdict + selective implementation**:
   - **IDXCarbon branding** → not relevant, no Lao carbon exchange platform exists, would be fabrication. Explicit exception.
   - **"Available Carbon Exchange" ceiling sub-allocation** → not relevant right now, no real Lao business rule for it exists (already correctly renders `-`, matching SRN's own honest empty state for the same underlying reason).
   - **"Cancelled"/"Assigned" credit states** → real gap, not built (no cancel/assign-to-exchange workflow exists in Champa's credit lifecycle, only `retire` is real). Left honestly at 0 rather than faked. Flagged as a legitimate bigger-scope follow-up if wanted.
   - **"Daily Trading" widget** → **built**. Added a `today` breakdown to `EmissionTradingService.publicSummary()` (date-filters the same trading rows already being summed — no new data source, no fabrication), and two new KPI cards on the frontend.
   - Mid-implementation, **caused and immediately fixed a real bug**: the frontend blindly replaced `tradingSummary` state with the raw API response (`setTradingSummary(tradingResponse.data)`), so when the *old* (not-yet-restarted) backend responded without the new `today` field, `tradingSummary.today.totalUnits` threw and the whole page went blank in the browser. User caught this live ("<http://localhost:3031/> jadi blank"). **Fixed properly**: rewrote the fetch to merge every field with explicit `?? 0` defaults instead of trusting the API response shape wholesale. **Lesson for next session**: never blind-replace React state with a raw API response when the backend and frontend can be out of sync (exactly the local-dev-vs-Docker split this session introduced) — always default/merge.

6. **User asked "memangnya backendnya tidak bisa dijalankan manual tanpa docker kah?"** (can't the backend just run manually without Docker?). Investigated and set it up:
   - `yarn start:dev` works, pointed at Docker's Postgres via `DB_HOST=localhost DB_PORT=5433`.
   - Hit a real environment incompatibility: this workstation's system Node is **v26.4.0**, but a transitive JWT dependency (`buffer-equal-constant-time`) references the Node `SlowBuffer` API, which is **fully removed in Node 26** (Docker's `node:20-alpine` still has it). Crashed on boot with `TypeError: Cannot read properties of undefined (reading 'prototype')`.
   - **Fixed with a local-only `node_modules` patch** (`backend/services/node_modules/buffer-equal-constant-time/index.js`, 2-line defensive fallback: `SlowBuffer || Buffer`). Confirmed this file is gitignored (`**/node_modules/`), so it's purely a local dev-environment workaround, doesn't touch the repo, and **won't affect the Docker build** (which does its own fresh `yarn install` inside `node:20-alpine`, where the original unpatched package works fine).
   - Started via `hub start` as a named process (`national-local`) so it survives across tool calls with log/status inspection — **this process has since exited** (see Section 2), needs restarting for next session's local iteration.

7. **Built two new SRN-parity donuts** ("Number of Proponents by Registry Scheme", "Number of SPE by Registry Scheme") after **re-examining and reversing my own earlier session's judgment call**. A prior session had marked these "N/A, single-country registry" in `CHECKLIST.md` — the user's screenshot implicitly challenged that dismissal. On reflection, that was too quick a dismissal: SRN Indonesia's own live data is *also* ~100% one scheme (188 SPEI / 0 everything else), so Champa being single-scheme renders the identical honest shape, not something to hide. Built as single-bucket donuts reusing existing summary totals (`totalProjects`, `credits.issued`), zero new data/fabrication.

**Discussed but NOT yet implemented**: real credit-cancellation workflow, "Available Carbon Exchange" sub-allocation, "Proponent Category" institutional taxonomy donut (would need a new registration form field or an invented `CompanyRole` mapping — user hasn't decided which).

**Open threads**: none blocking. The user's last message before this handover request was the per-item verdict + Daily Trading widget delivery; no unanswered question is pending from them.

**Promote to project memory**: The Node 26 / `SlowBuffer` / `buffer-equal-constant-time` local-dev gotcha, and the "never blind-replace React state from an API response when frontend/backend can be temporarily out of sync" lesson, are both durable and worth a `failure`/`tool-quirk` memory entry if this workstation continues to be used for this project.

## 5. What Could Go Wrong

**Known bugs/issues**:

- None currently open in code. The two bugs surfaced this session (2030 Target contrast, blank-page-on-stale-API-response) were both fixed and verified within the same session.

**Edge cases to watch for**:

- **Ledger-replicator race condition** (discovered and worked around in an *earlier* session, still true architecturally): mutating a Programme's fields (e.g. `currentStage`, credit amounts) immediately after `ProgrammeService.create()` races the `replicator` service's async replay of the create event and gets **silently reverted**. The `demo-seeder` works around this with an explicit settle delay between the create pass and the stage-mutation pass. **If you add new code that creates-then-immediately-mutates a Programme, you will hit this again** — don't assume a synchronous write sticks.
- Any new page added to the public site **must** use `<AppHeader />` — there's no lint/type enforcement preventing a new hand-copied header, only convention now established via this session's precedent.
- Docker images are currently stale relative to `HEAD` (see Section 2) — don't assume `docker compose up -d` without `--build` reflects the latest code.

**Technical debt / shortcuts taken**:

- Lao translation coverage is partial (documented, not hidden) — dashboard/homepage namespaces fall back to English for untranslated keys.
- `POSTGRES_PASSWORD`/`DB_PASSWORD` in `docker-compose.yml` is the literal string `"<ANY PASSOWORD>"` (typo preserved from earlier in the fork's history, functionally works since Postgres doesn't validate the string, but ugly — flagged, never fixed, low priority).
- The local `node_modules` patch for Node 26 compat is a workaround, not a real fix — if this workstation's Node version changes or a fresh `yarn install` runs, the patch will need reapplying (it's not persisted anywhere except the currently-installed `node_modules` tree).

**Assumptions that could be wrong**:

- Assumed the user's intended audience for "Registry Scheme" donuts finds a single 100%-bucket chart informative rather than pointless — reasoned from SRN's own real data showing the same shape, but this is a judgment call, not a verified user preference.
- Assumed `IPPU` should stay untouched based on IPCC/UNFCCC standard-taxonomy reasoning — high confidence this is correct, but wasn't explicitly confirmed by the user before deciding.

## 6. How to Think About This Project

1. **Core architectural pattern**: This is a *fork-and-honestly-localize* project, not a from-scratch build. The single most important recurring judgment call across every session is: **"is this SRN Indonesia feature/data point honestly reproducible for Laos with real data, or would reproducing it require fabrication?"** When the answer is fabrication, the correct move is always an **explicit, documented exception** (in `CHECKLIST.md` and/or code comments), never a silent skip and never a fake number. This pattern is why the codebase has comments like `// cancelledUnits is honestly always 0 rather than fabricated` scattered through it — that's intentional house style, not laziness.

2. **Common mistakes a new agent/person would make here**:
   - Treating "SRN has X, Champa doesn't" as automatically "must build X" — sometimes the right answer is "not relevant, document why" (IDXCarbon, SIDIK vulnerability data). The reflexive move should be *investigate feasibility and honesty first*, not build first.
   - Assuming the Docker containers reflect the latest commit — verify image build timestamps against `git log`, they drift (see Section 2).
   - Hand-copying header/nav markup onto a new page instead of using `<AppHeader />` — this exact mistake is what caused this session's biggest bug-fix.
   - Mutating a just-created Programme's fields synchronously and assuming it persisted — the replicator race (Section 5) will silently eat the change.
   - Running the backend locally with the workstation's default Node version without checking for the `SlowBuffer` incompatibility (Section 4, item 6) — will crash with a cryptic buffer-equal-constant-time error.

3. **What looks refactorable but should NOT be touched without explicit instruction**:
   - The dual `Programme` (real, ledger-backed, write-working) vs `ProjectEntity` (separate read-model-shaped entity, unclear/unconfirmed write path) split — this is a **known, pre-existing architectural gap inherited from upstream UNDP's codebase**, documented in `README-LAOS.md`'s Known Issues section from an earlier session. It looks like duplication that "should" be unified, but doing so is a substantial, risky refactor of upstream's own data model that hasn't been requested and could break the working ledger/replicator flow. Leave it.
   - The ledger/replicator event-sourcing mechanism itself — looks like unnecessary complexity for a single-country registry, but it's upstream's core write-consistency mechanism; don't "simplify" it.
   - Color/branding values (`variables.$primary-color` etc.) — these were the subject of an explicit user correction earlier in the project's history ("don't make it look like SRN's colors"). Don't reintroduce SRN's green/teal palette even if visually "matching SRN more closely" seems appealing.

## 7. Do Not Touch List

- Do NOT refactor the Programme/ProjectEntity split, or the ledger/replicator mechanism, without explicit instruction (Section 6).
- Do NOT reintroduce SRN Indonesia's color palette anywhere — Champa stays blue/red/gold, matching SRN's *layout density* only.
- Do NOT hand-copy header/nav markup onto a new page — use `<AppHeader />`.
- Do NOT fabricate data, features, or numbers to "fill in" an SRN parity gap — investigate honesty/feasibility first, document explicit exceptions.
- Do NOT push to the `origin` remote (`github.com/undp/carbon-registry`) — only ever push to `laos`.
- Do NOT assume `docker compose up -d` (without `--build`) reflects the latest commit — check image build time vs `git log` first.
- Do NOT treat the seeded `users.csv`/`organisations.csv` test accounts or the demo-seeder's data as production-safe — they're explicitly dev/demo-only per README-LAOS.md.
- Ask before adding new frameworks/libraries/dependencies not already in `package.json`.

## 8. Confidence & Freshness

- Section 1 (Project Identity): HIGH CONFIDENCE — constraints are direct quotes/paraphrases of explicit user statements across the session.
- Section 2 (What Exists): HIGH CONFIDENCE — every claim verified via live command this session (`git status`, `git log`, `docker compose ps`, `docker images`, `curl`, `psql count`).
- Section 3 (Architecture): MEDIUM-HIGH — file/folder map and commands verified this session; some deeper "how it works" detail (ledger internals) carried from earlier-session investigation, not re-verified line-by-line this turn.
- Section 4 (Recent Work): HIGH CONFIDENCE — all built/verified within this session, directly observed.
- Section 5 (What Could Go Wrong): MEDIUM — the replicator race is HIGH CONFIDENCE (empirically triggered and worked around in the demo-seeder this session's predecessor session); other items are reasoned assessments.
- Section 6 (How to Think): MEDIUM — synthesized judgment from this session plus carried context from README-LAOS.md's Known Issues; the Programme/ProjectEntity gap specifically is documented but not re-verified this turn.
- Section 7 (Do Not Touch): HIGH CONFIDENCE — directly derived from explicit user corrections and this session's own established patterns.

## Resume Instructions

1. Baca seluruh dokumen ini dulu sebelum bertindak.
2. Baca juga project memory files yang disebut di Section 1 (`README-LAOS.md`, `CHECKLIST.md`, `SRN_PARITY_AUDIT.md`, dan dua file audit di luar repo).
3. Ground-check realitas: jalankan `git status`, `git log -5`, `docker compose ps`, bandingkan dengan klaim di Section 2 — laporkan kalau ada penyimpangan (khususnya: apakah `national` container/local dev backend sudah jalan lagi atau masih down).
4. Ringkas pemahamanmu dalam 3-5 kalimat sebelum mulai kerja.
5. Tentukan next action berdasarkan USER DIRECTIVE di bawah.
6. Tanya klarifikasi HANYA kalau benar-benar blocking.
7. Mulai kerja.

USER DIRECTIVE: [isi instruksi spesifik dari user, atau pakai default di bawah]

Default (kalau tidak ada directive): Restart backend (Docker `national` container atau local `yarn start:dev`, rebuild Docker images kalau mau demo lewat 3030), verifikasi stack jalan end-to-end, lalu tanya user mau lanjut ke item follow-up mana (real cancel/assign workflow, Proponent Category donut, atau translation coverage) — jangan asumsikan salah satu tanpa konfirmasi.
