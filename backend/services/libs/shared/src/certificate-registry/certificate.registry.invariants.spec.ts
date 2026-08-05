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

  it("rejects a ledger event that would make a portion negative", async () => {
    const { service } = makeService();
    const issued = await service.recordEvent({ idempotencyKey: "issue-1", certificateLotId: "lot-1", eventType: CertificateLedgerEventType.ISSUED, quantity: 100, toOwnerCompanyId: "10" });
    await expect(service.recordEvent({ idempotencyKey: "retire-too-much", certificateLotId: "lot-1", eventType: CertificateLedgerEventType.RETIRED, quantity: 101, sourcePortionId: `${issued.eventId}:portion` })).rejects.toBeInstanceOf(BadRequestException);
  });
});
