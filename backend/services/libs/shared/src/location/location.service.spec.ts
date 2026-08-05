import { LocationService } from "./location.service";

describe("LocationService registration geography", () => {
  it("returns only the configured Lao PDR province list and marks lower levels unavailable", async () => {
    const provinceRepo = {
      find: jest.fn().mockResolvedValue([
        { key: "LA-CHP", provinceName: "Champasak" },
        { key: "LA-VTE", provinceName: "Vientiane Capital" },
      ]),
    };
    const service = new LocationService(
      {} as any,
      provinceRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
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
        lower_level_geography: "not_configured",
      },
    });
    expect(provinceRepo.find).toHaveBeenCalledWith({
      where: { countryAlpha2: "LA" },
      order: { provinceName: "ASC" },
    });
  });
});
