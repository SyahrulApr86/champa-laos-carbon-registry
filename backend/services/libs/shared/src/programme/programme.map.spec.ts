import { ProgrammeService } from "./programme.service";

describe("ProgrammeService public map contract", () => {
  it("reports received, plotted, and excluded features separately", async () => {
    const service = Object.create(ProgrammeService.prototype) as ProgrammeService;
    (service as any).programmeRepo = {
      find: jest.fn().mockResolvedValue([
        {
          programmeId: "mit-1",
          title: "Plotted mitigation",
          sector: "Energy",
          programmeProperties: { geographicalLocation: ["Vientiane Capital"] },
        },
        {
          programmeId: "mit-2",
          title: "Missing location",
          sector: "Waste",
          programmeProperties: { geographicalLocation: [] },
        },
      ],
      ),
    };
    (service as any).regionRepo = {
      find: jest.fn().mockResolvedValue([
        {
          regionName: "Vientiane Capital",
          lang: "en",
          geoCoordinates: [102.6, 17.97],
        },
      ]),
    };

    const response = await (service as any).getPublicMapSummary("mitigation");
    expect(response.meta.received_count).toBe(2);
    expect(response.meta.plotted_count).toBe(1);
    expect(response.meta.excluded_count).toBe(1);
    expect(response.meta.exclusions.missing_coordinates).toBe(1);
    expect(response.meta.plotted_count).toBeLessThanOrEqual(
      response.meta.received_count
    );
    expect(response.data.features[0].aggregation).toBe(
      "individual_activity_feature"
    );
  });

  it("applies province and search filters before plotting", async () => {
    const service = Object.create(ProgrammeService.prototype) as ProgrammeService;
    (service as any).communityProgramRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 1,
          programId: "com-1",
          name: "River restoration",
          region: "Luang Prabang",
        },
        {
          id: 2,
          programId: "com-2",
          name: "Village solar",
          region: "Vientiane Capital",
        },
      ]),
    };
    (service as any).regionRepo = {
      find: jest.fn().mockResolvedValue([
        { regionName: "Luang Prabang", lang: "en", geoCoordinates: [102, 20] },
        { regionName: "Vientiane Capital", lang: "en", geoCoordinates: [102.6, 17.97] },
      ]),
    };

    const response = await (service as any).getPublicMapSummary(
      "community",
      "Luang Prabang",
      "river"
    );
    expect(response.data.features).toHaveLength(1);
    expect(response.meta.filters.province).toBe("Luang Prabang");
    expect(response.meta.filters.search).toBe("river");
  });
});
