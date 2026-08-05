import { CapacityBuildingService } from "./capacity.building.service";

describe("CapacityBuildingService management/public contract", () => {
  it("reflects create, update, and archive writes in the public list", async () => {
    const records: any[] = [];
    const repo: any = {
      create: jest.fn((dto) => ({
        ...dto,
        id: 4,
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
    const service = new CapacityBuildingService(repo);

    await service.create({
      title: "MRV training",
      description: "Test training",
      recipientEntity: "Recipient",
      implementingEntity: "Implementer",
      type: "Cross Cutting",
      sector: "Energy",
      status: "On-Going",
    } as any);
    expect((await service.publicList()).data[0].title).toBe("MRV training");

    await service.update(4, { title: "Updated MRV training" } as any);
    expect((await service.publicList()).data[0].title).toBe(
      "Updated MRV training"
    );

    await service.archive(4, "Replaced training plan");
    expect((await service.publicList()).meta.pagination.total_items).toBe(0);
  });
});
