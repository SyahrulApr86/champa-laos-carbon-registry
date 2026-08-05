import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { NdcTargetEntity } from "../entities/ndc.target.entity";
import { NdcTargetCreateDto } from "../dto/ndc.target.create.dto";
import { NdcTargetUpdateDto } from "../dto/ndc.target.update.dto";
import { NdcSector } from "../enum/ndc.sector.enum";

interface NdcTargetSummary {
  latestYear: number | null;
  baselineEmissions: number | null;
  targetEmissions2030: number | null;
  achievedEmissions: number | null;
  contributionPercent: number | null;
  verifiedReduction: number | null;
}

interface NdcTargetSeriesPoint {
  year: number;
  baselineEmissions: number | null;
  achievedEmissions: number | null;
  // Null when no record for this year (or, for the "All" aggregate, not
  // every sector's record for the year) has a claimed figure entered -
  // the frontend falls back to a single (verified-only) series rather
  // than fabricating a claimed value.
  claimedEmissions: number | null;
  verifiedReduction: number | null;
  unit: "tCO2e";
  scale: "canonical";
  verificationStatus: "claimed_and_verified" | "verified_only" | "not_available";
}

interface PublicMeta {
  dataset_kind: "demo_synthetic" | "mixed_explicit" | "authoritative";
  scenario: string;
  as_of: string;
  period: { start: string; end: string };
  source: { type: string; label: string };
  methodology_version: string;
  unit: "tCO2e";
  scale: "canonical";
  filters: Record<string, unknown>;
  availability: "available" | "not_available";
  disclosure: string;
  aggregation?: string;
}

const DISCLOSURE =
  "Synthetic demonstration data — not official Lao PDR statistics, legal authorisation, market activity, or certificate records. Scenario: Champa registry demonstration. As of: 2026-08-05. Coverage: 2010–2030.";

const buildMeta = (
  filters: Record<string, unknown>,
  availability: PublicMeta["availability"],
  aggregation?: string
): PublicMeta => ({
  dataset_kind: "demo_synthetic",
  scenario: "Champa registry demonstration",
  as_of: "2026-08-05T00:00:00Z",
  period: { start: "2010-01-01", end: "2030-12-31" },
  source: { type: "synthetic_demo", label: "Champa W1 NDC fixture" },
  methodology_version: "champa-parity-demo-v1",
  unit: "tCO2e",
  scale: "canonical",
  filters,
  availability,
  disclosure: DISCLOSURE,
  ...(aggregation ? { aggregation } : {}),
});

const EMPTY_SUMMARY: NdcTargetSummary = {
  latestYear: null,
  baselineEmissions: null,
  targetEmissions2030: null,
  achievedEmissions: null,
  contributionPercent: null,
  verifiedReduction: null,
};

@Injectable()
export class NdcTargetService {
  private readonly logger = new Logger(NdcTargetService.name);

  constructor(
    @InjectRepository(NdcTargetEntity)
    private ndcTargetRepo: Repository<NdcTargetEntity>
  ) {}

  async create(dto: NdcTargetCreateDto, actorId?: number): Promise<NdcTargetEntity> {
    this.logger.verbose(
      "NDC target record create received",
      dto.year,
      dto.sector
    );
    const record = this.ndcTargetRepo.create({
      ...dto,
      version: 1,
      published: true,
      createdBy: actorId ?? null,
      updatedBy: actorId ?? null,
    });
    return await this.ndcTargetRepo.save(record);
  }

  async listManagement(includeArchived = false, sector?: string, year?: number, page = 1, size = 50) {
    const records = await this.ndcTargetRepo.find({
      where: includeArchived ? {} : { archivedAt: IsNull() },
      order: { year: "DESC", sector: "ASC", version: "DESC" },
    });
    const filtered = records.filter((record) =>
      (includeArchived || this.isActive(record)) &&
      (!sector || record.sector === sector) &&
      (year === undefined || record.year === year)
    );
    const safePage = Math.max(1, page);
    const safeSize = Math.min(100, Math.max(1, size));
    const start = (safePage - 1) * safeSize;
    return { data: filtered.slice(start, start + safeSize), total: filtered.length, page: safePage, pageSize: safeSize };
  }

  async getManagementDetail(id: number) {
    const record = await this.findManagementOne(id);
    const groupId = record.versionGroupId ?? record.id;
    const versions = await this.ndcTargetRepo.find({
      where: [{ id: groupId }, { versionGroupId: groupId }],
      order: { version: "ASC" },
    });
    return { ...record, versions };
  }

  async update(id: number, dto: NdcTargetUpdateDto, actorId?: number): Promise<NdcTargetEntity> {
    const current = await this.findManagementOne(id);
    this.assertEditable(current);
    if (!Object.keys(dto).length) throw new BadRequestException("At least one NDC field is required");
    return await this.createVersion(current, dto, actorId);
  }

  async version(id: number, dto: NdcTargetUpdateDto, actorId?: number): Promise<NdcTargetEntity> {
    const current = await this.findManagementOne(id);
    this.assertEditable(current);
    return await this.createVersion(current, dto, actorId);
  }

  async archive(id: number, actorId?: number): Promise<NdcTargetEntity> {
    const record = await this.findManagementOne(id);
    if (!this.isActive(record)) return record;
    const archivedAt = Date.now();
    Object.assign(record, { archivedAt, archivedBy: actorId ?? null, updatedAt: archivedAt, updatedBy: actorId ?? null, published: false });
    return await this.ndcTargetRepo.save(record);
  }

  private async findManagementOne(id: number): Promise<NdcTargetEntity> {
    const record = await this.ndcTargetRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException("NDC target record not found");
    return record;
  }

  private assertEditable(record: NdcTargetEntity): void {
    if (record.archivedAt !== null && record.archivedAt !== undefined) {
      throw new ConflictException("Archived NDC observations cannot be edited or versioned");
    }
  }

  private async createVersion(current: NdcTargetEntity, dto: NdcTargetUpdateDto, actorId?: number): Promise<NdcTargetEntity> {
    const now = Date.now();
    const next = this.ndcTargetRepo.create({
      year: dto.year ?? current.year,
      sector: dto.sector ?? current.sector,
      baselineEmissions: dto.baselineEmissions ?? current.baselineEmissions,
      targetEmissions2030: dto.targetEmissions2030 ?? current.targetEmissions2030,
      achievedEmissions: dto.achievedEmissions ?? current.achievedEmissions,
      claimedEmissions: dto.claimedEmissions ?? current.claimedEmissions,
      notes: dto.notes ?? current.notes,
      version: (current.version ?? 1) + 1,
      versionGroupId: current.versionGroupId ?? current.id,
      supersedesId: current.id,
      published: true,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId ?? current.createdBy ?? null,
      updatedBy: actorId ?? null,
    });
    const saved = await this.ndcTargetRepo.save(next);
    Object.assign(current, { archivedAt: now, archivedBy: actorId ?? null, updatedAt: now, updatedBy: actorId ?? null, published: false, supersedesId: saved.id });
    await this.ndcTargetRepo.save(current);
    return saved;
  }

  private isActive(record: NdcTargetEntity): boolean {
    return record.published !== false && record.archivedAt == null;
  }

  // Public, unauthenticated list ordered oldest to newest - raw export of
  // every recorded sector/year figure.
  async publicList(): Promise<{ data: NdcTargetEntity[]; meta: PublicMeta }> {
    const data = (await this.ndcTargetRepo.find({
      where: { archivedAt: IsNull(), published: true },
      order: { year: "ASC", sector: "ASC" },
    })).filter((record) => this.isActive(record));
    return {
      data,
      meta: buildMeta({}, data.length ? "available" : "not_available"),
    };
  }

  // Resolves the requested sector query param against the real enum,
  // falling back to the 'All' aggregate for an omitted, literal 'All', or
  // unrecognised value - keeps the public endpoints guard-free while never
  // handing an invalid value to a Postgres enum column comparison.
  private resolveSector(sector?: string): NdcSector | undefined {
    const values = Object.values(NdcSector) as string[];
    return sector && values.includes(sector)
      ? (sector as NdcSector)
      : undefined;
  }

  // Latest recorded row per sector - the basis for both the single-sector
  // summary and the 'All' aggregate (summed across each sector's own
  // latest year, matching SRN's "All" tab).
  private async latestPerSector(): Promise<NdcTargetEntity[]> {
    const records = (await this.ndcTargetRepo.find({
      where: { archivedAt: IsNull(), published: true },
      order: { year: "DESC" },
    })).filter((record) => this.isActive(record));
    const latestBySector = new Map<NdcSector, NdcTargetEntity>();
    for (const record of records) {
      if (!latestBySector.has(record.sector)) {
        latestBySector.set(record.sector, record);
      }
    }
    return Array.from(latestBySector.values());
  }

  // NDC Target Achievement Contribution %: how much of the total planned
  // baseline-to-2030-target reduction gap has been achieved so far, i.e.
  // (baseline - achieved) [emission reduction] as a % of
  // (baseline - target2030) [the full planned gap]. Matches SRN's own
  // published contribution-percent semantics.
  private contributionPercent(
    baselineEmissions: number | null,
    targetEmissions2030: number | null,
    achievedEmissions: number | null
  ): number | null {
    if (
      baselineEmissions === null ||
      targetEmissions2030 === null ||
      achievedEmissions === null
    ) {
      return null;
    }
    const gap = baselineEmissions - targetEmissions2030;
    if (gap <= 0) {
      return 0;
    }
    const reduction = baselineEmissions - achievedEmissions;
    return (reduction / gap) * 100;
  }

  async publicSummary(sector?: string): Promise<{
    data: NdcTargetSummary;
    meta: PublicMeta;
  }> {
    const selectedSector = this.resolveSector(sector);

    if (selectedSector) {
      const latest = await this.ndcTargetRepo.findOne({
        where: { sector: selectedSector, archivedAt: IsNull(), published: true },
        order: { year: "DESC" },
      });
      if (!latest || !this.isActive(latest)) {
        return {
          data: EMPTY_SUMMARY,
          meta: buildMeta({ sector: selectedSector }, "not_available"),
        };
      }

      const baselineEmissions = this.toNullableNumber(latest.baselineEmissions);
      const targetEmissions2030 = this.toNullableNumber(latest.targetEmissions2030);
      const achievedEmissions = this.toNullableNumber(latest.achievedEmissions);
      const verifiedReduction =
        baselineEmissions === null || achievedEmissions === null
          ? null
          : baselineEmissions - achievedEmissions;

      return {
        data: {
          latestYear: latest.year,
          baselineEmissions,
          targetEmissions2030,
          achievedEmissions,
          verifiedReduction,
          contributionPercent: this.contributionPercent(
            baselineEmissions,
            targetEmissions2030,
            achievedEmissions
          ),
        },
        meta: buildMeta({ sector: selectedSector }, "available"),
      };
    }

    // 'All' aggregate: sum each sector's own latest-year figures.
    const latestRows = await this.latestPerSector();
    if (latestRows.length === 0) {
      return {
        data: EMPTY_SUMMARY,
        meta: buildMeta({ sector: "All" }, "not_available", "sum of latest row per configured sector"),
      };
    }

    let latestYear: number | null = null;
    let baselineEmissions = 0;
    let targetEmissions2030 = 0;
    let achievedEmissions = 0;

    for (const record of latestRows) {
      const baseline = this.toNullableNumber(record.baselineEmissions);
      const target = this.toNullableNumber(record.targetEmissions2030);
      const achieved = this.toNullableNumber(record.achievedEmissions);
      if (baseline !== null) baselineEmissions += baseline;
      if (target !== null) targetEmissions2030 += target;
      if (achieved !== null) achievedEmissions += achieved;
      latestYear =
        latestYear === null ? record.year : Math.max(latestYear, record.year);
    }

    return {
      data: {
        latestYear,
        baselineEmissions,
        targetEmissions2030,
        achievedEmissions,
        verifiedReduction: baselineEmissions - achievedEmissions,
        contributionPercent: this.contributionPercent(
          baselineEmissions,
          targetEmissions2030,
          achievedEmissions
        ),
      },
      meta: buildMeta(
        { sector: "All" },
        "available",
        "sum of latest row per configured sector"
      ),
    };
  }

  // Yearly baseline vs. achieved time series feeding the public trend
  // charts. Single sector -> its own rows; 'All' -> summed across every
  // sector for each shared year.
  async publicSeries(sector?: string): Promise<{
    data: NdcTargetSeriesPoint[];
    meta: PublicMeta;
  }> {
    const selectedSector = this.resolveSector(sector);

    const records = (await this.ndcTargetRepo.find({
      where: selectedSector ? { sector: selectedSector, archivedAt: IsNull(), published: true } : { archivedAt: IsNull(), published: true },
      order: { year: "ASC" },
    })).filter((record) => this.isActive(record));

    if (selectedSector) {
      return {
        data: records.map((record) => this.toSeriesPoint(record)),
        meta: buildMeta({ sector: selectedSector }, records.length ? "available" : "not_available"),
      };
    }

    const byYear = new Map<
      number,
      {
        baselineEmissions: number;
        achievedEmissions: number;
        claimedEmissions: number;
        claimedIncomplete: boolean;
      }
    >();
    for (const record of records) {
      const entry = byYear.get(record.year) ?? {
        baselineEmissions: 0,
        achievedEmissions: 0,
        claimedEmissions: 0,
        claimedIncomplete: false,
      };
      entry.baselineEmissions += Number(record.baselineEmissions) || 0;
      entry.achievedEmissions += Number(record.achievedEmissions) || 0;
      if (
        record.claimedEmissions === null ||
        record.claimedEmissions === undefined
      ) {
        entry.claimedIncomplete = true;
      } else {
        entry.claimedEmissions += Number(record.claimedEmissions) || 0;
      }
      byYear.set(record.year, entry);
    }

    const data = Array.from(byYear.entries())
      .sort(([yearA], [yearB]) => yearA - yearB)
      .map(([year, totals]) => ({
        year,
        baselineEmissions: totals.baselineEmissions,
        achievedEmissions: totals.achievedEmissions,
        claimedEmissions: totals.claimedIncomplete
          ? null
          : totals.claimedEmissions,
        verifiedReduction: totals.baselineEmissions - totals.achievedEmissions,
        unit: "tCO2e" as const,
        scale: "canonical" as const,
        verificationStatus: totals.claimedIncomplete
          ? ("verified_only" as const)
          : ("claimed_and_verified" as const),
      }));

    return {
      data,
      meta: buildMeta(
        { sector: "All" },
        data.length ? "available" : "not_available",
        "sum of configured sectors by shared year"
      ),
    };
  }

  private toNullableNumber(value: number | null | undefined): number | null {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return null;
    }
    return Number(value);
  }

  private toSeriesPoint(record: NdcTargetEntity): NdcTargetSeriesPoint {
    const baselineEmissions = this.toNullableNumber(record.baselineEmissions);
    const achievedEmissions = this.toNullableNumber(record.achievedEmissions);
    const claimedEmissions = this.toNullableNumber(record.claimedEmissions);
    return {
      year: record.year,
      baselineEmissions,
      achievedEmissions,
      claimedEmissions,
      verifiedReduction:
        baselineEmissions === null || achievedEmissions === null
          ? null
          : baselineEmissions - achievedEmissions,
      unit: "tCO2e",
      scale: "canonical",
      verificationStatus:
        claimedEmissions === null
          ? achievedEmissions === null
            ? "not_available"
            : "verified_only"
          : "claimed_and_verified",
    };
  }
}
