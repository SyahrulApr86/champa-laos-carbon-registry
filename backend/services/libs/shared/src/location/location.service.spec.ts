import { LocationService } from "./location.service";

describe("LocationService registration geography", () => {
  it("returns unique provinces and reports lower-level availability", async () => {
    const provinceRepo = {
      find: jest.fn().mockResolvedValue([
        { key: "LA-CHP", provinceName: "Champasak" },
        { key: "LA-VTE", provinceName: "Vientiane Capital" },
      ]),
    };
    const lowerLevelRepo = {
      count: jest.fn().mockResolvedValue(1),
    };
    const service = new LocationService(
      {} as any,
      provinceRepo as any,
      lowerLevelRepo as any,
      lowerLevelRepo as any,
      lowerLevelRepo as any,
      lowerLevelRepo as any,
      {} as any
    );

    await expect(service.getRegistrationProvinces()).resolves.toEqual({
      data: [
        { id: "LA-CHP", name: "Champasak" },
        { id: "LA-VTE", name: "Vientiane Capital" },
      ],
      meta: {
        geography: "Lao PDR province",
        source: "configured_location_dataset",
        availability: "available",
        lower_level_geography: "available",
        lower_level_counts: {
          districts: 1,
          divisions: 1,
          cities: 1,
          postalCodes: 1,
        },
      },
    });
    expect(provinceRepo.find).toHaveBeenCalledWith({
      where: { countryAlpha2: "LA" },
      order: { provinceName: "ASC" },
    });
  });
});
