import { createHash } from "crypto";

/**
 * W1 owns this source-only scenario.  It intentionally contains no TypeORM
 * entities: W2 is the schema owner for lots, portions and ledger events.
 */
export const DEMO_SCENARIO = {
  id: "champa-parity-demo-v1",
  datasetKind: "demo_synthetic",
  scenario: "Champa registry demonstration",
  sourceType: "synthetic_demo",
  sourceLabel: "Champa W1 deterministic seed v1",
  methodologyVersion: "champa-parity-demo-v1",
  seed: 20260805,
  asOf: "2026-08-05T00:00:00Z",
  periodStart: "2021-01-01",
  periodEnd: "2026-12-31",
} as const;

export const DEMO_DISCLOSURE =
  "Synthetic demonstration data, not official Lao PDR statistics, legal authorisation, market activity, or certificate records. Scenario: Champa registry demonstration. As of: 2026-08-05T00:00:00Z. Coverage: 2021–2026.";

export const DEMO_MINIMUMS = {
  organisations: 180,
  programmes: 240,
  certificateLots: 720,
  ledgerEvents: 2000,
  publicCertificateRows: 300,
  ceilingParticipants: 220,
  marketTrades: 180,
  mapFeatures: 450,
  communityActions: 120,
  adaptationActions: 120,
  reddPlus: 18,
  resources: 360,
  methodologies: 20,
  experts: 75,
  agencies: 30,
  documents: 40,
} as const;

export type DemoRecordKind = keyof typeof DEMO_MINIMUMS | "ndcObservations";

export interface DemoProvenance {
  record_id: string;
  dataset_kind: "demo_synthetic";
  scenario: string;
  source_type: "synthetic_demo";
  source_label: string;
  as_of: string;
  period_start: string;
  period_end: string;
  methodology_version: string;
  quality_status: "estimated_demo";
  visibility: "public" | "withheld" | "not_applicable";
}

export interface DemoSeedRecord extends DemoProvenance {
  kind: DemoRecordKind;
  ordinal: number;
  year: number;
  unit: string | null;
  availability: "available" | "not_available" | "not_applicable";
  state?: string;
  parent_record_id?: string;
  tags: string[];
}

export interface W2SeedLoader {
  /** W2 implements these operations against its final entity/ledger schema. */
  getAppliedScenarioHash(scenarioId: string): Promise<string | null>;
  replaceSyntheticScenario(scenario: DemoSeedScenario): Promise<void>;
}

export interface DemoSeedScenario {
  version: string;
  disclosure: string;
  records: readonly DemoSeedRecord[];
  counts: Record<DemoRecordKind, number>;
  featureCoverage: Record<string, string[]>;
  hash: string;
}

export interface DemoSeedLoadResult {
  status: "loaded" | "unchanged";
  hash: string;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const STATES = ["Submitted", "Under review", "Authorised", "Approved / active", "Rejected"];
const LOT_STATES = ["AVAILABLE", "ASSIGNED_TO_EXCHANGE", "WITHHELD", "RETIRED", "CANCELLED"];
const FEATURES = Array.from({ length: 25 }, (_, index) => `F${String(index + 1).padStart(2, "0")}`);

function stableId(kind: string, ordinal: number): string {
  return `demo-${kind}-${String(ordinal).padStart(4, "0")}`;
}

function record(
  kind: DemoRecordKind,
  ordinal: number,
  rand: () => number,
  attributes: Partial<DemoSeedRecord> = {}
): DemoSeedRecord {
  const year = 2021 + Math.floor(rand() * 6);
  return {
    record_id: stableId(kind, ordinal),
    kind,
    ordinal,
    year,
    dataset_kind: "demo_synthetic",
    scenario: DEMO_SCENARIO.scenario,
    source_type: "synthetic_demo",
    source_label: DEMO_SCENARIO.sourceLabel,
    as_of: DEMO_SCENARIO.asOf,
    period_start: `${year}-01-01`,
    period_end: `${year}-12-31`,
    methodology_version: DEMO_SCENARIO.methodologyVersion,
    quality_status: "estimated_demo",
    visibility: ordinal % 37 === 0 ? "withheld" : "public",
    unit: "records",
    availability: ordinal % 41 === 0 ? "not_available" : "available",
    tags: [],
    ...attributes,
  };
}

export function buildDemoSeedScenario(): DemoSeedScenario {
  const rand = mulberry32(DEMO_SCENARIO.seed);
  const records: DemoSeedRecord[] = [];
  const counts = {} as Record<DemoRecordKind, number>;

  (Object.keys(DEMO_MINIMUMS) as Array<keyof typeof DEMO_MINIMUMS>).forEach((kind) => {
    const total = DEMO_MINIMUMS[kind];
    counts[kind] = total;
    for (let ordinal = 1; ordinal <= total; ordinal += 1) {
      const isLot = kind === "certificateLots";
      const isLedger = kind === "ledgerEvents";
      records.push(record(kind, ordinal, rand, {
        unit: isLot || isLedger ? "tCO2e" : kind === "marketTrades" ? "LAK" : "records",
        state: isLot ? LOT_STATES[(ordinal - 1) % LOT_STATES.length] : isLedger ? ["ISSUED", "TRANSFERRED", "RETIRED", "CANCELLED", "ASSIGNED_TO_EXCHANGE", "REVERSED"][(ordinal - 1) % 6] : STATES[(ordinal - 1) % STATES.length],
        parent_record_id: isLedger ? stableId("certificateLots", ((ordinal - 1) % DEMO_MINIMUMS.certificateLots) + 1) : undefined,
        tags: ["synthetic", `year-${2021 + ((ordinal - 1) % 6)}`],
      }));
    }
  });

  // NDC needs a complete 2021–2026 supported-sector series plus the 2030 target.
  const ndcSectors = ["Energy", "Agriculture", "Forestry", "Waste", "Transport", "Industry"];
  let ndcOrdinal = 1;
  for (const sector of ndcSectors) {
    for (const year of [2021, 2022, 2023, 2024, 2025, 2026, 2030]) {
      records.push(record("ndcObservations", ndcOrdinal++, rand, {
        year,
        period_start: `${year}-01-01`,
        period_end: `${year}-12-31`,
        unit: "tCO2e",
        availability: year === 2025 && sector === "Industry" ? "not_available" : "available",
        tags: ["synthetic", "ndc", `sector-${sector.toLowerCase()}`, `year-${year}`],
      }));
    }
  }
  counts.ndcObservations = ndcOrdinal - 1;

  const featureCoverage = FEATURES.reduce<Record<string, string[]>>((coverage, feature, index) => {
    const primaryKind = (Object.keys(DEMO_MINIMUMS)[index % Object.keys(DEMO_MINIMUMS).length]) as DemoRecordKind;
    coverage[feature] = [stableId(primaryKind, 1), stableId(primaryKind, Math.min(2, DEMO_MINIMUMS[primaryKind] || 1))];
    return coverage;
  }, {});
  const canonical = JSON.stringify({ version: DEMO_SCENARIO.id, records, featureCoverage });
  return {
    version: DEMO_SCENARIO.id,
    disclosure: DEMO_DISCLOSURE,
    records,
    counts,
    featureCoverage,
    hash: createHash("sha256").update(canonical).digest("hex"),
  };
}

/**
 * The W2 adapter must use this operation rather than an additive insert. It
 * makes the scenario retry-safe and detects a loader that only partially
 * applied a supposedly deterministic dataset.
 */
export async function loadScenarioIdempotently(
  loader: W2SeedLoader,
  scenario = buildDemoSeedScenario()
): Promise<DemoSeedLoadResult> {
  const existing = await loader.getAppliedScenarioHash(scenario.version);
  if (existing === scenario.hash) return { status: "unchanged", hash: scenario.hash };
  await loader.replaceSyntheticScenario(scenario);
  const applied = await loader.getAppliedScenarioHash(scenario.version);
  if (applied !== scenario.hash) {
    throw new Error(`Demo scenario load did not converge for ${scenario.version}`);
  }
  return { status: "loaded", hash: scenario.hash };
}

export function renderSeedCoverageReport(scenario = buildDemoSeedScenario()): string {
  const featureRows = Object.keys(scenario.featureCoverage)
    .map((feature) => `- ${feature}: ${scenario.featureCoverage[feature].join(", ")}`)
    .join("\n");
  const countRows = Object.keys(scenario.counts)
    .sort()
    .map((kind) => `- ${kind}: ${scenario.counts[kind as DemoRecordKind]}`)
    .join("\n");
  return [
    `scenario: ${scenario.version}`,
    `sha256: ${scenario.hash}`,
    `as_of: ${DEMO_SCENARIO.asOf}`,
    "counts:",
    countRows,
    "feature_coverage:",
    featureRows,
  ].join("\n");
}
