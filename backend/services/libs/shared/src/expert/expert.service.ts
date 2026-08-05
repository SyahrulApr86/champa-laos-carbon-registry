import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExpertEntity } from "../entities/expert.entity";
import { ExpertCreateDto } from "../dto/expert.create.dto";
import { ExpertStatus } from "../enum/expert.status.enum";
import { Region } from "../entities/region.entity";

export interface ExpertPublicRow {
  id: number;
  name: string;
  affiliation: string;
  expertise: string;
  certification: string | null;
  yearsOfExperience: number | null;
  province: string;
}

@Injectable()
export class ExpertService {
  private readonly logger = new Logger(ExpertService.name);

  constructor(
    @InjectRepository(ExpertEntity)
    private expertRepo: Repository<ExpertEntity>,
    @InjectRepository(Region)
    private regionRepo: Repository<Region>
  ) {}

  async create(dto: ExpertCreateDto): Promise<ExpertEntity> {
    const isValidProvince = await this.regionRepo.findOneBy({
      regionName: dto.province,
      lang: "en",
    });

    if (!isValidProvince) {
      throw new BadRequestException(
        `${dto.province} is not a recognised Lao PDR province.`
      );
    }

    this.logger.verbose("Expert create received", dto.name);
    const record = this.expertRepo.create(dto);
    return await this.expertRepo.save(record);
  }

  // Public, unauthenticated search - mirrors SRN Indonesia's Roster of
  // Expert directory (search by name/institution, paginated table). Only
  // Active experts are surfaced publicly.
  async publicSearch(
    q: string,
    page = 1,
    size = 10,
    certification?: string,
    province?: string,
    sortBy: "name" | "yearsOfExperience" = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<{ data: ExpertPublicRow[]; total: number; page: number; pageSize: number; meta: Record<string, unknown> }> {
    const keyword = (q || "").trim();
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, size));

    let qb = this.expertRepo
      .createQueryBuilder("expert")
      .where(`"expert"."status" = :status`, { status: ExpertStatus.ACTIVE })
      .orderBy(
        sortBy === "yearsOfExperience" ? `"expert"."yearsOfExperience"` : `"expert"."name"`,
        sortOrder === "desc" ? "DESC" : "ASC"
      )
      .addOrderBy(`"expert"."id"`, "ASC");

    if (keyword) {
      qb = qb.andWhere(
        `("expert"."name" ILIKE :keyword OR "expert"."affiliation" ILIKE :keyword)`,
        { keyword: `%${keyword}%` }
      );
    }

    if (certification) {
      qb = qb.andWhere(`"expert"."certification" ILIKE :certification`, {
        certification: `%${certification}%`,
      });
    }

    if (province) {
      qb = qb.andWhere(`"expert"."province" = :province`, { province });
    }

    qb = qb.skip((safePage - 1) * safeSize).take(safeSize);

    const [results, total] = await qb.getManyAndCount();

    return {
      data: results.map((r) => ({
        id: r.id,
        name: r.name,
        affiliation: r.affiliation,
        expertise: r.expertise,
        certification: r.certification,
        yearsOfExperience: r.yearsOfExperience,
        province: r.province,
      })),
      total,
      page: safePage,
      pageSize: safeSize,
      meta: {
        dataset_kind: "demo_synthetic",
        source_type: "synthetic_demo",
        scenario: "Champa registry demonstration",
        availability: results.length ? "available" : "empty",
        disclosure: "Synthetic demonstration data — not official Lao PDR expert records.",
      },
    };
  }
}
