import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClimateFinanceEntity } from "../entities/climate.finance.entity";
import { ClimateFinanceCreateDto } from "../dto/climate.finance.create.dto";

@Injectable()
export class ClimateFinanceService {
  private readonly logger = new Logger(ClimateFinanceService.name);

  constructor(
    @InjectRepository(ClimateFinanceEntity)
    private climateFinanceRepo: Repository<ClimateFinanceEntity>
  ) {}

  async create(dto: ClimateFinanceCreateDto): Promise<ClimateFinanceEntity> {
    this.logger.verbose("Climate finance record create received", dto.title);
    const record = this.climateFinanceRepo.create(dto);
    return await this.climateFinanceRepo.save(record);
  }

  // Public, unauthenticated search. This data is intentionally fully public
  // (mirrors SRN's public "Financial Support Received" table), so all fields
  // are returned, unlike other publicSearch endpoints in this codebase.
  async publicSearch(
    q: string,
    page = 1,
    size = 10
  ): Promise<{ data: ClimateFinanceEntity[]; total: number }> {
    const keyword = (q || "").trim();
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, size));

    let qb = this.climateFinanceRepo
      .createQueryBuilder("finance")
      .orderBy(`"finance"."dateSigned"`, "DESC")
      .skip((safePage - 1) * safeSize)
      .take(safeSize);

    if (keyword) {
      qb = qb.andWhere(
        `("finance"."title" ILIKE :keyword OR "finance"."recipientEntity" ILIKE :keyword OR "finance"."implementingEntity" ILIKE :keyword)`,
        { keyword: `%${keyword}%` }
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async publicSummary(): Promise<{
    totalAmountLAK: number;
    totalAmountUSD: number;
    bySector: Record<string, number>;
    byChannel: Record<string, { amount: number; percentage: number }>;
  }> {
    const records = await this.climateFinanceRepo.find();

    let totalAmountLAK = 0;
    let totalAmountUSD = 0;
    const bySector: Record<string, number> = {};
    const byChannelAmount: Record<string, number> = {};

    for (const record of records) {
      const lak = Number(record.amountLAK) || 0;
      const usd = Number(record.amountUSD) || 0;
      totalAmountLAK += lak;
      totalAmountUSD += usd;

      bySector[record.sector] = (bySector[record.sector] || 0) + lak;
      byChannelAmount[record.channel] =
        (byChannelAmount[record.channel] || 0) + lak;
    }

    const byChannel: Record<string, { amount: number; percentage: number }> =
      {};
    for (const channel of Object.keys(byChannelAmount)) {
      const amount = byChannelAmount[channel];
      byChannel[channel] = {
        amount,
        percentage: totalAmountLAK > 0 ? (amount / totalAmountLAK) * 100 : 0,
      };
    }

    return {
      totalAmountLAK,
      totalAmountUSD,
      bySector,
      byChannel,
    };
  }
}
