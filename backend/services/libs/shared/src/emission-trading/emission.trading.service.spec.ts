import { BadRequestException } from "@nestjs/common";
import { EmissionTradingService } from "./emission.trading.service";

const ceilingRows = [
  { companyId: 1, year: 2025, seriesName: "Demo Industry", sector: "Industry", units: 120, unit: "tCO2e", venueStatus: "synthetic_demo", availability: "not_configured" },
  { companyId: 2, year: 2025, seriesName: "Demo Industry", sector: "Industry", units: 80, unit: "tCO2e", venueStatus: "synthetic_demo", availability: "not_configured" },
];

const tradeRows = [
  { id: 8, sellerCompanyId: 1, buyerCompanyId: 2, units: 10, valueLAK: 50000, tradeDate: Date.UTC(2025, 4, 1), seriesName: "Demo Industry", venueStatus: "synthetic_demo", settlementStatus: "not_applicable", ceilingAllocationId: null, certificateBridgeEventId: null },
];

function createService() {
  const ceilingRepo = { find: jest.fn(async () => ceilingRows), create: jest.fn((row) => row), save: jest.fn(async (row) => row) };
  const tradeRepo = { find: jest.fn(async () => tradeRows), findOne: jest.fn(async () => undefined), create: jest.fn((row) => row), save: jest.fn(async (row) => row) };
  const participantRepo = { find: jest.fn(async () => []), create: jest.fn((row) => row), save: jest.fn(async (row) => row) };
  const companyRepo = { find: jest.fn(async () => [{ companyId: 1, name: "Demo Seller" }, { companyId: 2, name: "Demo Buyer" }]) };
  return { service: new EmissionTradingService(ceilingRepo as any, tradeRepo as any, participantRepo as any, companyRepo as any), tradeRepo };
}

describe("EmissionTradingService public market contract", () => {
  it("returns canonical pagination metadata and keeps exchange availability semantic", async () => {
    const { service } = createService();
    const response = await service.publicSeries(1, 10, { venueStatus: "synthetic_demo" });

    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({ allocated_units: 200, exchange_available_units: null, availability: "not_configured" });
    expect(response.meta).toMatchObject({ dataset_kind: "demo_synthetic", pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 } });
    expect(response.meta.ledger_boundary.certificate_bridge).toBe("absent_by_default");
  });

  it("returns trade value as entered LAK data without a certificate bridge", async () => {
    const { service } = createService();
    const response = await service.publicTransactions(1, 10, { search: "seller" });

    expect(response.data[0]).toMatchObject({ quantity: 10, value: 50000, currency: "LAK", certificate_bridge: "absent" });
    expect(response.data[0].price_per_unit).toBe(5000);
  });

  it("refuses a certificate bridge until W2 supplies an approved adapter", async () => {
    const { service } = createService();
    await expect(service.createTrading({ sellerCompanyId: 1, buyerCompanyId: 2, units: 1, tradeDate: Date.UTC(2025, 0, 1), certificateBridgeEventId: "ledger-event-1" })).rejects.toBeInstanceOf(BadRequestException);
  });
});
