import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReddPlusEntity } from "../entities/redd.plus.entity";
import { ReddPlusCreateDto } from "../dto/redd.plus.create.dto";
import { Region } from "../entities/region.entity";

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
  async getPublicByProvince(): Promise<
    {
      province: string;
      lat: number | null;
      lng: number | null;
      projectCount: number;
      totalForestAreaHectares: number;
      totalEstimatedEmissionReductionTco2e: number;
    }[]
  > {
    const [regions, records] = await Promise.all([
      this.regionRepo.find({ where: { lang: "en" } }),
      this.reddPlusRepo.find(),
    ]);

    const byProvince: Record<
      string,
      { projectCount: number; forestArea: number; emissionReduction: number }
    > = {};

    for (const record of records) {
      const bucket = byProvince[record.province] ?? {
        projectCount: 0,
        forestArea: 0,
        emissionReduction: 0,
      };
      bucket.projectCount += 1;
      bucket.forestArea += Number(record.forestAreaHectares) || 0;
      bucket.emissionReduction +=
        Number(record.estimatedEmissionReductionTco2e) || 0;
      byProvince[record.province] = bucket;
    }

    return regions
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
          totalForestAreaHectares: bucket?.forestArea ?? 0,
          totalEstimatedEmissionReductionTco2e:
            bucket?.emissionReduction ?? 0,
        };
      })
      .sort((a, b) => a.province.localeCompare(b.province));
  }
}
