import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmissionCeilingEntity } from "../entities/emission.ceiling.entity";
import { EmissionTradingEntity } from "../entities/emission.trading.entity";
import { EmissionCeilingCreateDto } from "../dto/emission.ceiling.create.dto";
import { EmissionTradingCreateDto } from "../dto/emission.trading.create.dto";

@Injectable()
export class EmissionTradingService {
  private readonly logger = new Logger(EmissionTradingService.name);

  constructor(
    @InjectRepository(EmissionCeilingEntity)
    private emissionCeilingRepo: Repository<EmissionCeilingEntity>,
    @InjectRepository(EmissionTradingEntity)
    private emissionTradingRepo: Repository<EmissionTradingEntity>
  ) {}

  async createCeiling(
    dto: EmissionCeilingCreateDto
  ): Promise<EmissionCeilingEntity> {
    const ceiling = this.emissionCeilingRepo.create(dto);
    return await this.emissionCeilingRepo.save(ceiling);
  }

  async createTrading(
    dto: EmissionTradingCreateDto
  ): Promise<EmissionTradingEntity> {
    const trading = this.emissionTradingRepo.create(dto);
    return await this.emissionTradingRepo.save(trading);
  }

  // Prototype-grade summary: emission ceiling allocation and trading
  // activity, optionally scoped to a single year. Not tied to a real Lao
  // cap-and-trade regulation.
  async publicSummary(year?: number): Promise<{
    year: number | null;
    ceiling: { totalUnits: number; companies: number };
    trading: { totalUnits: number; totalValueLAK: number; companies: number };
  }> {
    const ceilings = await this.emissionCeilingRepo.find();
    const scopedCeilings = year
      ? ceilings.filter((c) => c.year === year)
      : ceilings;

    let ceilingTotalUnits = 0;
    const ceilingCompanies = new Set<number>();
    for (const c of scopedCeilings) {
      ceilingTotalUnits += Number(c.units) || 0;
      ceilingCompanies.add(c.companyId);
    }

    const tradings = await this.emissionTradingRepo.find();
    const scopedTradings = year
      ? tradings.filter(
          (t) => new Date(Number(t.tradeDate)).getUTCFullYear() === year
        )
      : tradings;

    let tradingTotalUnits = 0;
    let tradingTotalValueLAK = 0;
    const tradingCompanies = new Set<number>();
    for (const t of scopedTradings) {
      tradingTotalUnits += Number(t.units) || 0;
      tradingTotalValueLAK += Number(t.valueLAK) || 0;
      tradingCompanies.add(t.sellerCompanyId);
      tradingCompanies.add(t.buyerCompanyId);
    }

    return {
      year: year ?? null,
      ceiling: {
        totalUnits: ceilingTotalUnits,
        companies: ceilingCompanies.size,
      },
      trading: {
        totalUnits: tradingTotalUnits,
        totalValueLAK: tradingTotalValueLAK,
        companies: tradingCompanies.size,
      },
    };
  }
}
