import { ReddPlusService } from "./redd.plus.service";

describe("ReddPlusService public contract", () => {
  const region = (province: string, coordinates: unknown = [102, 18]) => ({
    regionName: province,
    lang: "en",
    geoCoordinates: coordinates,
  });

  it("keeps zero project counts distinct from unavailable metrics", async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([
        {
          province: "Attapeu",
          forestAreaHectares: null,
          estimatedEmissionReductionTco2e: null,
        },
      ]),
    };
    const regionRepository = {
      find: jest.fn().mockResolvedValue([region("Attapeu"), region("Bokeo")]),
    };
    const service = new ReddPlusService(repository as any, regionRepository as any);

    const response = await service.getPublicByProvince();
    const attapeu = response.data.provinces.find((entry) => entry.province === "Attapeu");
    const bokeo = response.data.provinces.find((entry) => entry.province === "Bokeo");
    expect(attapeu?.projectCount).toBe(1);
    expect(attapeu?.forestArea.value).toBeNull();
    expect(attapeu?.forestArea.availability).toBe("not_available");
    expect(bokeo?.projectCount).toBe(0);
    expect(bokeo?.forestArea.value).toBeNull();
    expect(response.meta.geography.provinceCount).toBe(2);
  });

  it("returns a national aggregate and preserves overlap uncertainty", async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([
        {
          province: "Attapeu",
          forestAreaHectares: 100,
          estimatedEmissionReductionTco2e: 40,
        },
        {
          province: "Bokeo",
          forestAreaHectares: 50,
          estimatedEmissionReductionTco2e: 10,
        },
      ]),
    };
    const regionRepository = {
      find: jest.fn().mockResolvedValue([region("Attapeu"), region("Bokeo")]),
    };
    const service = new ReddPlusService(repository as any, regionRepository as any);

    const response = await service.getPublicByProvince();
    expect(response.data.national.projectCount).toBe(2);
    expect(response.data.national.forestArea.value).toBe(150);
    expect(response.data.national.estimatedReduction.value).toBe(50);
    expect(response.data.national.overlapStatus).toBe("unknown");

    const filtered = await service.getPublicByProvince("Bokeo");
    expect(filtered.data.scope).toBe("province");
    expect(filtered.data.selectedProvince).toBe("Bokeo");
    expect(filtered.data.national.projectCount).toBe(1);
  });

  it("versions a province record and refreshes the public map aggregate", async () => {
    const records: any[] = [
      {
        id: 1,
        province: "Attapeu",
        title: "Forest landscape project",
        description: "Synthetic REDD+ action",
        forestAreaHectares: 100,
        estimatedEmissionReductionTco2e: 40,
        implementingEntity: "Demo forestry department",
        status: "Ongoing",
        version: 1,
        published: true,
        archivedAt: null,
      },
    ];
    const repository: any = {
      find: jest.fn(async () => records.filter((record) => record.archivedAt == null && record.published !== false)),
      findOne: jest.fn(async ({ where }: any) => records.find((record) => record.id === where.id) ?? null),
      create: jest.fn((value: any) => ({ ...value })),
      save: jest.fn(async (record: any) => {
        if (!record.id) {
          record.id = records.length + 1;
          records.push(record);
        }
        return record;
      }),
    };
    const regionRepository: any = {
      find: jest.fn().mockResolvedValue([region("Attapeu")]),
      findOneBy: jest.fn().mockResolvedValue(region("Attapeu")),
    };
    const service = new ReddPlusService(repository, regionRepository);

    const next = await service.update(1, { forestAreaHectares: 200, status: "Completed" as any }, 33);
    expect(next.version).toBe(2);
    expect(records[0].archivedBy).toBe(33);

    const response = await service.getPublicByProvince();
    expect(response.data.national.forestArea.value).toBe(200);
    expect(response.data.national.projectCount).toBe(1);
  });
});
