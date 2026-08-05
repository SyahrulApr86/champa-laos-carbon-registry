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
});
