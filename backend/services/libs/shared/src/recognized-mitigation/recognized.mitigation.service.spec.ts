import { RecognizedMitigationService } from "./recognized.mitigation.service";
import { RecognizedMitigationStatus } from "../enum/recognized.mitigation.status.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Sector } from "../enum/sector.enum";

describe("RecognizedMitigationService lifecycle", () => {
  const base = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    referenceId: "RMA-0001",
    title: "Efficient cookstove rollout",
    description: "Community mitigation action",
    proponentName: "Demo district",
    proponentType: CompanyRole.PROJECT_DEVELOPER,
    proponentCompanyId: null,
    sector: Sector.Energy,
    region: "Vientiane Capital",
    estimatedReductionTco2e: 100,
    status: RecognizedMitigationStatus.UNDER_REVIEW,
    version: 1,
    published: true,
    archivedAt: null,
    ...overrides,
  });

  it("versions an action and refreshes its public status/reduction summary", async () => {
    const records: any[] = [base()];
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
    const regionRepository = { findOneBy: jest.fn().mockResolvedValue({ regionName: "Vientiane Capital", lang: "en" }) };
    const service = new RecognizedMitigationService(repository, regionRepository as any);

    const next = await service.update(1, { estimatedReductionTco2e: 150, status: RecognizedMitigationStatus.RECOGNIZED }, 42);
    expect(next.version).toBe(2);
    expect(next.estimatedReductionTco2e).toBe(150);
    expect(records[0].archivedBy).toBe(42);

    const summary = await service.publicSummary();
    expect(summary.totalActions).toBe(1);
    expect(summary.byStatus[RecognizedMitigationStatus.RECOGNIZED]).toBe(1);
  });

  it("rejects invalid review transitions and archives non-destructively", async () => {
    const record: any = base({ status: RecognizedMitigationStatus.RECOGNIZED });
    const repository: any = {
      find: jest.fn(async () => (record.archivedAt == null ? [record] : [])),
      findOne: jest.fn().mockResolvedValue(record),
      save: jest.fn(async (value: any) => value),
    };
    const service = new RecognizedMitigationService(repository, { findOneBy: jest.fn() } as any);

    await expect(service.update(1, { status: RecognizedMitigationStatus.SUBMITTED })).rejects.toThrow("Invalid recognized mitigation status transition");
    await service.archive(1, 7);
    expect(record.published).toBe(false);
    expect(record.archivedBy).toBe(7);
    expect((await service.publicSummary()).totalActions).toBe(0);
  });
});
