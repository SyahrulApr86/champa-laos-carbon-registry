import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReddPlusEntity } from "../entities/redd.plus.entity";
import { ReddPlusCreateDto } from "../dto/redd.plus.create.dto";
import { Region } from "../entities/region.entity";

interface ReddMetric {
  value: number | null;
  unit: "ha" | "tCO2e";
  availability: "available" | "not_available";
  qualityStatus: "observed" | "estimated_demo" | "not_available";
}

export interface PublicReddProvinceSummary {
  province: string;
  lat: number | null;
  lng: number | null;
  projectCount: number;
  forestArea: ReddMetric;
  estimatedReduction: ReddMetric;
  overlapStatus: "unknown" | "non_overlapping";
}

export interface PublicReddResponse {
  data: {
    scope: "national" | "province";
    selectedProvince: string | null;
    national: {
      projectCount: number;
      forestArea: ReddMetric;
      estimatedReduction: ReddMetric;
      overlapStatus: "unknown" | "non_overlapping";
    };
    provinces: PublicReddProvinceSummary[];
  };
  meta: {
    dataset_kind: "demo_synthetic";
    scenario: string;
    as_of: string;
    period: { start: string; end: string };
    source: { type: string; label: string };
    methodology_version: string;
    unit: "mixed";
    scale: "canonical";
    filters: { province: string | null };
    availability: "available" | "not_available";
    disclosure: string;
    geography: { country: "Lao PDR"; provinceCount: number };
  };
}

@Injectable()
export class ReddPlusService {
  private readonly logger = new Logger(ReddPlusService.name);

  constructor(
    @InjectRepository(ReddPlusEntity)
    private reddPlusRepo: Repository<ReddPlusEntity>,
    @InjectRepository(Region)
    private regionRepo: Repository<Region>
  ) {}

  async create(dto: ReddPlusCreateDto): Promise<ReddPlusEntity> {
    const isValidProvince = await this.regionRepo.findOneBy({
      regionName: dto.province,
      lang: "en",
    });

    if (!isValidProvince) {
      throw new BadRequestException(
        `${dto.province} is not a recognised Lao PDR province.`
      );
    }

    this.logger.verbose("REDD+ project create received", dto.title);
    const record = this.reddPlusRepo.create(dto);
    return await this.reddPlusRepo.save(record);
  }

  // Public, unauthenticated per-province REDD+ summary. Always returns all
  // 18 real Lao PDR provinces (the seeded Region table), joined for map
  // coordinates the same way ProgrammeService.getPublicMapSummary() joins
  // against Region - except zero-entry provinces are kept (not omitted),
  // reporting honest zero/empty totals rather than fabricated placeholders.
  async getPublicByProvince(province?: string): Promise<PublicReddResponse> {
    const [regions, records] = await Promise.all([
      this.regionRepo.find({ where: { lang: "en" } }),
      this.reddPlusRepo.find(),
    ]);

    const byProvince: Record<
      string,
      { projectCount: number; forestArea: number; reduction: number; areaKnown: boolean; reductionKnown: boolean }
    > = {};

    for (const record of records) {
      const bucket = byProvince[record.province] ?? {
        projectCount: 0,
        forestArea: 0,
        reduction: 0,
        areaKnown: false,
        reductionKnown: false,
      };
      bucket.projectCount += 1;
      if (record.forestAreaHectares !== null && record.forestAreaHectares !== undefined) {
        bucket.forestArea += Number(record.forestAreaHectares);
        bucket.areaKnown = true;
      }
      if (
        record.estimatedEmissionReductionTco2e !== null &&
        record.estimatedEmissionReductionTco2e !== undefined
      ) {
        bucket.reduction += Number(record.estimatedEmissionReductionTco2e);
        bucket.reductionKnown = true;
      }
      byProvince[record.province] = bucket;
    }

    const provinces = regions
      .map((region) => {
        // geoCoordinates is stored as a raw [longitude, latitude] jsonb
        // array by FileLocationService, matching regions.csv columns.
        const coords = region.geoCoordinates as unknown;
        const hasCoords = Array.isArray(coords) && coords.length >= 2;
        const lng = hasCoords ? coords[0] : null;
        const lat = hasCoords ? coords[1] : null;
        const bucket = byProvince[region.regionName];
        return {
          province: region.regionName,
          lat: typeof lat === "number" ? lat : null,
          lng: typeof lng === "number" ? lng : null,
          projectCount: bucket?.projectCount ?? 0,
          forestArea: this.metric(
            bucket?.areaKnown ? bucket.forestArea : null,
            "ha",
            bucket?.areaKnown ?? false
          ),
          estimatedReduction: this.metric(
            bucket?.reductionKnown ? bucket.reduction : null,
            "tCO2e",
            bucket?.reductionKnown ?? false
          ),
          overlapStatus: "unknown" as const,
        };
      })
      .sort((a, b) => a.province.localeCompare(b.province));

    const selectedProvince =
      provinces.find(
        (entry) => entry.province.toLowerCase() === province?.toLowerCase()
      ) ?? null;
    const sourceProvinces = province ? provinces.filter((entry) => entry === selectedProvince) : provinces;
    const national = this.aggregateNational(sourceProvinces);

    return {
      data: {
        scope: province ? "province" : "national",
        selectedProvince: selectedProvince?.province ?? null,
        national,
        provinces,
      },
      meta: {
        dataset_kind: "demo_synthetic",
        scenario: "Champa registry demonstration",
        as_of: "2026-08-05T00:00:00Z",
        period: { start: "2021-01-01", end: "2026-12-31" },
        source: { type: "synthetic_demo", label: "Champa W1 REDD+ fixture" },
        methodology_version: "champa-parity-demo-v1",
        unit: "mixed",
        scale: "canonical",
        filters: { province: province || null },
        availability: provinces.length ? "available" : "not_available",
        disclosure:
          "Synthetic demonstration data — not an official Lao PDR REDD+ programme, forest inventory, legal authorisation, or certificate record. Scenario: Champa registry demonstration. As of: 2026-08-05. Coverage: 2021–2026.",
        geography: { country: "Lao PDR", provinceCount: provinces.length },
      },
    };
  }

  private metric(
    value: number | null,
    unit: ReddMetric["unit"],
    known: boolean
  ): ReddMetric {
    return {
      value,
      unit,
      availability: known ? "available" : "not_available",
      qualityStatus: known ? "estimated_demo" : "not_available",
    };
  }

  private aggregateNational(provinces: PublicReddProvinceSummary[]) {
    const areaKnown = provinces.some((entry) => entry.forestArea.value !== null);
    const reductionKnown = provinces.some(
      (entry) => entry.estimatedReduction.value !== null
    );
    return {
      projectCount: provinces.reduce((sum, entry) => sum + entry.projectCount, 0),
      forestArea: this.metric(
        areaKnown
          ? provinces.reduce((sum, entry) => sum + (entry.forestArea.value ?? 0), 0)
          : null,
        "ha",
        areaKnown
      ),
      estimatedReduction: this.metric(
        reductionKnown
          ? provinces.reduce(
              (sum, entry) => sum + (entry.estimatedReduction.value ?? 0),
              0
            )
          : null,
        "tCO2e",
        reductionKnown
      ),
      overlapStatus: "unknown" as const,
    };
  }
}
