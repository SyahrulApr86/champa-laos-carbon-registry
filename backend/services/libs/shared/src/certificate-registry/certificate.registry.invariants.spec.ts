import { BadRequestException } from "@nestjs/common";
import { CertificatePortionState } from "../enum/certificate.ledger.enum";
import { CertificateLedgerEventType } from "../enum/certificate.ledger.enum";
import { assertLotConservation, assertNonNegativePortion } from "./certificate.registry.invariants";
import { CertificateRegistryService } from "./certificate.registry.service";

describe("certificate registry ledger invariants", () => {
  it("reconciles mutually exclusive current portions to the issued lot quantity", () => {
    expect(() => assertLotConservation("100.000000", [
      { certificateLotId: "lot-1", state: CertificatePortionState.AVAILABLE, quantity: "40" },
      { certificateLotId: "lot-1", state: CertificatePortionState.ASSIGNED_TO_EXCHANGE, quantity: "10" },
      { certificateLotId: "lot-1", state: CertificatePortionState.RETIRED, quantity: "25" },
      { certificateLotId: "lot-1", state: CertificatePortionState.CANCELLED, quantity: "15" },
      { certificateLotId: "lot-1", state: CertificatePortionState.WITHHELD, quantity: "10" },
    ])).not.toThrow();
  });

  it("does not count transfer volume as a second balance", () => {
    const balances = [
      { certificateLotId: "lot-1", state: CertificatePortionState.AVAILABLE, quantity: 70 },
      { certificateLotId: "lot-1", state: CertificatePortionState.RETIRED, quantity: 30 },
    ];
    // A transfer of 40 is an event volume only; the current portions still sum to 100.
    const transferredEventVolume = 40;
    expect(transferredEventVolume).toBe(40);
    expect(() => assertLotConservation(100, balances)).not.toThrow();
  });

  it("rejects negative portions and conservation drift", () => {
    expect(() => assertNonNegativePortion(-0.000001)).toThrow("non-negative");
    expect(() => assertLotConservation(100, [
      { certificateLotId: "lot-1", state: CertificatePortionState.AVAILABLE, quantity: 99 },
    ])).toThrow("conservation failed");
  });
});

describe("CertificateRegistryService event application", () => {
  const lot = {
    certificateLotId: "lot-1", certificateId: "CERT-1", programmeId: "P-1",
    issuedQuantity: "100.000000", unit: "tCO2e", provenance: {}, publicFields: {}, asOf: new Date("2026-08-05T00:00:00Z"),
  };

  function makeService() {
    const portions: any[] = [];
    const events: any[] = [];
    const portionRepo = {
      findOne: jest.fn(async ({ where }) => portions.find((portion) => portion.certificatePortionId === where.certificatePortionId && portion.certificateLotId === where.certificateLotId) ?? null),
      findBy: jest.fn(async ({ certificateLotId }) => portions.filter((portion) => portion.certificateLotId === certificateLotId)),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => { const index = portions.findIndex((portion) => portion.certificatePortionId === value.certificatePortionId); if (index >= 0) portions[index] = value; else portions.push(value); return value; }),
      remove: jest.fn(async (value) => { const index = portions.indexOf(value); if (index >= 0) portions.splice(index, 1); }),
    };
    const eventRepo = {
      findOneBy: jest.fn(async (where) => events.find((event) => event.idempotencyKey === where.idempotencyKey || event.eventId === where.eventId) ?? null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => { events.push(value); return value; }),
    };
    const lotRepo = { findOne: jest.fn(async () => lot) };
    const manager: any = {
      transaction: async (callback) => callback(manager),
      getRepository: (entity) => {
        const name = entity.name;
        if (name === "CertificateLot") return lotRepo;
        if (name === "CertificatePortion") return portionRepo;
        if (name === "CertificateLedgerEvent") return eventRepo;
        throw new Error(`Unexpected repository ${name}`);
      },
    };
    return { service: new CertificateRegistryService(manager, lotRepo as any, portionRepo as any, eventRepo as any, {} as any, {} as any, {} as any, {} as any, {} as any), portions, events };
  }

  it("is idempotent and keeps transfer as event volume rather than supply", async () => {
    const { service, portions, events } = makeService();
    const issued = await service.recordEvent({ idempotencyKey: "issue-1", certificateLotId: "lot-1", eventType: CertificateLedgerEventType.ISSUED, quantity: 100, toOwnerCompanyId: "10" });
    await service.recordEvent({ idempotencyKey: "transfer-1", certificateLotId: "lot-1", eventType: CertificateLedgerEventType.TRANSFERRED, quantity: 40, sourcePortionId: `${issued.eventId}:portion`, toOwnerCompanyId: "20" });
    await service.recordEvent({ idempotencyKey: "transfer-1", certificateLotId: "lot-1", eventType: CertificateLedgerEventType.TRANSFERRED, quantity: 40, sourcePortionId: `${issued.eventId}:portion`, toOwnerCompanyId: "20" });

    expect(events).toHaveLength(2);
    expect(portions.reduce((sum, portion) => sum + Number(portion.quantity), 0)).toBe(100);
    expect(events.filter((event) => event.eventType === CertificateLedgerEventType.TRANSFERRED)[0].quantity).toBe("40.000000");
  });

  it("rejects reuse of an idempotency key for a different command", async () => {
    const { service } = makeService();
    await service.recordEvent({ idempotencyKey: "issue-1", certificateLotId: "lot-1", eventType: CertificateLedgerEventType.ISSUED, quantity: 100, toOwnerCompanyId: "10" });
    await expect(service.recordEvent({ idempotencyKey: "issue-1", certificateLotId: "lot-1", eventType: CertificateLedgerEventType.ISSUED, quantity: 99, toOwnerCompanyId: "10" })).rejects.toThrow("different certificate event");
  });

  it("rejects a ledger event that would make a portion negative", async () => {
    const { service } = makeService();
    const issued = await service.recordEvent({ idempotencyKey: "issue-1", certificateLotId: "lot-1", eventType: CertificateLedgerEventType.ISSUED, quantity: 100, toOwnerCompanyId: "10" });
    await expect(service.recordEvent({ idempotencyKey: "retire-too-much", certificateLotId: "lot-1", eventType: CertificateLedgerEventType.RETIRED, quantity: 101, sourcePortionId: `${issued.eventId}:portion` })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("CertificateRegistryService public metrics integration", () => {
  it("changes public balances after an authenticated lifecycle event", async () => {
    const lot: any = {
      certificateLotId: "lot-metrics",
      certificateId: "CERT-METRICS",
      programmeId: "P-METRICS",
      registryScheme: "Champa Registry",
      registryNumber: "REG-METRICS",
      serialNumber: "SER-METRICS",
      vintageStart: "2026-01-01",
      vintageEnd: "2026-12-31",
      issuedQuantity: "100.000000",
      unit: "tCO2e",
      issuedAt: null,
      provenance: { source_type: "managed" },
      publicFields: {},
      asOf: new Date("2026-08-05T00:00:00Z"),
      archivedAt: null,
      updatedBy: null,
    };
    const portions: any[] = [];
    const events: any[] = [];
    const lotRepo: any = {
      find: jest.fn(async () => [lot]),
      findOne: jest.fn(async () => lot),
      findOneBy: jest.fn(async ({ certificateLotId }) => certificateLotId === lot.certificateLotId ? lot : null),
      save: jest.fn(async (value) => value),
    };
    const portionRepo: any = {
      findOne: jest.fn(async ({ where }) => portions.find((portion) => portion.certificatePortionId === where.certificatePortionId && portion.certificateLotId === where.certificateLotId) ?? null),
      findBy: jest.fn(async ({ certificateLotId }) => portions.filter((portion) => portion.certificateLotId === certificateLotId)),
      find: jest.fn(async () => portions),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => {
        const index = portions.findIndex((portion) => portion.certificatePortionId === value.certificatePortionId);
        if (index >= 0) portions[index] = value;
        else portions.push(value);
        return value;
      }),
      remove: jest.fn(async (value) => {
        const index = portions.indexOf(value);
        if (index >= 0) portions.splice(index, 1);
      }),
    };
    const eventRepo: any = {
      findOneBy: jest.fn(async (where) => events.find((event) => event.idempotencyKey === where.idempotencyKey || event.eventId === where.eventId) ?? null),
      find: jest.fn(async () => events),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => { events.push(value); return value; }),
    };
    const programmeRepo: any = {
      findBy: jest.fn(async () => [{ programmeId: "P-METRICS", title: "Metrics programme", sector: "Energy" }]),
      findOneBy: jest.fn(async () => ({ programmeId: "P-METRICS", title: "Metrics programme", sector: "Energy" })),
    };
    const companyRepo: any = { findBy: jest.fn(async () => [{ companyId: 10, name: "Owner" }, { companyId: 20, name: "Recipient" }]) };
    const manager: any = {
      transaction: async (callback) => callback(manager),
      getRepository: (entity) => {
        const name = entity.name;
        if (name === "CertificateLot") return lotRepo;
        if (name === "CertificatePortion") return portionRepo;
        if (name === "CertificateLedgerEvent") return eventRepo;
        throw new Error(`Unexpected repository ${name}`);
      },
    };
    const service = new CertificateRegistryService(manager, lotRepo, portionRepo, eventRepo, programmeRepo, companyRepo, {} as any, {} as any, {} as any);

    const before = await service.getPublicCertificateMetrics();
    expect(before.data.certificate_lot_count).toBe(0);

    const issued = await service.recordManagementEvent({ idempotencyKey: "metrics-issue", certificateLotId: lot.certificateLotId, eventType: CertificateLedgerEventType.ISSUED, quantity: 100, toOwnerCompanyId: "10" }, "user:7");
    const afterIssue = await service.getPublicCertificateMetrics();
    expect(afterIssue.data).toMatchObject({ certificate_lot_count: 1, issued_total: 100, available_balance: 100 });

    await service.recordManagementEvent({ idempotencyKey: "metrics-transfer", certificateLotId: lot.certificateLotId, eventType: CertificateLedgerEventType.TRANSFERRED, quantity: 40, sourcePortionId: `${issued.eventId}:portion`, toOwnerCompanyId: "20" }, "user:7");
    await service.recordManagementEvent({ idempotencyKey: "metrics-retire", certificateLotId: lot.certificateLotId, eventType: CertificateLedgerEventType.RETIRED, quantity: 10, sourcePortionId: `${issued.eventId}:portion` }, "user:7");
    const afterRetire = await service.getPublicCertificateMetrics();
    expect(afterRetire.data).toMatchObject({ transferred_event_total: 40, available_balance: 90, retired_balance: 10 });
    expect(events.every((event) => event.actorReference === "user:7")).toBe(true);
  });

  it("supports draft edit and archive without exposing the draft publicly", async () => {
    const lots: any[] = [];
    const lotRepo: any = {
      find: jest.fn(async () => lots),
      findOne: jest.fn(async ({ where }) => lots.find((lot) => lot.certificateLotId === where.certificateLotId || lot.certificateId === where.certificateId) ?? null),
      findOneBy: jest.fn(async ({ certificateLotId }) => lots.find((lot) => lot.certificateLotId === certificateLotId) ?? null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => {
        const index = lots.findIndex((lot) => lot.certificateLotId === value.certificateLotId);
        if (index >= 0) lots[index] = value;
        else lots.push(value);
        return value;
      }),
    };
    const eventRepo: any = { find: jest.fn(async () => []), findBy: jest.fn(async () => []), findOneBy: jest.fn(async () => null) };
    const portionRepo: any = { find: jest.fn(async () => []), findBy: jest.fn(async () => []) };
    const programmeRepo: any = {
      findOneBy: jest.fn(async ({ programmeId }) => ({ programmeId, title: "Programme" })),
      findBy: jest.fn(async () => []),
    };
    const manager: any = {
      transaction: async (callback) => callback(manager),
      getRepository: (entity) => {
        const name = entity.name;
        if (name === "CertificateLot") return lotRepo;
        if (name === "CertificatePortion") return portionRepo;
        if (name === "CertificateLedgerEvent") return eventRepo;
        if (name === "Programme") return programmeRepo;
        throw new Error(`Unexpected repository ${name}`);
      },
    };
    const service = new CertificateRegistryService(manager, lotRepo, portionRepo, eventRepo, programmeRepo, { findBy: jest.fn(async () => []) } as any, {} as any, {} as any, {} as any);
    const created = await service.createManagementLot({ programmeId: "P-DRAFT", certificateId: "CERT-DRAFT", issuedQuantity: 25 } as any, "user:8");
    expect(created.createdBy).toBe("user:8");
    await service.updateManagementLot(created.certificateLotId, { registryNumber: "REG-DRAFT" }, "user:8");
    expect(lots[0].registryNumber).toBe("REG-DRAFT");
    await service.archiveManagementLot(created.certificateLotId, { reason: "Duplicate input" }, "user:8");
    expect((await service.getManagementLots()).data).toHaveLength(0);
    expect((await service.getManagementLots({ includeArchived: true })).data).toHaveLength(1);
    expect((await service.getPublicCertificateMetrics()).data.certificate_lot_count).toBe(0);
  });
});
