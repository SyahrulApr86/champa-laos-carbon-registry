# Champa — Lao PDR National Carbon Registry

## About

**Champa** is the Lao People's Democratic Republic (Lao PDR) national deployment of the [UNDP National Carbon Registry](https://github.com/undp/carbon-registry), a Digital Public Good originally developed and maintained by UNDP. The name references *Dok Champa* (ດອກຈຳປາ), the national flower of Laos.

This repository is a fork of the upstream project, customized to support Lao PDR's Ministry of Agriculture and Environment (MAE) in implementing the **Decree on Carbon Credits** (signed 28 May 2025), which establishes MAE as the Designated National Authority (DNA) for authorizing, registering, and overseeing carbon market activities, with line ministries reviewing projects within their own sector before MAE's final registration.

Like the upstream project, Champa is licensed under the **GNU Affero General Public License (AGPL-3.0)**. All modifications in this fork remain publicly available under the same license terms — see the original [README.md](./README.md) for the full standards, license, and attribution details.

## Customizations for Lao PDR

### Ministry / Sector / DNA configuration
- `Ministry` enum (backend `libs/shared/src/enum/ministry.enum.ts`, frontend `Definitions/Enums/ministry.enum.ts`) replaced Nigeria's federal ministry list with Lao PDR line ministries: Ministry of Agriculture and Environment (MAE, the DNA), Ministry of Energy and Mines, Ministry of Industry and Commerce, Ministry of Public Works and Transport, Ministry of Health, Ministry of Education and Sports, and the Department of Forestry (under MAE).
- `GovDepartment` enum similarly replaced ~150 Nigerian federal agencies with the 19 Lao departments matching the ministries above.
- `Sector` enum (backend and frontend) gained an `IPPU` (Industrial Processes and Product Use) member, matching Lao PDR's NDC sector coverage (Energy, IPPU, AFOLU, Waste, Transport, Health). The two parallel sector enums used by analytics/reporting (`InfSectorEnum`, `ProjectSectorEnum`) were also updated to include IPPU, otherwise IPPU projects would silently disappear from sector-based reports.
- The existing `CompanyRole.MINISTRY` role, combined with each Ministry company's `sectoralScope` field, already implements a per-sector line-ministry review gate: a Ministry-role user can only review/approve projects whose `sectoralScope` matches the sectors assigned to their organisation (`programme.service.ts: findPermissionForMinistryUser`). This maps directly onto the Decree's two-stage approval (line ministry review, then MAE/DNA final authorization) without any core logic changes.
- `backend/services/organisations.csv` and `backend/services/users.csv` seed 9 Lao PDR organisations (MAE + 6 line ministries/departments, 1 sample project developer, 1 sample VVB/certifier) and matching login accounts for local testing.
- Fixed two pre-existing bugs in the CSV import path (`setup/handler.ts`) that blocked this from working at all: the `IMPORT_ORG` handler only recognized `IC`/`API` company roles (not `DNA`/`Ministry`) and hardcoded `sectoralScope`/`nameOfMinister` to `undefined`; the `IMPORT_USERS` handler had no case for `Ministry` role at all. Both now handle the full role set.
- Fixed a second pre-existing bug: `ministryOrgs` was imported from `govDep.enum.ts` (where it does not exist) instead of `ministry.enum.ts`, in both `company.service.ts` and `user.service.ts`.

### Region / location data
- `backend/services/regions.csv` (used by `FileLocationService` to validate the `geographicalLocation` field on project submission) was still the original Nigeria 37-state list. Replaced with the 18 real Lao PDR provinces (including Vientiane Capital) with approximate coordinates. Without this fix, no project could be submitted with a real Lao PDR location.
- `provinces.csv`/`districts.csv`/`dsDivisions.csv`/`cities.csv`/`postalCodes.csv` model a separate Sri Lanka province→district→DS-division hierarchy not touched by this pass — **known follow-up**, see Known Issues below.

### Lao language (ພາສາລາວ) localization
- Added `lo` as a selectable language (`web/src/Components/LanguageSelection/languageSelection.tsx`); no code-level language whitelist exists so this was the only wiring needed.
- All 48 i18n namespaces under `web/public/locales/i18n/` now have a `lo.json` file (no crashes when Lao is selected).
- **Fully translated to Lao (all keys)**: `common`, `forgotPassword`, `resetPassword`, `passwordReset`, `companyDetails`, `genderParity`, `mrvdashboard`, `nationalAccounting`, `settings`, `slcfRoadmapTimeline`.
- **Near-fully translated** (general UI-chrome namespaces expanded in this pass — nav labels, forms, confirmation dialogs, table headers, gender/economic/environmental/social co-benefit questionnaires): `nav`, `login`, `company`, `user`, `addUser`, `addCompany`, `companyProfile`, `companyRoles`, `costQuotation`, `userProfile`, `creditTransfer`, `economic`, `environment`, `social`, `ndc`, `reporting`, plus the short labels in `dashboard` (83/196 keys) and `homepage` (53/83 keys).
- **English fallback placeholder** (`lo.json` = copy of `en.json`): the deep technical/legal MRV and carbon-accounting namespaces (`PDD`, `monitoringReport`, `validationReport`, `verificationReport`, `projectDetailsView`, `projectList`, `view`, `addProgramme`, `programme`, `ndcAction`, `unfcccSdTool`, `coBenifits`, `socialEnvironmentalRisk`, `ghgInventory`, `safeguards`, `projectProposal`, `slcfProgrammeTimeline`, `validationAgreement`, `creditPages`, `siteVisitCheckList`) plus the long-form prose/tooltip strings in `dashboard`/`homepage` — left untranslated to avoid guessing inaccurate Lao for dense technical/regulatory phrasing without native review.
- Approximately 846 of ~4,066 total UI strings are now genuinely translated (up from ~192). **This is a real, ongoing translation task, not a one-time technical fix** — budget for native Lao speaker review of the remaining MRV/legal namespaces before production use.

### NFMS (National Forest Monitoring System) integration
- New hook `web/src/Hooks/useNFMSBoundary.ts` fetches Lao PDR's public NFMS ArcGIS REST service (`https://nfms.dof.maf.gov.la/arcgis/rest/services/nfms/REDD_Activity/MapServer`) as GeoJSON, verified live via `curl` before implementation.
- Currently published layers: `FCPF-CF_ER-Program` (6 features), `VCS_Project-ID_1684` (323 features), `VCS_Project-ID_1398` (1 feature) — all `Polygon` geometry, publicly queryable with no API key.
- Wired into `GetLocationMapComponent.tsx` as an optional, toggle-able "Show NFMS Forest Boundaries" layer, additive only — the existing manual polygon-drawing flow for project location is untouched.
- New env var `VITE_APP_NFMS_API_URL` (defaults to the NFMS endpoint above) follows the same pattern as the existing Mapbox env vars.

### Branding
- Color palette (`web/src/Styles/variables.scss`, cascades to ~20 files that already used the Sass variables): primary theme color → Lao flag blue `#0D2E63`, danger/error color → Lao flag red `#CE1126`, added `$accent-gold: #F2B705` (Dok Champa) reserved for non-text accents (kept off text/background — white-on-gold measured ~1.9:1 contrast, fails WCAG AA).
- Patched remaining raw-hex hotspots in the global `app.scss` entry point and 4 per-feature theme files (`colors.addCompany/addProgramme/dashboard/role.scss`).
- Rebranded visible copy text: homepage hero heading/subheading/vision copy, login page hero text, and the "CARBON MARKET DIGITAL PLATFORM" string that appeared (split across two JSX lines each) in the footer, homepage, company registration page, login page, and post-login sidebar header — all now read "Champa" / "Lao PDR Carbon Registry".
- `index.html`: page `<title>`, `theme-color` meta, `og:title`/`twitter:title` updated.
- **Not done**: no real Champa/MAE logo or favicon asset exists yet (`web/public/favicon.png`, `web/public/undp-logo.png` are still UNDP's). The login/homepage hero background image is still a generic stock photo (Sri Lanka's Sigiriya rock), since no Lao PDR photo asset was available. Package names (`web/package.json`, `backend/services/package.json`) renamed to `champa-laos-carbon-registry-*`.

### Landing page overhaul
The homepage was still the raw UNDP demo template rather than a customized Champa page: an "Adoption" section literally advertised other countries (Nigeria, Zimbabwe, Vietnam, Sri Lanka, Namibia, Cote d'Ivoire) evaluating the open-source codebase, a "Demo Site" section invited governments to request a demo via UNDP's country office, and the FAQ was written for prospective adopter governments rather than Champa's actual end users.
- Removed the "Adoption" (`MapAnimation`) and "Demo Site" (`DemoSite`) sections/components entirely.
- Rewrote the FAQ (9 Q&A), Digital Public Good, and D4C partnership copy for Champa/MAE/Decree-on-Carbon-Credits context instead of generic "how to adopt this template" content; the D4C/EBRD/World Bank attribution is now worded as software provenance, not an implied direct partnership.
- Restructured the page so the live registry dashboard leads (right after the hero), matching how a government registry portal (e.g. Indonesia's SRN) puts live data first — the "About this platform" / D4C attribution content moved down near the footer.
- Added an actual **"Browse the Registry"** section on the homepage (`RegistryTable.tsx`): a live, searchable, paginated table backed by a new paginated version of `GET /national/projectManagement/public/search` (now accepts `page`/`size` and supports browsing with an empty query, returning `{ data, total }`).
- Converted the sector and proponent-category breakdowns (and project/credit status) from plain stat-card grids into real donut charts (`react-apexcharts`, already a project dependency but previously unused) with Champa's own color palette — a genuine dashboard visualization, not just a copy-edit.
- Fixed a real bug found while building this: the shared `useConnection().get()` helper auto-unwraps one `response.data` level assuming a `{ data, message }} envelope, which silently discarded the new `total` field. Fixed by reading `total` from `response.response.data.total` (the pattern already used by `userManagementComponent.tsx`), and fixed the pre-existing `/projects/search` page's same single-vs-double unwrap bug.

### New features beyond the base registry
Scanned the codebase against the product requirements and confirmed these were genuinely missing (not just needing configuration), then implemented the highest-priority ones:
- **Public project search** (`GET /national/projectManagement/public/search?q=`, no auth) — searches by registration number or title, returns only non-sensitive fields (registration number, title, sector, collapsed status, proponent org name), capped at 20 results. New public page at `/projects/search`.
- **Security fix found while building the above**: `GET /national/projectManagement/logs?refId=` had a `@CheckPolicies` decorator but was *missing* the `@UseGuards(JwtAuthGuard, PoliciesGuard)` that actually enforces it — meaning any anonymous caller could read any project's audit log by ID. Fixed with proper ownership checks (developer must own the project, certifier must be assigned, DNA/Ministry/regulator roles pass through).
- **Public analytics dashboard** (`GET /national/analytics/public/summary`, no auth) — aggregate-only counts (projects by status/sector, credit totals), reusing existing `AnalyticsService` methods. Homepage `CarbonDashboard.tsx` now fetches this instead of showing hardcoded numbers.
- **Credit cancellation and exchange assignment** — authenticated `PUT /national/programme/cancel` and `PUT /national/programme/assignToExchange` transitions update the programme ledger, owner balances, exchange secondary accounts, audit logs, and public certificate/summary projections. Owners can act only on their own credits; DNA/Ministry users may act across owners, with Ministry sector permission checks.
- **GHG methodology directory** (US-10 equivalent from SRN Indonesia) — did not exist at all upstream. New `MethodologyEntity`/service/controller: public search/filter endpoint (`GET /methodology/public`, no auth) plus admin CRUD guarded to DNA/Ministry roles via CASL. New public page at `/methodology`.
- **USD/LAK currency display toggle** — UI-only, `web/src/Utils/currencyConverter.ts` with a static, hand-maintained `USD_TO_LAK_RATE` constant (**not a live forex feed** — needs periodic manual updates or a real exchange-rate API integration later). Added to the credit balance/retirement tables as a secondary "Est. value" line; the underlying tCO2e quantity and all backend/API data remain USD-only.

## Running Locally

Champa follows the same deployment process as the upstream registry — see the **[Run Services As Containers](./README.md#run-services-as-containers)** section in the main [README.md](./README.md) for the base instructions.

**Verified working end-to-end** (3 August 2026): `docker compose up -d --build` brings up all 5 services (`db`, `national`, `stats`, `replicator`, `web`) healthy. Confirmed via direct testing:
- All 4 seeded Lao PDR accounts (MAE/DNA, Energy Ministry, sample Project Developer, sample VVB/IC) log in successfully with the correct role in their JWT.
- A real project (`POST /national/programme/create`) submits successfully once a valid Lao province is supplied as `geographicalLocation` and a `data:<mimetype>;base64,...` design document is attached.
- The submitting Ministry (matching sectoral scope) and MAE/DNA can both see the submitted project via `POST /national/programme/query`.

Lao-specific setup notes:
- Host port `5432` is remapped to `5433` in `docker-compose.yml` to avoid conflicting with a local Postgres instance — adjust if your environment differs.
- `docker-compose.yml`'s `users.csv`/`organisations.csv` bind mounts point at `./backend/services/users.csv` and `./backend/services/organisations.csv` (the upstream compose file pointed at the repo root, which doesn't have these files — Docker will silently create empty directories there if left unfixed).
- Default local test credentials (see `backend/services/users.csv`): `admin@champa.la` / `energy.admin@champa.la` / `proponent@laogreenenergy.la` / `verifier@bureauveritas-la.com`, all with password `ChampaLaos2026!`. **Change or remove these before any non-local deployment.**
- `LOCATION_SERVICE` is left at its default (`FileLocationService`, reads `regions.csv` etc. at setup) rather than `OPENSTREET` — the `national` service's env block did not have `LOCATION_SERVICE` set to `OPENSTREET` in the base compose file, so it silently used the file-based service; this is why `regions.csv` needed a direct Lao PDR data fix rather than relying on the live-Overpass-API region service that other services reference.

## Known Issues / Follow-up Required

**Architectural: `Programme` vs `ProjectEntity` are disconnected read models.** This is a **pre-existing upstream gap, not something introduced by this fork**. Submitting a project goes through `POST /national/programme/create`, which writes to the `Programme` table — confirmed working, DNA/Ministry can query it and see real data. The `replicator` service (which is supposed to bridge ledger events into `ProjectEntity`) is running and polling correctly, but its `project` table cursor never advances even after a real `Programme` is created — only the `programmes` cursor does.

**Fixed for the new public-facing endpoints**: `GET /national/projectManagement/public/search` and `GET /national/analytics/public/summary` have been repointed to read directly from `Programme` (via new `ProgrammeService.publicSearch()` / `ProgrammeService.getPublicSummary()` methods) instead of the never-populated `ProjectEntity`. Verified end-to-end: a project submitted via `/programme/create` now shows up immediately in both endpoints.

**Still open**: the **existing, pre-fork** internal dashboard widgets ("Total Projects" counter, "View Projects" screen, `ProjectManagementController`'s `query`/`getProjectById`/audit-log endpoints) still read from `ProjectEntity` and were deliberately left untouched — they are core upstream workflow features whose intended relationship to `Programme` wasn't fully clear, and repointing them risked breaking existing certifier/PDD workflows built on `ProjectEntity`'s own audit trail (`ProjectAuditLogType`, `audit_entity`). Recommended next step if this is needed: either wire `ProjectEntity` population directly into `programme.service.ts`'s create/authorize flow (so the two models actually stay in sync), or migrate these internal views to `Programme` as well.

**Operational: `replicator` container needs a restart after a cold `docker compose up`.** Also a **pre-existing upstream bug, not introduced by this fork**. On a fresh `docker compose up` (or after `down -v`), the `replicator` container's first ledger-poll cycle races the `national` container's lazy creation of the ledger tables (`carbondevEvents.programmes`/`company`/`project`/`credit_blocks`) — if `replicator` polls before those tables exist, it logs `relation "programmes" does not exist` once at boot, and a bug in its retry path (`backend/services/src/ledger-replicator/pgsql-replicator.service.ts`, the `retryCountTable += 1; replicateActions;` line — missing the `()` to actually invoke the retry) leaves it permanently stalled at `lastSeq 0`, meaning newly-created Programmes never replicate into the read-side tables the Map tab and other public endpoints query. Symptom: a project submitted via `/programme/create` returns success and is visible via DNA/Ministry-authenticated endpoints, but never appears on the public Map. **Workaround**: `docker compose restart replicator` once, after the stack is fully up — confirmed this replicates cleanly (verified this session: a stuck submission replicated into the `programme` table within 1 second of the restart). Not patched in this fork since it touches core ledger-replication retry logic outside this round's scope; the missing `()` bug is a one-line fix for whoever picks this up next.

**Location data**: only `regions.csv` (provinces) was replaced with real Lao PDR data. `provinces.csv`/`districts.csv`/`dsDivisions.csv`/`cities.csv`/`postalCodes.csv` still model Sri Lanka's administrative hierarchy and were not re-entered (Lao PDR has ~148 districts; this is a data-entry task, not investigated further given time constraints — confirm first whether any user-facing flow actually depends on that finer granularity before doing the work).

**Lao translation coverage**: ~846 of ~4,066 UI strings, covering navigation/login/common plus general UI-chrome namespaces (organisation/user management, credit transfers, NDC actions, reporting, co-benefit questionnaires). The remaining ~3,220 strings are concentrated in deep technical/legal MRV namespaces (PDD, monitoring/validation/verification reports, safeguards, GHG inventory, project detail views, etc.) that were intentionally left in English pending native Lao speaker review — see Customizations above for the full namespace list.

**No real logo/photo assets**: favicon, header logo, and hero background images are still UNDP/generic stock — cosmetic only, but visible on every page.

## Credits

Based on the **UNDP National Carbon Registry**, a Digital Public Good developed under **Digital for Climate (D4C)** — a collaboration between UNDP, EBRD, UNFCCC, IETA, ESA, and the World Bank Group.
