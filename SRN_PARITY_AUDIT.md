# SRN Indonesia vs Champa — Feature Parity Audit

Source: live crawl of https://srnindonesia.kemenlh.go.id/ (scout agent, this session) plus
manual review of pasted SRN screenshots/data. Raw findings used to plan Champa's build-out.
Items marked **✅ Built** exist in Champa as of this commit; **⚠️ Partial** means a
simplified/generic version exists; **❌ Gap** means nothing exists yet.

## 1. Top navigation bar

SRN: `Home | Map | About (dropdown) | Instruments (dropdown) | NDC Achievement` + language switch + Register/Login.

| Item | Champa status |
|---|---|
| Home | ✅ Built |
| Map | ✅ Built — switched from Mapbox (needed a paid token never configured) to Leaflet + OpenStreetMap, the exact same free stack SRN itself uses. Renders real interactive tiles + province markers, verified live. |
| About (dropdown: About SRN, FAQ) | ⚠️ Partial — one flat static page, not a dropdown with sub-pages. |
| Instruments (dropdown: Methodology, Roster of Expert, Validation/Verification Agency, Module, Registrasi ProKlim) | ⚠️ Partial — Methodology links to the real Methodology Directory. **Validation/Verification Agency now built** — real public endpoint listing active `INDEPENDENT_CERTIFIER` companies (public-safe fields only), wired into the Instruments page. Roster of Expert still says "not yet established" — no backing data model exists for individual experts. |
| NDC Achievement | ✅ Built — 6 sector tabs (All/Energy/IPPU/Agriculture/Forestry/Waste), `NdcTargetEntity` now has a required `sector` field, "All" is a real computed aggregate across the 5 sectors, 2 trend charts (baseline vs achieved; reduction achievement) driven by real per-sector yearly data. |

## 2. Homepage tabs (Mitigation / Proklim / Adaptation / Resources)

| SRN tab | Champa status |
|---|---|
| Mitigation NEK (total projects, General/Technical/Validation/Verification/SPE counts, PTBAE-PU trading, Emission Reduction Certificate states, proponent/SPE breakdowns by registry scheme + category, sector breakdowns, paginated 5-tab-filterable project table) | ⚠️ Partial — Champa's Mitigation tab has total projects/credits, status donut, sector donut, proponent-by-role donut, live paginated project search. **Missing**: General/Technical/Validation/Verification/SPE stage-count granularity (Champa's `Programme` model doesn't track that), registry-scheme breakdown (SPEI/JCM/GS/VERRA — not applicable, Champa is a single-country registry with no external registry-scheme concept). PTBAE-PU-style ceiling/trading data **is built** but currently sits under Champa's "Resources" tab instead of "Mitigation" — placement mismatch to fix. |
| Sub-tab: Mitigation Appreciation (41 projects, different breakdown) | ❌ Gap — Indonesia-internal incentive scheme, no clear Lao equivalent, not attempted. |
| Sub-tab: REDD++ (34-province grid, forest-carbon specific) | ❌ Gap — deliberately not built this round; most defensible one to build later given Laos's real forestry sector. |
| Proklim (village climate program, 10,926 entries in SRN, its own Adaptation-style sub-tab with Year/Activity/Category/Detail table and an "Adaptation Action Percentage" donut by category: Health, Ecosystem Resilience, Multi-sector, Infrastructure, Coastal and Small Islands, Energy Self-reliance, Food Security, Urban and Rural Settlements, Water Security) | ⚠️ Deliberately generalized — built as **"Community Climate Programs"**, explicitly NOT named "Proklim" (real Indonesian government program name, would misrepresent Laos). Its own category field (Adaptation/Mitigation/Both) is a different concept (program impact type, not sector) and intentionally left as-is. |
| Adaptation | ✅ Built — submit/approve workflow, sector+stage donuts, public table. **Category taxonomy now matches SRN's 9-category set** (Health, Ecosystem Resilience, Multi-sector, Infrastructure, Coastal and Small Islands, Energy Self-reliance, Food Security, Urban and Rural Settlements, Water Security), replacing the old narrower 6-value set. |
| Resources: Financial Support Received | ✅ Built (`ClimateFinanceEntity`) |
| Resources: Technology Development & Transfer Support Received | ✅ Built (`TechnologyTransferEntity`) |
| Resources: Capacity Building Support Received | ✅ Built (`CapacityBuildingEntity`) |

## 3. Project detail page

SRN's "See detail" page has a 5-stage progress timeline (General/Technical/Validation/Verification/Finalization, each with sub-item status), summary fields, an action-details table, 4 document sections (DRAM/DRAM Validation/LCAM/LCAM Verification), and a **Village/Sub-district Vulnerability Data** section sourced from Indonesia's own "SIDIK" dataset.

**❌ Gap, deliberately not built**: (1) it's an enhancement to Champa's *core* Programme detail view, the domain explicitly denylisted from modification this session; (2) the vulnerability section requires a specific Indonesian government dataset with no Lao equivalent — building it means fabricating per-village statistics, which won't happen. The timeline + document-status parts alone are legitimate and buildable without fabrication if scoped separately.

## 4. Map page

Built with Leaflet + OpenStreetMap (not Mapbox). Search box, Activity Type filter, Province filter (34 provinces), interactive markers with counts, legend totals per category.

**Champa status**: ✅ Built. Backend endpoint (`GET /national/projectManagement/public/mapSummary`) aggregates real project counts per Lao province with real seeded coordinates. Rendering layer switched from `mapbox-gl` (needed a paid token never configured) to Leaflet + OpenStreetMap — verified live: real interactive tiles + province markers render correctly.

## 5. NDC Achievement — sector tabs and charts

Sector tabs (All/Energy/IPPU/Agriculture/Forestry/Waste), each with different Baseline/Emission Level/Reduction/2030 Target/Contribution % numbers, plus 2 trend charts (emission trend vs baseline; reduction achievement claimed vs verified).

**✅ Built.** `NdcTargetEntity` now has a required `sector` field (5-value enum matching SRN's real sectors). Public summary endpoint accepts `?sector=` and computes a real "All" aggregate (sum of each sector's latest-year figures, contribution % recomputed from the summed baseline/target/achieved) when omitted. A new public series endpoint returns yearly baseline/achieved time series per sector. Frontend has all 6 tabs wired to real API data, plus 2 `react-apexcharts` trend charts. Verified live with seeded demo data across all 5 sectors and 2 years each.

---

## Ranked remaining gaps (value/effort)

1. ~~Map rendering~~ — done (Leaflet + OpenStreetMap).
2. ~~NDC Achievement sector breakdown~~ — done (schema change + sector tabs + trend charts).
3. ~~Adaptation / Community Program category taxonomy~~ — done (`AdaptationSector` now matches SRN's 9-category set).
4. ~~Validation/Verification Agency real listing~~ — done (public endpoint + Instruments page wiring).
5. ~~PTBAE-PU tab placement~~ — done (Emission Ceiling & Trading display moved to the Mitigation tab).
6. **Project detail stage timeline** — legitimate subset (timeline + documents, not vulnerability data), needs careful scoping to avoid touching core approval logic.
7. **About/Instruments as real dropdowns** with sub-pages instead of flat pages.
8. **REDD++** — plausible real Lao equivalent (forestry carbon), future scope.
9. **Mitigation Appreciation, Roster of Expert, Registrasi ProKlim link** — no clear Lao equivalent or backing data source; would require fabrication.

