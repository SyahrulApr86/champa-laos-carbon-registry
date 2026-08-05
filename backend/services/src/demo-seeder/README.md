# W1 deterministic synthetic-demo seeder

Scenario: `champa-parity-demo-v1`, fixed seed `20260805`, coverage 2021–2026.
All generated values are synthetic demonstration data, never official Lao PDR
statistics, certificates, market activity, people, organisations, or policy.

The scenario generator is deliberately schema-neutral. W2 must implement the
`W2SeedLoader` interface in `scenario.ts` for the final certificate-lot,
portion, and ledger tables. It receives stable records, IDs, provenance and
coverage map; it must preserve the W0 conservation rules and never substitute
live data. This avoids W1 pre-empting W2 migrations.

Run only against a disposable database explicitly marked as demo:

```sh
cd backend/services
CHAMPA_DEMO_DATABASE=true \
CHAMPA_DEMO_SEED_CONFIRMATION=I_UNDERSTAND_THIS_WRITES_SYNTHETIC_DEMO_DATA \
NODE_ENV=development RUN_MODULE=demo-seeder yarn start
```

The command refuses `NODE_ENV=production`, a missing demo marker, or a missing
confirmation. It is not a normal application startup command. Before a final
load, run the scenario test twice and compare the reported SHA-256 hash.
