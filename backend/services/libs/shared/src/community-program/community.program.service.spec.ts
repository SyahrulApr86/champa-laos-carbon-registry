import { CommunityProgramService } from "./community.program.service";

describe("CommunityProgramService public contract", () => {
  const records = [
    {
      programId: "CCP-0001",
      name: "River restoration",
      region: "Vientiane",
      category: "Ecosystem",
      description: "Synthetic community action",
      participantCount: 42,
      startYear: 2022,
      status: "Active",
      createdAt: 2,
    },
    {
      programId: "CCP-0002",
      name: "Village preparedness",
      region: "Luang Prabang",
      category: "Resilience",
      description: "Synthetic community action",
      participantCount: null,
      startYear: 2023,
      status: "Planned",
      createdAt: 1,
    },
  ] as any[];

  it("filters and paginates public rows while exposing totals", async () => {
    const repo = {
      find: jest.fn().mockResolvedValue(records),
    };
    const service = new CommunityProgramService(repo as any);

    const response = await service.publicList({
      q: "river",
      page: 1,
      pageSize: 10,
    });

    expect(response.data).toHaveLength(1);
    expect(response.data[0].programId).toBe("CCP-0001");
    expect(response.meta.pagination.total_items).toBe(1);
    expect(response.meta.disclosure).toContain("Synthetic demonstration data");
  });

  it("does not turn missing participant counts into zero", async () => {
    const repo = { find: jest.fn().mockResolvedValue([records[1]]) };
    const service = new CommunityProgramService(repo as any);

    const response = await service.publicSummary();

    expect(response.data.totalParticipants).toBeNull();
    expect(response.data.totalPrograms).toBe(1);
  });
});
