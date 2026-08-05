import { CommunityProgramService } from "./community.program.service";
import { CommunityProgramStatus } from "../enum/community.program.status.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";

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
      id: 1,
      archivedAt: null,
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
      id: 2,
      archivedAt: null,
    },
  ] as any[];

  it("filters and paginates public rows while exposing totals", async () => {
    const repo = { find: jest.fn().mockResolvedValue(records) };
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

  it("updates status and participant totals, then archives from public aggregates", async () => {
    const repo = {
      find: jest.fn(async (options: any = {}) => {
        if (options.where?.archivedAt) {
          return records.filter((record) => record.archivedAt == null);
        }
        return records;
      }),
      findOneBy: jest.fn(async (where: any) =>
        records.find(
          (record) =>
            (where.id === undefined || record.id === where.id) &&
            (where.programId === undefined ||
              record.programId === where.programId) &&
            (!where.archivedAt || record.archivedAt == null)
        )
      ),
      save: jest.fn(async (record) => record),
      create: jest.fn((record) => record),
    };
    const service = new CommunityProgramService(repo as any);
    const user = {
      id: 31,
      role: Role.Admin,
      companyRole: CompanyRole.MINISTRY,
    } as any;

    await service.update(
      1,
      { status: CommunityProgramStatus.COMPLETED, participantCount: 100 },
      user
    );
    let summary = await service.publicSummary();
    expect(summary.data.byStatus[CommunityProgramStatus.COMPLETED]).toBe(1);
    expect(summary.data.totalParticipants).toBe(100);

    await service.archive(1, { reason: "Programme closed" }, user);
    expect(records[0].archiveReason).toBe("Programme closed");
    summary = await service.publicSummary();
    expect(summary.data.totalPrograms).toBe(1);
    expect(summary.data.totalParticipants).toBeNull();
    expect(await service.publicDetail("CCP-0001")).toMatchObject({
      data: null,
    });
  });

  it("denies lifecycle mutations to non-government users", async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(records[0]),
    };
    const service = new CommunityProgramService(repo as any);

    await expect(
      service.update(
        1,
        { name: "Not allowed" },
        {
          role: Role.Manager,
          companyRole: CompanyRole.PROJECT_DEVELOPER,
        } as any
      )
    ).rejects.toMatchObject({ status: 403 });
  });
});
