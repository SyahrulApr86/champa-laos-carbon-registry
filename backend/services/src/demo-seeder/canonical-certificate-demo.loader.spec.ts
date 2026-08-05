import { CertificateLedgerEventType } from "@app/shared/enum/certificate.ledger.enum";
import { CanonicalCertificateDemoLoader } from "./canonical-certificate-demo.loader";
import { buildDemoSeedScenario, DEMO_MINIMUMS } from "./scenario";

const scenario = buildDemoSeedScenario();

function appliedLots() {
  return Array.from({ length: DEMO_MINIMUMS.certificateLots }, (_, index) => ({
    certificateLotId: `champa-demo-cert-lot-${String(index + 1).padStart(4, "0")}`,
    issuedQuantity: "1000.000000",
    provenance: { scenario_id: scenario.version, scenario_hash: scenario.hash },
  }));
}

describe("CanonicalCertificateDemoLoader", () => {
  it("is a no-op when the persisted scenario hash, counts, and balances match", async () => {
    const lots = appliedLots();
    const lotRepo: any = { find: jest.fn(async () => lots) };
    const eventRepo: any = {
      findBy: jest.fn(async () =>
        Array.from({ length: DEMO_MINIMUMS.ledgerEvents }, (_, index) => ({
          eventId: String(index),
        })),
      ),
    };
    const portionRepo: any = {
      findBy: jest.fn(async () =>
        lots.map((lot) => ({
          certificateLotId: lot.certificateLotId,
          quantity: "1000.000000",
        })),
      ),
    };
    const registry: any = { recordEvent: jest.fn() };
    const loader = new CanonicalCertificateDemoLoader(
      lotRepo,
      portionRepo,
      eventRepo,
      registry,
    );

    await expect(loader.load(scenario)).resolves.toEqual({
      status: "unchanged",
      hash: scenario.hash,
    });
    expect(registry.recordEvent).not.toHaveBeenCalled();
  });

  it("writes exactly 720 lots and 2,000 canonical events with conserved lot supply", async () => {
    const savedLots: any[] = [];
    const eventCalls: any[] = [];
    const lotRepo: any = {
      find: jest.fn(async () => []),
      create: jest.fn((value) => value),
      save: jest.fn(async (lots) => {
        savedLots.push(...lots);
        return lots;
      }),
      delete: jest.fn(),
    };
    const portionRepo: any = { delete: jest.fn() };
    const eventRepo: any = { delete: jest.fn() };
    const registry: any = {
      recordEvent: jest.fn(async (dto) => {
        eventCalls.push(dto);
        return { eventId: `event-${eventCalls.length}` };
      }),
    };
    const loader = new CanonicalCertificateDemoLoader(
      lotRepo,
      portionRepo,
      eventRepo,
      registry,
    );

    await loader.replaceSyntheticScenario(scenario);

    expect(savedLots).toHaveLength(DEMO_MINIMUMS.certificateLots);
    expect(eventCalls).toHaveLength(DEMO_MINIMUMS.ledgerEvents);
    expect(
      savedLots.every(
        (lot) =>
          lot.provenance.scenario_hash === scenario.hash &&
          lot.issuedQuantity === "1000.000000",
      ),
    ).toBe(true);
    expect(
      eventCalls.filter(
        (event) => event.eventType === CertificateLedgerEventType.ISSUED,
      ),
    ).toHaveLength(DEMO_MINIMUMS.certificateLots);
    const issued = eventCalls
      .filter((event) => event.eventType === CertificateLedgerEventType.ISSUED)
      .reduce((sum, event) => sum + event.quantity, 0);
    expect(issued).toBe(DEMO_MINIMUMS.certificateLots * 1000);
  });

  it("rejects an apparently matching hash when a lot balance is not conserved", async () => {
    const lots = appliedLots();
    const lotRepo: any = { find: jest.fn(async () => lots) };
    const eventRepo: any = {
      findBy: jest.fn(async () =>
        Array.from({ length: DEMO_MINIMUMS.ledgerEvents }, (_, index) => ({
          eventId: String(index),
        })),
      ),
    };
    const portionRepo: any = {
      findBy: jest.fn(async () =>
        lots.map((lot, index) => ({
          certificateLotId: lot.certificateLotId,
          quantity: index === 0 ? "999.000000" : "1000.000000",
        })),
      ),
    };
    const loader = new CanonicalCertificateDemoLoader(
      lotRepo,
      portionRepo,
      eventRepo,
      { recordEvent: jest.fn() } as any,
    );

    await expect(
      loader.getAppliedScenarioHash(scenario.version),
    ).resolves.toBeNull();
  });
});
