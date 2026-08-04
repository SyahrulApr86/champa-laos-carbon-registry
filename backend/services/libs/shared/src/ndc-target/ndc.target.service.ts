import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NdcTargetEntity } from "../entities/ndc.target.entity";
import { NdcTargetCreateDto } from "../dto/ndc.target.create.dto";
import { NdcSector } from "../enum/ndc.sector.enum";

interface NdcTargetSummary {
  latestYear: number | null;
  baselineEmissions: number;
  targetEmissions2030: number;
  achievedEmissions: number;
  contributionPercent: number;
}

interface NdcTargetSeriesPoint {
  year: number;
  baselineEmissions: number;
  achievedEmissions: number;
}

const EMPTY_SUMMARY: NdcTargetSummary = {
  latestYear: null,
  baselineEmissions: 0,
  targetEmissions2030: 0,
  achievedEmissions: 0,
  contributionPercent: 0,
};

@Injectable()
export class NdcTargetService {
  private readonly logger = new Logger(NdcTargetService.name);

  constructor(
    @InjectRepository(NdcTargetEntity)
    private ndcTargetRepo: Repository<NdcTargetEntity>
  ) {}

  async create(dto: NdcTargetCreateDto): Promise<NdcTargetEntity> {
    this.logger.verbose(
      "NDC target record create received",
      dto.year,
      dto.sector
    );
    const record = this.ndcTargetRepo.create(dto);
    return await this.ndcTargetRepo.save(record);
  }

  // Public, unauthenticated list ordered oldest to newest - raw export of
  // every recorded sector/year figure.
  async publicList(): Promise<NdcTargetEntity[]> {
    return await this.ndcTargetRepo.find({ order: { year: "ASC" } });
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
    const records = await this.ndcTargetRepo.find({
      order: { year: "DESC" },
    });
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
    baselineEmissions: number,
    targetEmissions2030: number,
    achievedEmissions: number
  ): number {
    const gap = baselineEmissions - targetEmissions2030;
    if (gap <= 0) {
      return 0;
    }
    const reduction = baselineEmissions - achievedEmissions;
    return (reduction / gap) * 100;
  }

  async publicSummary(sector?: string): Promise<NdcTargetSummary> {
    const selectedSector = this.resolveSector(sector);

    if (selectedSector) {
      const latest = await this.ndcTargetRepo.findOne({
        where: { sector: selectedSector },
        order: { year: "DESC" },
      });
      if (!latest) {
        return EMPTY_SUMMARY;
      }

      const baselineEmissions = Number(latest.baselineEmissions) || 0;
      const targetEmissions2030 = Number(latest.targetEmissions2030) || 0;
      const achievedEmissions = Number(latest.achievedEmissions) || 0;

      return {
        latestYear: latest.year,
        baselineEmissions,
        targetEmissions2030,
        achievedEmissions,
        contributionPercent: this.contributionPercent(
          baselineEmissions,
          targetEmissions2030,
          achievedEmissions
        ),
      };
    }

    // 'All' aggregate: sum each sector's own latest-year figures.
    const latestRows = await this.latestPerSector();
    if (latestRows.length === 0) {
      return EMPTY_SUMMARY;
    }

    let latestYear: number | null = null;
    let baselineEmissions = 0;
    let targetEmissions2030 = 0;
    let achievedEmissions = 0;

    for (const record of latestRows) {
      baselineEmissions += Number(record.baselineEmissions) || 0;
      targetEmissions2030 += Number(record.targetEmissions2030) || 0;
      achievedEmissions += Number(record.achievedEmissions) || 0;
      latestYear =
        latestYear === null ? record.year : Math.max(latestYear, record.year);
    }

    return {
      latestYear,
      baselineEmissions,
      targetEmissions2030,
      achievedEmissions,
      contributionPercent: this.contributionPercent(
        baselineEmissions,
        targetEmissions2030,
        achievedEmissions
      ),
    };
  }

  // Yearly baseline vs. achieved time series feeding the public trend
  // charts. Single sector -> its own rows; 'All' -> summed across every
  // sector for each shared year.
  async publicSeries(sector?: string): Promise<NdcTargetSeriesPoint[]> {
    const selectedSector = this.resolveSector(sector);

    const records = await this.ndcTargetRepo.find({
      where: selectedSector ? { sector: selectedSector } : {},
      order: { year: "ASC" },
    });

    if (selectedSector) {
      return records.map((record) => ({
        year: record.year,
        baselineEmissions: Number(record.baselineEmissions) || 0,
        achievedEmissions: Number(record.achievedEmissions) || 0,
      }));
    }

    const byYear = new Map<
      number,
      { baselineEmissions: number; achievedEmissions: number }
    >();
    for (const record of records) {
      const entry = byYear.get(record.year) ?? {
        baselineEmissions: 0,
        achievedEmissions: 0,
      };
      entry.baselineEmissions += Number(record.baselineEmissions) || 0;
      entry.achievedEmissions += Number(record.achievedEmissions) || 0;
      byYear.set(record.year, entry);
    }

    return Array.from(byYear.entries())
      .sort(([yearA], [yearB]) => yearA - yearB)
      .map(([year, totals]) => ({ year, ...totals }));
  }
}
