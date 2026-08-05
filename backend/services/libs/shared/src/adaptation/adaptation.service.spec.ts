import { AdaptationService } from "./adaptation.service";
import { AdaptationStage } from "../enum/adaptation.stage.enum";
import { AdaptationSector } from "../enum/adaptation.sector.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";

describe("AdaptationService management lifecycle", () => {
  const records: any[] = [
    {
      id: 1,
      adaptationId: "ADP-0001",
      title: "Watershed resilience",
      description: "Synthetic adaptation action",
      sector: AdaptationSector.WATER_SECURITY,
      region: "Vientiane",
      companyId: 10,
      currentStage: AdaptationStage.SUBMITTED,
      archivedAt: null,
      createdAt: 2,
    },
    {
      id: 2,
      adaptationId: "ADP-0002",
      title: "Coastal resilience",
      description: "Synthetic adaptation action",
      sector: AdaptationSector.COASTAL_AND_SMALL_ISLANDS,
      region: "Champasak",
      companyId: 11,
      currentStage: AdaptationStage.APPROVED,
      archivedAt: null,
      createdAt: 1,
    },
  ];

  const repo = {
    find: jest.fn(async (options: any = {}) => {
      let result = [...records];
      if (options.where?.archivedAt) {
        result = result.filter((record) => record.archivedAt == null);
      }
      if (options.where?.companyId !== undefined) {
        result = result.filter(
          (record) => record.companyId === options.where.companyId
        );
      }
      return result;
    }),
    findOneBy: jest.fn(async (where: any) =>
      records.find(
        (record) =>
          (where.id === undefined || record.id === where.id) &&
          (where.adaptationId === undefined ||
            record.adaptationId === where.adaptationId) &&
          (!where.archivedAt || record.archivedAt == null)
      )
    ),
    save: jest.fn(async (record) => record),
    create: jest.fn((record) => record),
  };
  const companyRepo = { findOneBy: jest.fn() };

  const reviewer = {
    id: 20,
    role: Role.Admin,
    companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
  } as any;
  const owner = {
    id: 21,
    role: Role.Manager,
    companyRole: CompanyRole.PROJECT_DEVELOPER,
    companyId: 10,
  } as any;

  beforeEach(() => {
    records[0].title = "Watershed resilience";
    records[0].currentStage = AdaptationStage.SUBMITTED;
    records[0].archivedAt = null;
    records[0].updatedByUserId = null;
    records[1].currentStage = AdaptationStage.APPROVED;
    records[1].archivedAt = null;
    jest.clearAllMocks();
  });

  it("scopes owners, updates editable fields, updates status, and refreshes summary", async () => {
    const service = new AdaptationService(repo as any, companyRepo as any);

    expect(await service.query(owner)).toEqual([records[0]]);
    await expect(service.managementDetail(2, owner)).rejects.toMatchObject({
      status: 403,
    });

    const updated = await service.update(
      1,
      { title: "Updated watershed resilience" },
      owner
    );
    expect(updated.title).toBe("Updated watershed resilience");
    expect(updated.updatedByUserId).toBe(owner.id);

    await service.updateStage(
      1,
      { stage: AdaptationStage.UNDER_REVIEW },
      reviewer
    );
    let summary = await service.publicSummary();
    expect(summary.data.totalProjects).toBe(2);
    expect(summary.data.byStage[AdaptationStage.UNDER_REVIEW]).toBe(1);

    await service.archive(1, { reason: "Superseded submission" }, reviewer);
    expect(records[0].archiveReason).toBe("Superseded submission");
    summary = await service.publicSummary();
    expect(summary.data.totalProjects).toBe(1);
    expect(summary.data.byStage[AdaptationStage.ARCHIVED]).toBe(0);
    expect(await service.publicDetail("ADP-0001")).toMatchObject({
      data: null,
    });
  });

  it("rejects edits to an approved project and reviewer stage changes from view-only users", async () => {
    const service = new AdaptationService(repo as any, companyRepo as any);

    await expect(
      service.update(2, { title: "Unsafe correction" }, reviewer)
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      service.updateStage(
        1,
        { stage: AdaptationStage.APPROVED },
        {
          ...reviewer,
          role: Role.ViewOnly,
        } as any
      )
    ).rejects.toMatchObject({ status: 403 });
  });
});
