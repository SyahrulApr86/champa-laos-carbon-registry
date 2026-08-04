import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NdcTargetEntity } from "../entities/ndc.target.entity";
import { NdcTargetCreateDto } from "../dto/ndc.target.create.dto";

@Injectable()
export class NdcTargetService {
  private readonly logger = new Logger(NdcTargetService.name);

  constructor(
    @InjectRepository(NdcTargetEntity)
    private ndcTargetRepo: Repository<NdcTargetEntity>
  ) {}

  async create(dto: NdcTargetCreateDto): Promise<NdcTargetEntity> {
    this.logger.verbose("NDC target record create received", dto.year);
    const record = this.ndcTargetRepo.create(dto);
    return await this.ndcTargetRepo.save(record);
  }

  // Public, unauthenticated list ordered oldest to newest - feeds the
  // frontend achievement trend chart.
  async publicList(): Promise<NdcTargetEntity[]> {
    return await this.ndcTargetRepo.find({ order: { year: "ASC" } });
  }

  async publicSummary(): Promise<{
    latestYear: number | null;
    baselineEmissions: number;
    targetEmissions2030: number;
    achievedEmissions: number;
    contributionPercent: number;
  }> {
    const records = await this.ndcTargetRepo.find({ order: { year: "DESC" } });
    const latest = records[0];

    if (!latest) {
      return {
        latestYear: null,
        baselineEmissions: 0,
        targetEmissions2030: 0,
        achievedEmissions: 0,
        contributionPercent: 0,
      };
    }

    const baselineEmissions = Number(latest.baselineEmissions) || 0;
    const targetEmissions2030 = Number(latest.targetEmissions2030) || 0;
    const achievedEmissions = Number(latest.achievedEmissions) || 0;

    return {
      latestYear: latest.year,
      baselineEmissions,
      targetEmissions2030,
      achievedEmissions,
      contributionPercent:
        targetEmissions2030 > 0
          ? (achievedEmissions / targetEmissions2030) * 100
          : 0,
    };
  }
}
