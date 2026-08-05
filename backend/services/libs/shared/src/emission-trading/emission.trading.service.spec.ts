import { BadRequestException, ConflictException } from "@nestjs/common";
import { EmissionTradingService } from "./emission.trading.service";

const companies = [
  { companyId: 1, name: "Demo Seller" },
  { companyId: 2, name: "Demo Buyer" },
];

function createService() {
  const ceilings: any[] = [
    {
      id: 1,
      companyId: 1,
      year: 2025,
      seriesName: "Demo Industry",
      sector: "Industry",
      units: 120,
      unit: "tCO2e",
      venueStatus: "synthetic_demo",
      availability: "not_configured",
      lifecycleStatus: "active",
      lifecycleHistory: [],
    },
    {
      id: 2,
      companyId: 2,
      year: 2025,
      seriesName: "Demo Industry",
      sector: "Industry",
      units: 80,
      unit: "tCO2e",
      venueStatus: "synthetic_demo",
      availability: "not_configured",
      lifecycleStatus: "active",
      lifecycleHistory: [],
    },
  ];
  const trades: any[] = [
    {
      id: 8,
      sellerCompanyId: 1,
      buyerCompanyId: 2,
      units: 10,
      valueLAK: 50000,
      currency: "LAK",
      tradeDate: Date.UTC(2025, 4, 1),
      seriesName: "Demo Industry",
      venueStatus: "synthetic_demo",
      settlementStatus: "not_applicable",
      lifecycleStatus: "active",
      lifecycleHistory: [],
    },
  ];
  const participants: any[] = [
    {
      id: 3,
      companyId: 1,
      facilityName: "Demo Facility",
      capacityDescription: "50 MW",
      year: 2025,
      seriesName: "Demo Industry",
      participantStatus: "active",
      lifecycleStatus: "active",
      lifecycleHistory: [],
    },
  ];

  const findById = (rows: any[], options: any) => {
    const id = options?.where?.id;
    const idempotencyKey = options?.where?.idempotencyKey;
    return rows.find((row) => (id !== undefined ? row.id === id : row.idempotencyKey === idempotencyKey));
  };
  const save = (rows: any[]) => jest.fn(async (row: any) => {
    if (!row.id) {
      row.id = Math.max(0, ...rows.map((item) => item.id || 0)) + 1;
      rows.push(row);
    }
    return row;
  });
  const ceilingRepo = {
    find: jest.fn(async () => ceilings),
    findOne: jest.fn(async (options) => findById(ceilings, options)),
    create: jest.fn((row) => row),
    save: save(ceilings),
  };
  const tradeRepo = {
    find: jest.fn(async () => trades),
    findOne: jest.fn(async (options) => findById(trades, options)),
    create: jest.fn((row) => row),
    save: save(trades),
  };
  const participantRepo = {
    find: jest.fn(async () => participants),
    findOne: jest.fn(async (options) => findById(participants, options)),
    create: jest.fn((row) => row),
    save: save(participants),
  };
  const companyRepo = { find: jest.fn(async () => companies) };
  return {
    service: new EmissionTradingService(
      ceilingRepo as any,
      tradeRepo as any,
      participantRepo as any,
      companyRepo as any
    ),
    ceilings,
    trades,
    participants,
  };
}

describe("EmissionTradingService public market contract", () => {
  it("returns canonical pagination metadata and aggregates active ceilings", async () => {
    const { service } = createService();
    const response = await service.publicSeries(1, 10, { venueStatus: "synthetic_demo" });

    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({
      allocated_units: 200,
      exchange_available_units: null,
      availability: "not_configured",
    });
    expect(response.meta).toMatchObject({
      dataset_kind: "demo_synthetic",
      pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 },
    });
    expect(response.meta.ledger_boundary.certificate_bridge).toBe("absent_by_default");
  });

  it("returns trade value as entered LAK data without a certificate bridge", async () => {
    const { service } = createService();
    const response = await service.publicTransactions(1, 10, { search: "seller" });

    expect(response.data[0]).toMatchObject({
      quantity: 10,
      value: 50000,
      currency: "LAK",
      certificate_bridge: "absent",
    });
    expect(response.data[0].price_per_unit).toBe(5000);
  });

  it("refuses a certificate bridge until an approved adapter exists", async () => {
    const { service } = createService();
    await expect(
      service.createTrading({
        sellerCompanyId: 1,
        buyerCompanyId: 2,
        units: 1,
        tradeDate: Date.UTC(2025, 0, 1),
        certificateBridgeEventId: "ledger-event-1",
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refreshes public summary and series after a ceiling is archived", async () => {
    const { service } = createService();
    await service.archiveCeiling(1, "Duplicate allocation", 7);

    const summary = await service.publicSummary();
    const series = await service.publicSeries(1, 10);
    expect(summary.data.ceiling.totalUnits).toBe(80);
    expect(series.data[0].allocated_units).toBe(80);
  });

  it("refreshes the public participant list after a facility is archived", async () => {
    const { service } = createService();
    await service.archiveParticipant(3, "Facility decommissioned", 7);

    const response = await service.publicParticipants(1, 10);
    expect(response.data).toHaveLength(0);
    expect(response.meta.pagination.total_items).toBe(0);
  });

  it("refreshes public trade totals after an unsettled trade is voided", async () => {
    const { service } = createService();
    await service.voidTrade(8, "Entered in error", 7);

    const summary = await service.publicSummary();
    const transactions = await service.publicTransactions(1, 10);
    expect(summary.data.trading.totalUnits).toBe(0);
    expect(transactions.data).toHaveLength(0);
  });

  it("allows corrections on active records and retains audit history", async () => {
    const { service } = createService();
    await service.updateParticipant(
      3,
      { capacityDescription: "60 MW", reason: "Verified facility capacity" },
      7
    );
    const detail = await service.getParticipant(3);
    expect(detail.data.capacityDescription).toBe("60 MW");
    expect(detail.data.lifecycleHistory.at(-1)).toMatchObject({
      action: "updated",
      actorId: 7,
      reason: "Verified facility capacity",
    });
  });

  it("does not edit or void settled trades, but reverses them without deletion", async () => {
    const { service, trades } = createService();
    trades[0].settlementStatus = "settled";
    trades[0].venueStatus = "configured";

    await expect(service.updateTrade(8, { units: 12 }, 7)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.voidTrade(8, "Wrong settlement", 7)).rejects.toBeInstanceOf(ConflictException);

    const result = await service.reverseTrade(8, "Settlement correction", 7);
    expect(result.original).toMatchObject({ id: 8, lifecycleStatus: "reversed" });
    expect(result.reversal).toMatchObject({
      reversalOfTradeId: 8,
      lifecycleStatus: "reversed",
      currency: "LAK",
      units: -10,
    });
    expect(trades).toHaveLength(2);
  });
});

describe("EmissionTradingService management validation", () => {
  it("rejects non-positive ceiling allocations", async () => {
    const { service } = createService();
    await expect(
      service.createCeiling({ companyId: 1, year: 2025, units: 0 })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("lists admin records with pagination and status filters", async () => {
    const { service } = createService();
    const response = await service.listCeilings(1, 1, { status: "active" });
    expect(response.data).toHaveLength(1);
    expect(response.meta.pagination).toMatchObject({ total_items: 2, total_pages: 2 });
  });
});
