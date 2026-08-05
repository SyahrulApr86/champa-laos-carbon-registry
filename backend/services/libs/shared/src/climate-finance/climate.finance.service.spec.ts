import { ClimateFinanceService } from "./climate.finance.service";

describe("ClimateFinanceService public contract", () => {
  it("keeps currencies separate and preserves missing amounts", async () => {
    const records = [
      {
        id: 1,
        title: "Water resilience grant",
        description: "Synthetic finance record",
        channel: "Grant",
        recipientEntity: "Demo province",
        implementingEntity: "Demo agency",
        dateSigned: 1,
        dateClosing: null,
        amountLAK: 1000,
        amountUSD: null,
        sector: "Water",
        financialInstrument: "Grant",
        status: "Ongoing",
        type: "Adaptation",
        createdAt: 1,
      },
    ];
    const repo = {
      find: jest.fn().mockResolvedValue(records),
    };
    const service = new ClimateFinanceService(repo as any);

    const response = await service.publicSummary();

    expect(response.data.totalAmountLAK).toBe(1000);
    expect(response.data.totalAmountUSD).toBeNull();
    expect(response.data.currencyAvailability).toEqual({
      LAK: "available",
      USD: "not_available",
    });
    expect(response.data.byChannelUSD).toEqual({});
  });
});
