import { NdcTargetService } from "./ndc.target.service";
import { NdcSector } from "../enum/ndc.sector.enum";

const row = (overrides: Record<string, unknown> = {}) => ({
  year: 2024,
  sector: NdcSector.ENERGY,
  baselineEmissions: 100,
  targetEmissions2030: 70,
  achievedEmissions: 80,
  claimedEmissions: 22,
  ...overrides,
});

describe("NdcTargetService public contract", () => {
  it("keeps null values unavailable and exposes formula metadata", async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([
        row({ year: 2023, claimedEmissions: null }),
        row({ year: 2024, achievedEmissions: null, claimedEmissions: null }),
      ]),
      findOne: jest.fn().mockResolvedValue(row({ achievedEmissions: null })),
    };
    const service = new NdcTargetService(repository as any);

    const response = await service.publicSummary(NdcSector.ENERGY);
    expect(response.meta.unit).toBe("tCO2e");
    expect(response.meta.methodology_version).toBe("champa-parity-demo-v1");
    expect(response.data.achievedEmissions).toBeNull();
    expect(response.data.contributionPercent).toBeNull();

    const series = await service.publicSeries(NdcSector.ENERGY);
    expect(series.data[0].claimedEmissions).toBeNull();
    expect(series.data[1].verifiedReduction).toBeNull();
    expect(series.data[1].verificationStatus).toBe("not_available");
  });

  it("documents the All aggregation instead of silently returning an unlabelled total", async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([
        row({ sector: NdcSector.ENERGY, year: 2024 }),
        row({ sector: NdcSector.IPPU, year: 2024, baselineEmissions: 50 }),
      ]),
      findOne: jest.fn(),
    };
    const service = new NdcTargetService(repository as any);

    const response = await service.publicSummary("All");
    expect(response.meta.aggregation).toContain("latest row per configured sector");
    expect(response.data.baselineEmissions).toBe(150);
    expect(response.data.verifiedReduction).toBe(-10);
  });

  it("returns an explicit not-available envelope for an empty dataset", async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = new NdcTargetService(repository as any);

    const response = await service.publicSeries();
    expect(response.data).toEqual([]);
    expect(response.meta.availability).toBe("not_available");
    expect(response.meta.disclosure).toContain("Synthetic demonstration data");
  });

  it("versions published observations and refreshes the public series", async () => {
    const records: any[] = [
      row({ id: 1, version: 1, published: true, archivedAt: null }),
    ];
    const repository: any = {
      find: jest.fn(async () => records.filter((record) => record.archivedAt == null && record.published !== false)),
      findOne: jest.fn(async (options: any) => {
        if (options?.where?.id) return records.find((record) => record.id === options.where.id) ?? null;
        return records.filter((record) => record.archivedAt == null && record.published !== false).sort((a, b) => b.year - a.year)[0] ?? null;
      }),
      create: jest.fn((value: any) => ({ ...value })),
      save: jest.fn(async (record: any) => {
        if (!record.id) {
          record.id = records.length + 1;
          records.push(record);
        }
        return record;
      }),
    };
    const service = new NdcTargetService(repository);

    const next = await service.update(1, { achievedEmissions: 60 }, 42);
    expect(next.version).toBe(2);
    expect(next.achievedEmissions).toBe(60);
    expect(records[0].archivedAt).not.toBeNull();
    expect(records[0].updatedBy).toBe(42);

    const series = await service.publicSeries(NdcSector.ENERGY);
    expect(series.data[0].achievedEmissions).toBe(60);
    expect(series.data).toHaveLength(1);
  });

  it("archives without deleting the source row and removes it from aggregates", async () => {
    const record: any = row({ id: 7, published: true, archivedAt: null });
    const repository: any = {
      find: jest.fn(async () => (record.archivedAt == null ? [record] : [])),
      findOne: jest.fn().mockResolvedValue(record),
      save: jest.fn(async (value: any) => value),
    };
    const service = new NdcTargetService(repository);

    await service.archive(7, 9);
    expect(repository.save).toHaveBeenCalledWith(record);
    expect(record.published).toBe(false);
    expect(record.archivedBy).toBe(9);
    expect((await service.publicSummary(NdcSector.ENERGY)).meta.availability).toBe("not_available");
  });
});
