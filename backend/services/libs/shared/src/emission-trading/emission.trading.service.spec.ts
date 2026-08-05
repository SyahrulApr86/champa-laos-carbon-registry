import { BadRequestException } from "@nestjs/common";
import { EmissionTradingService } from "./emission.trading.service";

const ceilingRows: any[] = [
  { id: 1, companyId: 1, year: 2025, seriesName: "Demo Industry", sector: "Industry", units: 120, unit: "tCO2e", venueStatus: "synthetic_demo", availability: "not_configured", lifecycleStatus: "active", lifecycleHistory: [] },
  { id: 2, companyId: 2, year: 2025, seriesName: "Demo Industry", sector: "Industry", units: 80, unit: "tCO2e", venueStatus: "synthetic_demo", availability: "not_configured", lifecycleStatus: "active", lifecycleHistory: [] },
];
const tradeRows: any[] = [
  { id: 8, sellerCompanyId: 1, buyerCompanyId: 2, units: 10, valueLAK: 50000, currency: "LAK", tradeDate: Date.UTC(2025, 4, 1), seriesName: "Demo Industry", venueStatus: "synthetic_demo", settlementStatus: "not_applicable", lifecycleStatus: "active", lifecycleHistory: [], ceilingAllocationId: null, certificateBridgeEventId: null },
];
const participantRows: any[] = [{ id: 4, companyId: 1, facilityName: "Old Facility", capacityDescription: "10 MW", year: 2025, seriesName: "Demo Industry", lifecycleStatus: "active", participantStatus: "active", lifecycleHistory: [] }];

const repo = <T extends any[]>(rows: T) => ({
  rows,
  find: jest.fn(async () => rows),
  findOne: jest.fn(async ({ where }: any) => rows.find((row: any) => (where.id === undefined || row.id === where.id) && (where.idempotencyKey === undefined || row.idempotencyKey === where.idempotencyKey))),
  create: jest.fn((value: any) => ({ ...value })),
  save: jest.fn(async (value: any) => { if (value.id === undefined) value.id = Math.max(0, ...rows.map((row: any) => row.id || 0)) + 1; if (!rows.includes(value)) rows.push(value); return value; }),
});

function makeService() {
  const ceilings = repo(ceilingRows.map((row) => ({ ...row, lifecycleHistory: [] })));
  const trades = repo(tradeRows.map((row) => ({ ...row, lifecycleHistory: [] })));
  const participants = repo(participantRows.map((row) => ({ ...row, lifecycleHistory: [] })));
  const companies = { find: jest.fn(async () => [{ companyId: 1, name: "Demo Seller" }, { companyId: 2, name: "Demo Buyer" }]) };
  return { service: new EmissionTradingService(ceilings as any, trades as any, participants as any, companies as any), ceilings, trades, participants };
}

describe("EmissionTradingService CRUD-03", () => {
  it("keeps public ceiling aggregates live after an admin correction", async () => {
    const { service } = makeService();
    await service.updateCeiling(1, { units: 140, reason: "Corrected allocation" }, 7);
    const response = await service.publicSummary({ year: 2025 });
    expect(response.data.ceiling.totalUnits).toBe(220);
    expect((await service.listCeilings(1, 10)).data[0]).toMatchObject({ units: 140, lifecycleStatus: "active" });
  });

  it("archives ceilings and removes them from public series without deleting history", async () => {
    const { service } = makeService();
    await service.archiveCeiling(1, "Allocation withdrawn", 7);
    expect((await service.publicSeries(1, 10, { year: 2025 })).data[0].allocated_units).toBe(80);
    const detail = await service.getCeiling(1);
    expect(detail.data.lifecycleStatus).toBe("archived");
    expect(detail.data.lifecycleHistory.at(-1)).toMatchObject({ action: "archive", actorId: 7 });
  });

  it("updates participant details and public participant rows", async () => {
    const { service } = makeService();
    await service.updateParticipant(4, { facilityName: "Updated Facility", reason: "Registry correction" }, 7);
    expect((await service.publicParticipants(1, 10, { search: "Updated" })).data[0].facility_name).toBe("Updated Facility");
  });

  it("validates units, currency, and venue state", async () => {
    const { service } = makeService();
    await expect(service.createCeiling({ companyId: 1, year: 2025, units: 2, unit: "kg" } as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createTrading({ sellerCompanyId: 1, buyerCompanyId: 2, units: 1, valueLAK: 2, currency: "USD", tradeDate: Date.now() } as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createTrading({ sellerCompanyId: 1, buyerCompanyId: 2, units: 1, settlementStatus: "settled", venueStatus: "synthetic_demo", tradeDate: Date.now() } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("voids an editable trade and refreshes public transaction/summary data", async () => {
    const { service, trades } = makeService();
    await service.voidTrade(8, "Duplicate market entry", 7);
    expect((await service.publicTransactions(1, 10)).data).toHaveLength(0);
    expect((await service.publicSummary({ year: 2025 })).data.trading.totalUnits).toBe(0);
    expect((trades as any).rows[0].lifecycleStatus).toBe("voided");
  });

  it("reverses settled trades with a compensating event instead of deleting them", async () => {
    const { service, trades } = makeService();
    (trades as any).rows[0].settlementStatus = "settled";
    const result = await service.reverseTrade(8, "Settlement correction", 7);
    expect(result.original.lifecycleStatus).toBe("reversed");
    expect(result.reversal.reversalOfTradeId).toBe(8);
    expect((trades as any).save).toHaveBeenCalledTimes(2);
    expect((await service.publicSummary({ year: 2025 })).data.trading.totalUnits).toBe(0);
    expect((await service.getTradeHistory(8)).data.at(-1)).toMatchObject({ action: "reverse", actorId: 7 });
  });
});
