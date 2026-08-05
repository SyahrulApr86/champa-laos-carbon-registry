import { TechnologyTransferService } from "./technology.transfer.service";

describe("TechnologyTransferService management/public contract", () => {
  it("reflects create, update, and archive writes in the public list", async () => {
    const records: any[] = [];
    const repo: any = {
      create: jest.fn((dto) => ({
        ...dto,
        id: 3,
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
    const service = new TechnologyTransferService(repo);

    await service.create({
      title: "Solar know-how transfer",
      description: "Test transfer",
      technologyType: "Solar PV",
      recipientEntity: "Recipient",
      implementingEntity: "Implementer",
      type: "Mitigation",
      sector: "Energy",
      status: "On-Going",
    } as any);
    expect((await service.publicList()).data[0].title).toBe(
      "Solar know-how transfer"
    );

    await service.update(3, { title: "Updated solar know-how" } as any);
    expect((await service.publicList()).data[0].title).toBe(
      "Updated solar know-how"
    );

    await service.archive(3, "No longer current");
    expect((await service.publicList()).meta.pagination.total_items).toBe(0);
  });
});
