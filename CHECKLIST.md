# SRN → Champa Feature Checklist

Cross-references every entry in `bukti-screenshot-srn.md`'s 25-item screenshot matrix and every
chart/table/field described in `laporan-audit-srn-ndc.md` against Champa's current build. `[x]` =
built and verified live; `[~]` = built but visually simplified vs SRN (fix scoped below); `[ ]` =
not yet built (reason stated); explicit exceptions are marked and never silently skipped.

## Screenshot catalog (25 entries)

- [x] 1. Home — Mitigation NEK stable (KPI/PTBAE/SPE cards, 6 doughnuts, table) — `CarbonDashboard.tsx`, 6-donut parity + stage sidebar + certificate panel built this round
- [x] 2. Home — Proklim (table, doughnut, pagination) — `CommunityProgramTab.tsx`
- [x] 3. Home — Adaptation (categories, doughnut, table) — `AdaptationTab.tsx`, 9-category taxonomy
- [~] 4. Home — Resources (grouped bar by sector, pie by channel, filter dimension, 3 tables) — tables built (`ResourcesTab.tsx`), but chart visual style (multi-series bar w/ horizontal scroll + IDR/Dollar toggle, pie w/ Channel dropdown + % legend) needs a rebuild pass to match SRN's exact layout — **in progress this round**
- [x] 5. Home — Mitigation Appreciation (KPI, doughnut, table) — built as "Recognized Mitigation Actions" (honest generic name)
- [x] 6. Home — REDD++ (province selector) — built as "REDD+" tab, 18 real provinces
- [x] 7. Map (Leaflet, legend, Activity Type filter, Province filter, search, zoom) — dedicated `/map` page this round + legend + 4-domain Activity Type filter
- [x] 8. NDC — All (KPI, sector filter, combo chart, grouped bar, contribution chart) — 6 sector tabs + 2 charts built; **card visual style + sector-pill style need a rebuild pass to match SRN exactly — in progress this round**
- [x] 9. NDC — IPPU (sector filter changes data) — verified live, sector switch works correctly (and does NOT have SRN's own "still says Total All Sectors" label bug)
- [x] 10. About SRN (background, purpose, role, policy basis) — `about.tsx`
- [x] 11. FAQ/contact form — homepage-embedded FAQ accordion + contact form
- [x] 12. Methodology (Approved/Submission Process tabs, search/filter/status) — `methodology.tsx`
- [x] 13. Roster of Expert (search, filter/sort, table, pagination) — built this round, real `ExpertEntity`
- [x] 14. Validation/Verification Agency (filter, search, list, See Detail) — `VerificationAgencyList.tsx`
- [x] 15. Detail LVV (certificate, validity, contact, scope, DRAM/LCAM) — `verificationAgencyDetail.tsx`, built this round
- [x] 16. Module (PDF list, search, metadata, download) — `GuidanceDocumentList.tsx`, built this round
- [x] 17. Carbon Registry/SPE (heading, stats, search/sort/filter, certificate table) — `CertificateRegistryTable.tsx`, built this round, sourced from real Programme credit data
- [x] 18. PTBAE-PU Series (tab, items per page, table) — built this round, `EmissionCeilingTradingTabs.tsx`
- [x] 19. Carbon Exchange Transactions (tab, Date/Series/Amount/Value) — built this round
- [x] 20. PTBAE-PU Participants (tab, Power Unit/Company/Capacity/Year) — built this round
- [x] 21. Registrasi proponent (3-step: Lembaga/Narahubung/Akun) — `addNewCompanyComponent.tsx` (dead Zimbabwe-provinces code removed; live dropdown already Lao-scoped)
- [x] 22. Login proponent (username/password, CAPTCHA, forgot password) — real self-hosted CAPTCHA built this round; Google OAuth explicit exception (no credentials)
- [x] 23. Detail Mitigation NEK (progress stepper, status, docs, vulnerability) — `publicProjectDetail.tsx`, honest 3-step (not fabricated 5-stage); vulnerability panel explicit exception
- [x] 24. Detail ProKlim (enumerator, period, objectives, status, region) — `publicCommunityDetail.tsx`, built this round
- [x] 25. Detail Adaptation (organisation, period, objectives, category/location) — `publicAdaptationDetail.tsx`, built this round

## Report chart/data inventory (laporan-audit-srn-ndc.md sections 6–23)

- [x] Mitigation NEK 6 doughnuts (Proponents/Category/SPE-by-schema/Verified-by-proponent/SPE-by-sector/Verified-by-sector) — full 6-chart parity this round (registry-scheme donuts N/A, single-country registry)
- [x] Mitigation NEK stage sidebar (General/Technical/Validation/Verification/SPE-style counts) — built this round using Champa's real `ProgrammeStage` values (New/AwaitingAuthorization/Authorised/Approved/Rejected), not fabricated Indonesia-specific sub-stages
- [x] Emission Reduction Certificate panel (Issued/Available/Retired/Cancelled/Assigned) — built this round (Cancelled/Assigned honestly 0/N/A, no such flow exists)
- [x] PTBAE-PU stats (Units/Trading/Companies/Power Units/Daily Trading) — `EmissionCeilingTradingTabs.tsx`
- [x] Map GeoJSON-equivalent province aggregation, Activity Type categories — built this round
- [x] NDC 6-sector filter + 2 charts (combo baseline/emission, grouped claimed/verified) — built; claimed/verified distinction added this round
- [ ] NDC sector-pill visual style (green-filled active pill) — **gap, fixing this round**
- [ ] NDC 3-card KPI row visual style (white Mitigation Actions card, white Inventory card, 2-tone green Contribution card) — **gap, fixing this round**
- [x] Resources: Financial/Technology/Capacity Building tables, all fields — built
- [ ] Resources chart visual style (multi-series scrollable bar + IDR/Dollar-equivalent toggle; pie + Channel dropdown + % legend) — **gap, fixing this round**
- [x] Roster of Expert, LVV detail, Module, SPE certificate, PTBAE 3-tabs — all built this round
- [x] Registration/Login forms — verified, CAPTCHA added

## Explicit exceptions (documented in SRN_PARITY_AUDIT.md, not silent gaps)

- [ ] Registrasi ProKlim deep link — Indonesia-specific program name, no Lao equivalent
- [ ] Village/Sub-district Vulnerability Data (SIDIK-sourced) — no Lao dataset exists
- [ ] Google OAuth login — no real client credentials available
- [ ] SRN's own documented data-quality bugs (section 24) — deliberately not replicated

## Production-scale seed data

- [ ] Comprehensive seed script simulating months of real production usage (dozens of programmes/
  adaptation projects/community programs/REDD+ entries/certificates/experts/PTBAE participants
  across realistic date ranges) so every page shows SRN-comparable data density when demoed —
  **not yet built, this round's deliverable**
