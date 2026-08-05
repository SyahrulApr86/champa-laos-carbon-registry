# W1 deterministic synthetic-demo seeder

Scenario: `champa-parity-demo-v1`, fixed seed `20260805`, coverage 2021–2026.
All generated values are synthetic demonstration data, never official Lao PDR
statistics, certificates, market activity, people, organisations, or policy.

`CanonicalCertificateDemoLoader` implements the `W2SeedLoader` contract for
the final certificate-lot, portion, and ledger tables. It stores the scenario
hash in existing lot provenance, makes an equal hash a no-op, and rejects an
incomplete or non-conserving scenario on verification. Replacement deletes
only lots explicitly marked with this scenario ID (and their portions/events),
then writes the deterministic canonical ledger; it never substitutes live
data.

Run only against a disposable database explicitly marked as demo:

```sh
cd backend/services
CHAMPA_DEMO_DATABASE=true \
CHAMPA_DEMO_SEED_CONFIRMATION=I_UNDERSTAND_THIS_WRITES_SYNTHETIC_DEMO_DATA \
NODE_ENV=development RUN_MODULE=demo-seeder yarn start
```

The command refuses `NODE_ENV=production`, a missing demo marker, or a missing
confirmation. Its default `plan` mode does **not** write a database; it prints
the deterministic coverage report. To replace just the canonical certificate
scenario, add `CHAMPA_DEMO_SEED_MODE=replace`:

```sh
CHAMPA_DEMO_DATABASE=true \
CHAMPA_DEMO_SEED_CONFIRMATION=I_UNDERSTAND_THIS_WRITES_SYNTHETIC_DEMO_DATA \
CHAMPA_DEMO_SEED_MODE=replace NODE_ENV=development RUN_MODULE=demo-seeder yarn start
```

Only `plan` and `replace` are accepted. Legacy additive mode is rejected.
