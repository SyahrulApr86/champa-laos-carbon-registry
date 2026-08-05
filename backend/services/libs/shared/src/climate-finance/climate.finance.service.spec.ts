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

  it("recomputes public totals after update and archive writes", async () => {
    const records: any[] = [];
    const repo: any = {
      create: jest.fn((dto) => ({
        ...dto,
        id: 7,
        createdAt: 1,
        archivedAt: null,
      })),
      save: jest.fn(async (record) => {
        const index = records.findIndex((item) => item.id === record.id);
        if (index === -1) records.push(record);
        else records[index] = record;
        return record;
      }),
      find: jest.fn(async () => records),
      findOneBy: jest.fn(async ({ id }) =>
        records.find((record) => record.id === id)
      ),
      delete: jest.fn(async () => undefined),
    };
    const service = new ClimateFinanceService(repo);

    await service.create({
      title: "Write-through grant",
      description: "A test record",
      channel: "Bilateral",
      recipientEntity: "Recipient",
      implementingEntity: "Implementer",
      dateSigned: 1,
      amountLAK: 100,
      amountUSD: 25,
      sector: "Energy",
      financialInstrument: "Grant",
      status: "Ongoing",
      type: "Mitigation",
    } as any);
    expect((await service.publicSummary()).data).toMatchObject({
      totalAmountLAK: 100,
      totalAmountUSD: 25,
    });

    await service.update(7, { amountLAK: 275, amountUSD: 40 } as any);
    expect((await service.publicSummary()).data).toMatchObject({
      totalAmountLAK: 275,
      totalAmountUSD: 40,
    });

    await service.archive(7, "Superseded source record");
    expect((await service.publicSummary()).data).toMatchObject({
      totalAmountLAK: null,
      totalAmountUSD: null,
    });
  });
});
