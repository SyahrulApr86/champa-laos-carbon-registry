import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { EmissionCeilingEntity } from "../entities/emission.ceiling.entity";
import { EmissionTradingEntity } from "../entities/emission.trading.entity";
import { EmissionParticipantEntity } from "../entities/emission.participant.entity";
import { Company } from "../entities/company.entity";
import { EmissionCeilingCreateDto } from "../dto/emission.ceiling.create.dto";
import { EmissionTradingCreateDto } from "../dto/emission.trading.create.dto";
import { EmissionParticipantCreateDto } from "../dto/emission.participant.create.dto";

const MAX_PAGE_SIZE = 50;

@Injectable()
export class EmissionTradingService {
  private readonly logger = new Logger(EmissionTradingService.name);

  constructor(
    @InjectRepository(EmissionCeilingEntity)
    private emissionCeilingRepo: Repository<EmissionCeilingEntity>,
    @InjectRepository(EmissionTradingEntity)
    private emissionTradingRepo: Repository<EmissionTradingEntity>,
    @InjectRepository(EmissionParticipantEntity)
    private emissionParticipantRepo: Repository<EmissionParticipantEntity>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>
  ) {}

  private normalizePaging(page?: number, pageSize?: number) {
    const safePage = Math.max(1, page || 1);
    const safePageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize || 10));
    return { safePage, safePageSize };
  }

  private async companyNameMap(companyIds: number[]): Promise<Map<number, string>> {
    const uniqueIds = Array.from(new Set(companyIds)).filter((id) => !!id);
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const companies = await this.companyRepo.find({
      where: { companyId: In(uniqueIds) },
    });
    return new Map(companies.map((c) => [c.companyId, c.name]));
  }

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

  async createParticipant(
    dto: EmissionParticipantCreateDto
  ): Promise<EmissionParticipantEntity> {
    const participant = this.emissionParticipantRepo.create(dto);
    return await this.emissionParticipantRepo.save(participant);
  }

  // Prototype-grade summary: emission ceiling allocation and trading
  // activity, optionally scoped to a single year. Not tied to a real Lao
  // cap-and-trade regulation.
  async publicSummary(year?: number): Promise<{
    year: number | null;
    ceiling: { totalUnits: number; companies: number };
    trading: { totalUnits: number; totalValueLAK: number; companies: number };
    today: { totalUnits: number; totalValueLAK: number };
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

    // Real "today" slice of the same trading rows - matches SRN's own
    // "Daily Trading" widget, which honestly shows 0/0 on a day with no
    // trades rather than fabricating activity. No separate data source;
    // just a date-scoped sum over the trading rows already fetched above.
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    let todayTotalUnits = 0;
    let todayTotalValueLAK = 0;
    for (const t of tradings) {
      if (Number(t.tradeDate) >= todayMs) {
        todayTotalUnits += Number(t.units) || 0;
        todayTotalValueLAK += Number(t.valueLAK) || 0;
      }
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
      today: {
        totalUnits: todayTotalUnits,
        totalValueLAK: todayTotalValueLAK,
      },
    };
  }

  // Public, unauthenticated - PTBAE-PU "Series" tab equivalent. Ceiling
  // rows are grouped by (seriesName || sector || "Unspecified") and year,
  // mirroring SRN's "Ketenagalistrikan - 2024" style series rows. The
  // "available for exchange" figure is intentionally left null: Champa's
  // ceiling model has no sub-allocation reserved for trading (SRN's own
  // live data renders "-" for this column too), so reporting a real number
  // here would be fabricated.
  async publicSeries(
    page?: number,
    pageSize?: number
  ): Promise<{
    data: {
      seriesName: string;
      year: number;
      units: number;
      companies: number;
      availableForExchange: null;
    }[];
    total: number;
  }> {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    const ceilings = await this.emissionCeilingRepo.find();

    const groups = new Map<
      string,
      { seriesName: string; year: number; units: number; companyIds: Set<number> }
    >();
    for (const c of ceilings) {
      const seriesName = c.seriesName || c.sector || "Unspecified";
      const key = `${seriesName}::${c.year}`;
      if (!groups.has(key)) {
        groups.set(key, {
          seriesName,
          year: c.year,
          units: 0,
          companyIds: new Set<number>(),
        });
      }
      const group = groups.get(key);
      group.units += Number(c.units) || 0;
      group.companyIds.add(c.companyId);
    }

    const rows = Array.from(groups.values())
      .sort((a, b) => b.year - a.year || a.seriesName.localeCompare(b.seriesName))
      .map((g) => ({
        seriesName: g.seriesName,
        year: g.year,
        units: g.units,
        companies: g.companyIds.size,
        availableForExchange: null as null,
      }));

    const total = rows.length;
    const start = (safePage - 1) * safePageSize;
    return { data: rows.slice(start, start + safePageSize), total };
  }

  // Public, unauthenticated - PTBAE-PU "Carbon Exchange Transactions" tab
  // equivalent. Champa's trading rows are company-to-company (not tied to a
  // series), so instead of fabricating a "series" label the seller/buyer
  // company names are joined in from CompanyService's backing repository.
  async publicTransactions(
    page?: number,
    pageSize?: number
  ): Promise<{
    data: {
      id: number;
      date: number;
      sellerCompanyName: string;
      buyerCompanyName: string;
      units: number;
      valueLAK: number;
    }[];
    total: number;
  }> {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    const [rows, total] = await this.emissionTradingRepo.findAndCount({
      order: { tradeDate: "DESC" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });

    const nameMap = await this.companyNameMap(
      rows.flatMap((r) => [r.sellerCompanyId, r.buyerCompanyId])
    );

    const data = rows.map((r) => ({
      id: r.id,
      date: Number(r.tradeDate),
      sellerCompanyName: nameMap.get(r.sellerCompanyId) || "Unknown company",
      buyerCompanyName: nameMap.get(r.buyerCompanyId) || "Unknown company",
      units: Number(r.units) || 0,
      valueLAK: Number(r.valueLAK) || 0,
    }));

    return { data, total };
  }

  // Public, unauthenticated - PTBAE-PU "Participants" tab equivalent.
  async publicParticipants(
    page?: number,
    pageSize?: number
  ): Promise<{
    data: {
      id: number;
      facilityName: string;
      companyName: string;
      capacityDescription: string;
      year: number;
    }[];
    total: number;
  }> {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    const [rows, total] = await this.emissionParticipantRepo.findAndCount({
      order: { year: "DESC", createdAt: "DESC" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });

    const nameMap = await this.companyNameMap(rows.map((r) => r.companyId));

    const data = rows.map((r) => ({
      id: r.id,
      facilityName: r.facilityName,
      companyName: nameMap.get(r.companyId) || "Unknown company",
      capacityDescription: r.capacityDescription,
      year: r.year,
    }));

    return { data, total };
  }
}
