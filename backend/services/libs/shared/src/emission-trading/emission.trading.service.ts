import { BadRequestException, Injectable, Logger } from "@nestjs/common";
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
const DEMO_AS_OF = "2026-08-05T00:00:00.000Z";
const MARKET_STATUSES = ["synthetic_demo", "configured", "not_configured"] as const;
type MarketStatus = (typeof MARKET_STATUSES)[number];

type MarketFilters = {
  year?: number;
  series?: string;
  venueStatus?: MarketStatus;
  search?: string;
};

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
    const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
    const safePageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isFinite(pageSize) ? pageSize : 10));
    return { safePage, safePageSize };
  }

  private marketStatus(value?: string): MarketStatus {
    return MARKET_STATUSES.includes(value as MarketStatus) ? (value as MarketStatus) : "synthetic_demo";
  }

  private metadata(
    filters: Record<string, unknown>,
    pagination?: { page: number; pageSize: number; total: number },
    availability: "available" | "not_configured" | "not_available" = "available"
  ) {
    return {
      dataset_kind: "demo_synthetic",
      scenario: "Champa registry demonstration",
      as_of: DEMO_AS_OF,
      period: { start: "2021-01-01", end: "2026-12-31" },
      source: { type: "synthetic_demo", label: "Champa W1 seed v1" },
      methodology_version: "champa-parity-demo-v1",
      unit: "tCO2e",
      scale: 1,
      currency: "LAK",
      timezone: "UTC",
      filters,
      pagination: pagination && {
        page: pagination.page,
        page_size: pagination.pageSize,
        total_items: pagination.total,
        total_pages: Math.ceil(pagination.total / pagination.pageSize),
      },
      availability,
      formula_id: "ceiling_market_separate_namespace_v1",
      disclosure:
        "Synthetic demonstration data — not official Lao PDR statistics, legal authorisation, market activity, or certificate records. Scenario: Champa registry demonstration. As of: 2026-08-05T00:00:00.000Z. Coverage: 2021–2026.",
      ledger_boundary: {
        namespace: "emission_ceiling_market",
        certificate_bridge: "absent_by_default",
        statement: "Ceiling allocations and market trades are not certificate balances or certificate supply.",
      },
    };
  }

  private async companyNameMap(companyIds: number[]): Promise<Map<number, string>> {
    const uniqueIds = Array.from(new Set(companyIds)).filter(Boolean);
    if (!uniqueIds.length) return new Map();
    const companies = await this.companyRepo.find({ where: { companyId: In(uniqueIds) } });
    return new Map(companies.map((company) => [company.companyId, company.name]));
  }

  private matches(value: string | undefined | null, search?: string) {
    return !search || (value || "").toLocaleLowerCase().includes(search.toLocaleLowerCase());
  }

  async createCeiling(dto: EmissionCeilingCreateDto): Promise<EmissionCeilingEntity> {
    const ceiling = this.emissionCeilingRepo.create({
      ...dto,
      unit: dto.unit || "tCO2e",
      venueStatus: this.marketStatus(dto.venueStatus),
      availability: dto.availability || "not_configured",
    });
    return this.emissionCeilingRepo.save(ceiling);
  }

  async createTrading(dto: EmissionTradingCreateDto): Promise<EmissionTradingEntity> {
    if (dto.sellerCompanyId === dto.buyerCompanyId) {
      throw new BadRequestException("Seller and buyer must be different participants.");
    }
    if (Number(dto.units) <= 0) throw new BadRequestException("Trade quantity must be positive.");
    // W2 owns certificate ledger bridges. W7 intentionally refuses a bridge
    // reference until an approved adapter is handed over.
    if (dto.certificateBridgeEventId) {
      throw new BadRequestException("Certificate bridge is not configured for this market adapter.");
    }
    if (dto.idempotencyKey) {
      const existing = await this.emissionTradingRepo.findOne({ where: { idempotencyKey: dto.idempotencyKey } });
      if (existing) return existing;
    }
    const trading = this.emissionTradingRepo.create({
      ...dto,
      venueStatus: this.marketStatus(dto.venueStatus),
      settlementStatus: dto.settlementStatus || "not_applicable",
      certificateBridgeEventId: null,
    });
    return this.emissionTradingRepo.save(trading);
  }

  async createParticipant(dto: EmissionParticipantCreateDto): Promise<EmissionParticipantEntity> {
    const participant = this.emissionParticipantRepo.create({
      ...dto,
      participantStatus: dto.participantStatus || "active",
    });
    return this.emissionParticipantRepo.save(participant);
  }

  async publicSummary(filters: MarketFilters = {}) {
    const ceilings = (await this.emissionCeilingRepo.find()).filter((row) =>
      (!filters.year || row.year === filters.year) &&
      (!filters.series || (row.seriesName || row.sector || "").toLowerCase() === filters.series.toLowerCase()) &&
      (!filters.venueStatus || this.marketStatus(row.venueStatus) === filters.venueStatus)
    );
    const trades = (await this.emissionTradingRepo.find()).filter((row) =>
      (!filters.year || new Date(Number(row.tradeDate)).getUTCFullYear() === filters.year) &&
      (!filters.series || (row.seriesName || "").toLowerCase() === filters.series.toLowerCase()) &&
      (!filters.venueStatus || this.marketStatus(row.venueStatus) === filters.venueStatus)
    );
    const ceilingCompanyIds = new Set(ceilings.map((row) => row.companyId));
    const tradeCompanyIds = new Set(trades.flatMap((row) => [row.sellerCompanyId, row.buyerCompanyId]));
    const data = {
      configuration: {
        venue_status: this.marketStatus(filters.venueStatus),
        venue_name: this.marketStatus(filters.venueStatus) === "not_configured" ? null : "Synthetic demonstration market",
        policy_status: "not_configured",
        settlement_status: "not_applicable",
      },
      ceiling: { totalUnits: ceilings.reduce((sum, row) => sum + Number(row.units || 0), 0), companies: ceilingCompanyIds.size, unit: "tCO2e" },
      trading: {
        totalUnits: trades.reduce((sum, row) => sum + Number(row.units || 0), 0),
        totalValueLAK: trades.reduce((sum, row) => sum + Number(row.valueLAK || 0), 0),
        companies: tradeCompanyIds.size,
        unit: "tCO2e",
        currency: "LAK",
      },
      formula_id: "sum_filtered_ceiling_allocations_and_market_trades_v1",
    };
    return { data, meta: this.metadata(filters) };
  }

  async publicSeries(page?: number, pageSize?: number, filters: MarketFilters = {}) {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    const rows = await this.emissionCeilingRepo.find();
    const groups = new Map<string, { seriesName: string; year: number; units: number; companyIds: Set<number>; availability: string; venueStatus: MarketStatus; unit: string }>();
    rows.filter((row) =>
      (!filters.year || row.year === filters.year) &&
      (!filters.series || (row.seriesName || row.sector || "").toLowerCase().includes(filters.series.toLowerCase())) &&
      (!filters.venueStatus || this.marketStatus(row.venueStatus) === filters.venueStatus)
    ).forEach((row) => {
      const seriesName = row.seriesName || row.sector || "Not configured";
      const key = `${seriesName}::${row.year}`;
      const group = groups.get(key) || { seriesName, year: row.year, units: 0, companyIds: new Set<number>(), availability: row.availability || "not_configured", venueStatus: this.marketStatus(row.venueStatus), unit: row.unit || "tCO2e" };
      group.units += Number(row.units || 0);
      group.companyIds.add(row.companyId);
      groups.set(key, group);
    });
    const all = Array.from(groups.values()).sort((a, b) => b.year - a.year || a.seriesName.localeCompare(b.seriesName)).map((row) => ({
      record_id: `ceiling-series-${row.seriesName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${row.year}`,
      series_name: row.seriesName,
      year: row.year,
      allocated_units: row.units,
      unit: row.unit,
      participant_count: row.companyIds.size,
      exchange_available_units: row.availability === "available" ? null : null,
      availability: row.availability,
      venue_status: row.venueStatus,
      formula_id: "sum_ceiling_allocations_by_series_year_v1",
    }));
    const total = all.length;
    return { data: all.slice((safePage - 1) * safePageSize, safePage * safePageSize), meta: this.metadata(filters, { page: safePage, pageSize: safePageSize, total }) };
  }

  async publicTransactions(page?: number, pageSize?: number, filters: MarketFilters = {}) {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    const source = (await this.emissionTradingRepo.find({ order: { tradeDate: "DESC" } })).filter((row) =>
      (!filters.year || new Date(Number(row.tradeDate)).getUTCFullYear() === filters.year) &&
      (!filters.series || this.matches(row.seriesName, filters.series)) &&
      (!filters.venueStatus || this.marketStatus(row.venueStatus) === filters.venueStatus)
    );
    const names = await this.companyNameMap(source.flatMap((row) => [row.sellerCompanyId, row.buyerCompanyId]));
    const searched = source.filter((row) => this.matches(names.get(row.sellerCompanyId), filters.search) || this.matches(names.get(row.buyerCompanyId), filters.search) || this.matches(row.seriesName, filters.search));
    const total = searched.length;
    const data = searched.slice((safePage - 1) * safePageSize, safePage * safePageSize).map((row) => ({
      record_id: `market-trade-${row.id}`,
      date: Number(row.tradeDate),
      series_name: row.seriesName || null,
      seller: { record_id: `organisation-${row.sellerCompanyId}`, name: names.get(row.sellerCompanyId) || "Withheld" },
      buyer: { record_id: `organisation-${row.buyerCompanyId}`, name: names.get(row.buyerCompanyId) || "Withheld" },
      quantity: Number(row.units || 0),
      unit: "tCO2e",
      value: row.valueLAK === null || row.valueLAK === undefined ? null : Number(row.valueLAK),
      currency: "LAK",
      price_per_unit: Number(row.units) > 0 && row.valueLAK !== null && row.valueLAK !== undefined ? Number(row.valueLAK) / Number(row.units) : null,
      venue_status: this.marketStatus(row.venueStatus),
      settlement_status: row.settlementStatus || "not_applicable",
      ceiling_allocation_id: row.ceilingAllocationId || null,
      certificate_bridge: row.certificateBridgeEventId ? "configured" : "absent",
      formula_id: "market_trade_event_quantity_and_entered_lak_value_v1",
    }));
    return { data, meta: this.metadata(filters, { page: safePage, pageSize: safePageSize, total }) };
  }

  async publicParticipants(page?: number, pageSize?: number, filters: MarketFilters = {}) {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    const source = (await this.emissionParticipantRepo.find({ order: { year: "DESC", createdAt: "DESC" } })).filter((row) =>
      (!filters.year || row.year === filters.year) &&
      (!filters.series || this.matches(row.seriesName, filters.series))
    );
    const names = await this.companyNameMap(source.map((row) => row.companyId));
    const searched = source.filter((row) => this.matches(row.facilityName, filters.search) || this.matches(names.get(row.companyId), filters.search));
    const total = searched.length;
    const data = searched.slice((safePage - 1) * safePageSize, safePage * safePageSize).map((row) => ({
      record_id: `market-participant-${row.id}`,
      facility_name: row.facilityName,
      organisation: { record_id: `organisation-${row.companyId}`, name: names.get(row.companyId) || "Withheld" },
      capacity_description: row.capacityDescription,
      year: row.year,
      series_name: row.seriesName || null,
      sector: row.sector || null,
      participant_status: row.participantStatus || "active",
      dataset_kind: "demo_synthetic",
    }));
    return { data, meta: this.metadata(filters, { page: safePage, pageSize: safePageSize, total }) };
  }
}
