# SRN Indonesia vs Champa — Feature Parity Audit

Two audit rounds fed this document: (1) an initial scout crawl of srnindonesia.kemenlh.go.id plus
manually reviewed screenshots, and (2) a deep, 2100-line technical audit (`laporan-audit-srn-ndc.md`
+ `bukti-screenshot-srn.md` screenshot catalog, `.audit/` raw JSON/PNG evidence) covering every public
route, API endpoint, DOM interaction, and data shape SRN exposes. Round 2's findings drove a second
build pass. Items marked **✅ Built** exist in Champa as of this commit; **⚠️ Partial** means a
simplified/generic version exists; **❌ Gap** means nothing exists; each gap states why.

## 1. Top navigation bar

SRN: `Home | Map | About (dropdown) | Instruments (dropdown) | NDC Achievement` + language switch + Register/Login.

| Item | Champa status |
|---|---|
| Home | ✅ Built |
| Map | ✅ Built — Leaflet + OpenStreetMap (SRN's own stack, not Mapbox). Real interactive tiles + province markers. **Activity Type filter** (Mitigation/Adaptation/Community Programs/REDD+) and a province search box added — switches which real domain's data renders on the map, verified across all 4 domains. |
| About (dropdown: About SRN, FAQ) | ✅ Built — real dropdown menu (About Champa, FAQ). |
| Instruments (dropdown: Methodology, Roster of Expert, Validation/Verification Agency, Module, Registrasi ProKlim) | ✅ Built as a real dropdown (Methodology Directory, Instruments Overview, Validation/Verification Agencies). **Roster of Expert now a real data model** (`ExpertEntity`) with a guarded submission form and public searchable listing — replaced the earlier permanent stub. **Module** (downloadable guidance documents) built as a new section with a guarded upload form and public listing. VVA listing has a **per-agency detail drill-down page** (certificate number, validity, scope coverage, DRAM/LCAM applicability, SPEI/PTBAE-PU eligibility — honest empty fields until entered). |
| NDC Achievement | ✅ Built — 6 sector tabs (All/Energy/IPPU/Agriculture/Forestry/Waste), `NdcTargetEntity` has a required `sector` field, "All" is a real computed aggregate. 2 trend charts. **Claimed vs Verified distinction added**: `NdcTargetEntity` now has an optional `claimedEmissions` field alongside the existing verified figure; chart 2 renders a 2-series grouped bar (Claimed/Verified) when both are entered, falling back to single-series when claimed data isn't present — never fabricates a claimed figure. |

## 2. Homepage tabs (Mitigation / Proklim / Adaptation / Resources)

| SRN tab | Champa status |
|---|---|
| Mitigation NEK — 6 doughnut charts (Proponents by Registry Schema, Proponent Category, SPE by Registry Schema, Verified Emission Reduction by Proponent Type, SPE by Sectors, Verified Emission Reduction by Sector), PTBAE-PU stats, Emission Reduction Certificate states, paginated project table | ✅ Built to real 6-chart parity: Champa now has Project Status, Credit Status, Sector Distribution, Proponent Distribution, **Verified Emission Reduction by Sector**, and **Verified Emission Reduction by Proponent Type** (both new — backend `getPublicSummary()` extended with real `creditsBySector`/`creditsByProponentRole` breakdowns). Registry-scheme donuts (SPEI/JCM/GS/VERRA) remain N/A — Champa is a single-country registry with no external registry-scheme concept, not a gap. |
| SPE Certificate registry (SRUK) — ~27-field paginated certificate table (account holder, activity, sector, vintage, status, issued/available/retired/cancelled units) | ✅ Built — new "Emission Reduction Certificates" table under the Mitigation tab, sourced from real `Programme` credit-issuance fields (not a fabricated parallel entity). `cancelledUnits` is honestly always 0 — no credit-cancellation flow exists in this fork yet. |
| PTBAE-PU — 3 sub-tabs (Series, Carbon Exchange Transactions, Participants) | ✅ Built — `EmissionCeilingEntity` extended with `seriesName`/`sector`; new `EmissionParticipantEntity` for individual facilities; 3 real paginated sub-tabs under "Emission Ceiling & Trading". Seller/buyer company names real-joined in for Transactions. |
| Sub-tab: Mitigation Appreciation (41 projects, smaller-scale recognized actions) | ✅ Built as **"Recognized Mitigation Actions"** — deliberately generic name, no reference to Indonesia's NEK/SPE scheme. Real entity, guarded create, public summary (KPI + status donut + proponent-type donut) + paginated table + submission form. |
| Sub-tab: REDD++ (34-province grid) | ✅ Built as a "REDD+" tab — real 18-province grid (Lao PDR's actual provinces), real project count/forest area/emission reduction aggregates, honest empty states, guarded submission form. |
| Proklim (village climate program) | ⚠️ Deliberately generalized as **"Community Climate Programs"** — not named "Proklim" (Indonesia-specific program). **New: public detail page** (`/public/community/:programId`) added this round, matching SRN's detail-page layout (summary sidebar + description), reachable from the tab's table. |
| Adaptation | ✅ Built — submit/approve workflow, 9-category taxonomy matching SRN exactly, sector+stage donuts, public table. **New: public detail page** (`/public/adaptation/:adaptationId`) with an honest 3-step stepper (Submitted/Under Review/Approved, since `AdaptationStage` is a real tracked workflow, unlike Community Programs which only has a state field). |
| Resources: Financial / Technology Transfer / Capacity Building | ✅ Built (`ClimateFinanceEntity`, `TechnologyTransferEntity`, `CapacityBuildingEntity`), all SRN fields present. |

## 3. Project / activity detail pages

SRN's detail pages (Mitigation NEK, ProKlim, Adaptation) share a 5-stage visual stepper (General/Technical/Validation/Verification/Finalization with per-sub-item status), a summary sidebar, and (for ProKlim/Adaptation) a **Village/Sub-district Vulnerability Data** panel sourced from Indonesia's "SIDIK" dataset.

**✅ Built, all 3 domains** (`/public/project/:programmeId`, `/public/community/:programId`, `/public/adaptation/:adaptationId`): each shows an honest stepper reflecting the REAL number of workflow states that domain's entity actually tracks — 3 steps for Programme/Adaptation (both have a real multi-stage review workflow), no stepper for Community Programs (its `status` field is a state, not a progression). SRN's 5-stage breakdown was investigated and found to be presentational subdivision over ~4 regulatory phases, not evidence Champa is missing real granularity — replicating it would mean fabricating sub-task approval states Champa's data model doesn't have. The **Village/Sub-district Vulnerability Data** panel is omitted entirely on all 3 pages — no Lao equivalent dataset exists; building it would mean fabricating per-village statistics.

## 4. Map page

Built with Leaflet + OpenStreetMap. Activity Type filter (Mitigasi/Adaptasi/Proklim), Province filter, Search Activities box, per-activity GeoJSON point markers.

**✅ Built.** Backend aggregates real activity counts per Lao province across **4 domains** (Mitigation/Adaptation/Community/REDD+) via `?activityType=`, factored through a shared Region-coordinate join helper. Frontend has a real Activity Type selector and a province-name search/filter box. SRN's per-activity-point markers (vs. Champa's province-aggregate markers) remain a scale difference, not fabricated — Champa's map data model is honestly aggregate-level.

## 5. NDC Achievement — sector tabs and charts

**✅ Built**, including the Claimed vs Verified distinction (see section 1). All 6 sector tabs, both trend charts, real per-sector data entry via the DNA/Ministry form.

## 6. Login / registration

SRN's login form has a distorted-text CAPTCHA image + refresh button, plus a Google OAuth button.

**✅ Built**: real self-hosted SVG CAPTCHA (`svg-captcha`, in-memory single-use challenges, no external API key), integrated as a pre-check in the login flow, verified end-to-end via a real browser login. **Google OAuth explicitly NOT built** — no real Google Cloud OAuth client ID/secret exists for this project; a non-functional "Login with Google" button would be dishonest UI rather than an honest gap. Requires real credentials from the client before it can be built.

Registration form's province dropdown was checked against a scout report claiming hardcoded Zimbabwe provinces — verified as a **false positive** (a dead, unused `provinces` constant existed in the code but the actual rendered dropdown already used `regionsList`, fetched live from the backend's already-Lao-scoped `regions.csv` seed). The dead constant was removed as cleanup.

---

## Explicit exceptions: items with no honest Lao equivalent

Building the following as literal 1:1 copies of SRN would require inventing facts about Lao PDR
government programs, datasets, institutions, or credentials that do not exist — a hard line, not a
scope shortcut:

- **Registrasi ProKlim** deep link — "Proklim" (Program Kampung Iklim) is a specific, named Indonesian
  government program. Champa's Community Climate Programs module is the deliberately-generic
  equivalent concept; a literal "Registrasi ProKlim" link/form would misrepresent a program Laos does
  not run.
- **Village/Sub-district Vulnerability Data** (SIDIK-sourced) on all activity detail pages — Indonesia's
  own vulnerability-index dataset (IKA/IKS values, forest fire proneness) has no Lao PDR equivalent.
  Omitted entirely rather than fabricating indices.
- **Google OAuth login** — requires real Google Cloud OAuth client credentials from the client; cannot
  be faked with a non-functional button.
- **SRN's own documented data-quality bugs** (audit report section 24: FAQ UI/API mismatch, map count
  discrepancies, a mis-scaled `speBySector` total, NDC forecast years rendering 0 instead of "not yet
  available", inconsistent pagination shapes across endpoints) were read and deliberately NOT
  replicated — Champa's equivalents use honest null/empty states and consistent response shapes instead.

Every other page, tab, table, chart, filter, and data view identified across both audit rounds now has
a working, honestly-scoped Lao equivalent.
