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
- **Fully translated to Lao**: `common`, `nav`, `login`, `forgotPassword`, `resetPassword`, `passwordReset` (all keys), plus the short labels in `dashboard` (83/196 keys) and `homepage` (51/83 keys).
- **English fallback placeholder** (`lo.json` = copy of `en.json`): the remaining 39 namespaces, and the long-form prose/tooltip strings in `dashboard`/`homepage` that were not translated to avoid guessing inaccurate Lao for dense technical phrasing without native review.
- Approximately 192 of ~4,000 total UI strings are genuinely translated. **This is a real, ongoing translation task, not a one-time technical fix** — budget for native Lao speaker review before production use.

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

### New features beyond the base registry
Scanned the codebase against the product requirements and confirmed these were genuinely missing (not just needing configuration), then implemented the highest-priority ones:
- **Public project search** (`GET /national/projectManagement/public/search?q=`, no auth) — searches by registration number or title, returns only non-sensitive fields (registration number, title, sector, collapsed status, proponent org name), capped at 20 results. New public page at `/projects/search`.
- **Security fix found while building the above**: `GET /national/projectManagement/logs?refId=` had a `@CheckPolicies` decorator but was *missing* the `@UseGuards(JwtAuthGuard, PoliciesGuard)` that actually enforces it — meaning any anonymous caller could read any project's audit log by ID. Fixed with proper ownership checks (developer must own the project, certifier must be assigned, DNA/Ministry/regulator roles pass through).
- **Public analytics dashboard** (`GET /national/analytics/public/summary`, no auth) — aggregate-only counts (projects by status/sector, credit totals), reusing existing `AnalyticsService` methods. Homepage `CarbonDashboard.tsx` now fetches this instead of showing hardcoded numbers.
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

**Architectural: `Programme` vs `ProjectEntity` are disconnected read models.** This is the single most important finding from testing, and is a **pre-existing upstream gap, not something introduced by this fork**. Submitting a project goes through `POST /national/programme/create`, which writes to the `Programme` table — confirmed working, DNA/Ministry can query it and see real data. However, the *new* public search and public analytics endpoints added in this fork (and, it turns out, several of the **existing** private dashboard widgets, like "Total Projects"/"View Projects") read from a separate `ProjectEntity` table that has no confirmed write path from `/programme/create` in this codebase version. The `replicator` service (which is supposed to bridge ledger events into `ProjectEntity`) is running and polling correctly, but its `project` table cursor never advances even after a real `Programme` is created — only the `programmes` cursor does. **Practical impact**: newly submitted projects will correctly appear in DNA/Ministry review queues (`/programme/query`), but will *not* appear in the public search, public dashboard, or the "View Projects" screen until this data-model gap is bridged. Recommended next step: either wire `ProjectEntity` population directly into `programme.service.ts`'s create/authorize flow, or repoint the new public-facing endpoints at `Programme` instead of `ProjectEntity`.

**Location data**: only `regions.csv` (provinces) was replaced with real Lao PDR data. `provinces.csv`/`districts.csv`/`dsDivisions.csv`/`cities.csv`/`postalCodes.csv` still model Sri Lanka's administrative hierarchy and were not re-entered (Lao PDR has ~148 districts; this is a data-entry task, not investigated further given time constraints — confirm first whether any user-facing flow actually depends on that finer granularity before doing the work).

**Lao translation coverage**: ~192 of ~4,000 UI strings, concentrated in navigation/login/common. Needs a dedicated translation pass with native review before production use.

**No real logo/photo assets**: favicon, header logo, and hero background images are still UNDP/generic stock — cosmetic only, but visible on every page.

## Credits

Based on the **UNDP National Carbon Registry**, a Digital Public Good developed under **Digital for Climate (D4C)** — a collaboration between UNDP, EBRD, UNFCCC, IETA, ESA, and the World Bank Group.
