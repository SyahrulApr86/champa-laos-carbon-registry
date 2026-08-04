import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RecognizedMitigationEntity } from "../entities/recognized.mitigation.entity";
import { RecognizedMitigationCreateDto } from "../dto/recognized.mitigation.create.dto";
import { RecognizedMitigationStatus } from "../enum/recognized.mitigation.status.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Region } from "../entities/region.entity";

interface RecognizedMitigationPublicRow {
  referenceId: string;
  title: string;
  proponentName: string;
  proponentType: CompanyRole;
  sector: string;
  region: string;
  estimatedReductionTco2e: number;
  status: RecognizedMitigationStatus;
  createdAt: number;
}

@Injectable()
export class RecognizedMitigationService {
  private readonly logger = new Logger(RecognizedMitigationService.name);

  constructor(
    @InjectRepository(RecognizedMitigationEntity)
    private recognizedMitigationRepo: Repository<RecognizedMitigationEntity>,
    @InjectRepository(Region)
    private regionRepo: Repository<Region>
  ) {}

  async create(
    dto: RecognizedMitigationCreateDto
  ): Promise<RecognizedMitigationEntity> {
    const isValidRegion = await this.regionRepo.findOneBy({
      regionName: dto.region,
      lang: "en",
    });

    if (!isValidRegion) {
      throw new BadRequestException(
        `${dto.region} is not a recognised Lao PDR region.`
      );
    }

    this.logger.verbose("Recognized mitigation action create received", dto.title);
    const record = this.recognizedMitigationRepo.create(dto);
    const saved = await this.recognizedMitigationRepo.save(record);

    saved.referenceId = "RMA-" + String(saved.id).padStart(4, "0");
    return await this.recognizedMitigationRepo.save(saved);
  }

  // Public, unauthenticated search - this registry is intentionally fully
  // public, mirroring the other community-facing registry tabs.
  async publicSearch(
    q: string,
    page = 1,
    size = 10
  ): Promise<{ data: RecognizedMitigationPublicRow[]; total: number }> {
    const keyword = (q || "").trim();
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, size));

    let qb = this.recognizedMitigationRepo
      .createQueryBuilder("action")
      .orderBy(`"action"."createdAt"`, "DESC")
      .skip((safePage - 1) * safeSize)
      .take(safeSize);

    if (keyword) {
      qb = qb.andWhere(
        `("action"."title" ILIKE :keyword OR "action"."proponentName" ILIKE :keyword)`,
        { keyword: `%${keyword}%` }
      );
    }

    const [results, total] = await qb.getManyAndCount();

    return {
      data: results.map((r) => ({
        referenceId: r.referenceId,
        title: r.title,
        proponentName: r.proponentName,
        proponentType: r.proponentType,
        sector: r.sector,
        region: r.region,
        estimatedReductionTco2e:
          r.estimatedReductionTco2e === null ||
          r.estimatedReductionTco2e === undefined
            ? null
            : Number(r.estimatedReductionTco2e),
        status: r.status,
        createdAt: r.createdAt,
      })),
      total,
    };
  }

  async publicSummary(): Promise<{
    totalActions: number;
    byStatus: Record<string, number>;
    byProponentType: Record<string, number>;
  }> {
    const records = await this.recognizedMitigationRepo.find();

    const byStatus: Record<string, number> = {};
    for (const status of Object.values(RecognizedMitigationStatus)) {
      byStatus[status] = 0;
    }

    const byProponentType: Record<string, number> = {};
    for (const role of Object.values(CompanyRole)) {
      byProponentType[role] = 0;
    }

    for (const record of records) {
      byStatus[record.status] = (byStatus[record.status] || 0) + 1;
      byProponentType[record.proponentType] =
        (byProponentType[record.proponentType] || 0) + 1;
    }

    return {
      totalActions: records.length,
      byStatus,
      byProponentType,
    };
  }
}
