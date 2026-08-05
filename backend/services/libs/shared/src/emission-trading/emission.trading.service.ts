import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { EmissionCeilingEntity } from "../entities/emission.ceiling.entity";
import { EmissionTradingEntity } from "../entities/emission.trading.entity";
import { EmissionParticipantEntity } from "../entities/emission.participant.entity";
import { Company } from "../entities/company.entity";
import { EmissionCeilingCreateDto } from "../dto/emission.ceiling.create.dto";
import { EmissionCeilingUpdateDto } from "../dto/emission.ceiling.update.dto";
import { EmissionTradingCreateDto } from "../dto/emission.trading.create.dto";
import { EmissionTradingUpdateDto } from "../dto/emission.trading.update.dto";
import { EmissionParticipantCreateDto } from "../dto/emission.participant.create.dto";
import { EmissionParticipantUpdateDto } from "../dto/emission.participant.update.dto";
import { EmissionLifecycleEvent, EmissionLifecycleAction, isSettledTrade } from "./emission.lifecycle";

const MAX_PAGE_SIZE = 50;
const DEMO_AS_OF = "2026-08-05T00:00:00.000Z";
export const MARKET_STATUSES = ["synthetic_demo", "configured", "not_configured"] as const;
const SETTLEMENT_STATUSES = ["not_applicable", "not_configured", "configured", "pending", "settled", "completed", "finalized"] as const;
const AVAILABILITIES = ["available", "not_available", "not_configured"] as const;
type MarketStatus = (typeof MARKET_STATUSES)[number];
type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];
type Filters = { year?: number; series?: string; venueStatus?: MarketStatus; search?: string; status?: string };

@Injectable()
export class EmissionTradingService {
  constructor(
    @InjectRepository(EmissionCeilingEntity) private ceilingRepo: Repository<EmissionCeilingEntity>,
    @InjectRepository(EmissionTradingEntity) private tradeRepo: Repository<EmissionTradingEntity>,
    @InjectRepository(EmissionParticipantEntity) private participantRepo: Repository<EmissionParticipantEntity>,
    @InjectRepository(Company) private companyRepo: Repository<Company>
  ) {}

  private paging(page?: number, pageSize?: number) {
    return { page: Math.max(1, Number.isFinite(page) ? page! : 1), pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isFinite(pageSize) ? pageSize! : 10)) };
  }

  private venue(value?: string): MarketStatus {
    return MARKET_STATUSES.includes(value as MarketStatus) ? value as MarketStatus : "synthetic_demo";
  }

  private meta(filters: Record<string, unknown>, page?: number, pageSize?: number, total?: number) {
    return {
      dataset_kind: "demo_synthetic", scenario: "Champa registry demonstration", as_of: DEMO_AS_OF,
      period: { start: "2021-01-01", end: "2026-12-31" }, source: { type: "synthetic_demo", label: "Champa W1 seed v1" },
      methodology_version: "champa-parity-demo-v1", unit: "tCO2e", scale: 1, currency: "LAK", timezone: "UTC", filters,
      pagination: page !== undefined && pageSize !== undefined && total !== undefined ? { page, page_size: pageSize, total_items: total, total_pages: Math.ceil(total / pageSize) } : undefined,
      availability: "available", formula_id: "ceiling_market_separate_namespace_v1",
      disclosure: "Synthetic demonstration data — not official Lao PDR statistics, legal authorisation, market activity, or certificate records. Scenario: Champa registry demonstration. As of: 2026-08-05T00:00:00.000Z. Coverage: 2021–2026.",
      ledger_boundary: { namespace: "emission_ceiling_market", certificate_bridge: "absent_by_default", statement: "Ceiling allocations and market trades are not certificate balances or certificate supply." },
    };
  }

  private managementMeta(filters: Record<string, unknown>, page: number, pageSize: number, total: number) {
    return { ...this.meta(filters, page, pageSize, total), management: true, audit: "lifecycle_history_on_record" };
  }

  private async companyNames(ids: number[]) {
    const unique = Array.from(new Set(ids)).filter(Boolean);
    if (!unique.length) return new Map<number, string>();
    const companies = await this.companyRepo.find({ where: { companyId: In(unique) } });
    return new Map(companies.map((company) => [company.companyId, company.name]));
  }

  private match(value: string | null | undefined, search?: string) {
    return !search || (value || "").toLowerCase().includes(search.toLowerCase());
  }

  private finite(value: unknown, field: string, positive = false) {
    if (typeof value !== "number" || !Number.isFinite(value) || (positive && value <= 0)) throw new BadRequestException(`${field} must be ${positive ? "positive and " : ""}finite.`);
  }

  private integer(value: unknown, field: string, positive = false) {
    this.finite(value, field, positive);
    if (!Number.isInteger(value)) throw new BadRequestException(`${field} must be an integer.`);
  }

  private validVenue(value: string | undefined, fallback: MarketStatus) {
    const result = value || fallback;
    if (!MARKET_STATUSES.includes(result as MarketStatus)) throw new BadRequestException(`Unsupported venue status: ${result}.`);
    return result as MarketStatus;
  }

  private validSettlement(value: string | undefined, fallback: SettlementStatus) {
    const result = value || fallback;
    if (!SETTLEMENT_STATUSES.includes(result as SettlementStatus)) throw new BadRequestException(`Unsupported settlement status: ${result}.`);
    return result as SettlementStatus;
  }

  private validateCeiling(value: { companyId: number; year: number; units: number; unit?: string; venueStatus?: string; availability?: string }) {
    this.integer(value.companyId, "companyId", true); this.integer(value.year, "year"); this.finite(value.units, "units", true);
    if (value.year < 2000 || value.year > 2100) throw new BadRequestException("year must be between 2000 and 2100.");
    if (value.unit !== "tCO2e") throw new BadRequestException("Emission ceiling units must be tCO2e.");
    const venue = this.validVenue(value.venueStatus, "synthetic_demo");
    if (value.availability && !AVAILABILITIES.includes(value.availability as (typeof AVAILABILITIES)[number])) throw new BadRequestException(`Unsupported availability: ${value.availability}.`);
    if (venue === "not_configured" && value.availability === "available") throw new BadRequestException("A not-configured venue cannot expose available ceiling units.");
  }

  private validateParticipant(value: { companyId: number; facilityName: string; capacityDescription: string; year: number }) {
    this.integer(value.companyId, "companyId", true); this.integer(value.year, "year");
    if (value.year < 2000 || value.year > 2100) throw new BadRequestException("year must be between 2000 and 2100.");
    if (!value.facilityName?.trim() || !value.capacityDescription?.trim()) throw new BadRequestException("Facility and capacity are required.");
  }

  private validateTrade(value: { sellerCompanyId: number; buyerCompanyId: number; units: number; valueLAK?: number; tradeDate: number; currency?: string; venueStatus?: string; settlementStatus?: string; certificateBridgeEventId?: string | null }) {
    this.integer(value.sellerCompanyId, "sellerCompanyId", true); this.integer(value.buyerCompanyId, "buyerCompanyId", true);
    if (value.sellerCompanyId === value.buyerCompanyId) throw new BadRequestException("Seller and buyer must be different participants.");
    this.finite(value.units, "units", true); this.finite(value.tradeDate, "tradeDate", true);
    if (value.valueLAK !== undefined && value.valueLAK !== null) { this.finite(value.valueLAK, "valueLAK"); if (value.valueLAK < 0) throw new BadRequestException("valueLAK cannot be negative."); }
    if (value.currency && value.currency !== "LAK") throw new BadRequestException("Market trade currency must be LAK.");
    if (value.certificateBridgeEventId) throw new BadRequestException("Certificate bridge is not configured for this market adapter.");
    const venue = this.validVenue(value.venueStatus, "synthetic_demo"); const settlement = this.validSettlement(value.settlementStatus, "not_applicable");
    if (venue !== "configured" && ["configured", "settled", "completed", "finalized"].includes(settlement)) throw new BadRequestException("Configured or settled trades require a configured venue.");
    return { venueStatus: venue, settlementStatus: settlement };
  }

  private event(action: EmissionLifecycleAction, fromStatus: EmissionLifecycleEvent["fromStatus"], toStatus: EmissionLifecycleEvent["toStatus"], actorId?: number, reason?: string): EmissionLifecycleEvent {
    return { action, fromStatus, toStatus, actorId: actorId ?? null, reason: reason?.trim() || null, at: Date.now() };
  }

  private append(record: { lifecycleHistory?: EmissionLifecycleEvent[] }, event: EmissionLifecycleEvent) {
    record.lifecycleHistory = [...(record.lifecycleHistory || []), event];
  }

  private reason(value?: string) { if (!value?.trim()) throw new BadRequestException("A lifecycle reason is required."); return value.trim(); }
  private async ceiling(id: number) { const row = await this.ceilingRepo.findOne({ where: { id } }); if (!row) throw new NotFoundException("Emission ceiling not found."); return row; }
  private async participant(id: number) { const row = await this.participantRepo.findOne({ where: { id } }); if (!row) throw new NotFoundException("Emission participant not found."); return row; }
  private async trade(id: number) { const row = await this.tradeRepo.findOne({ where: { id } }); if (!row) throw new NotFoundException("Emission trade not found."); return row; }
  private slice<T>(rows: T[], page?: number, pageSize?: number, filters: Filters = {}) { const p = this.paging(page, pageSize); return { data: rows.slice((p.page - 1) * p.pageSize, p.page * p.pageSize), meta: this.managementMeta(filters, p.page, p.pageSize, rows.length) }; }

  async createCeiling(dto: EmissionCeilingCreateDto, actorId?: number) {
    const row = this.ceilingRepo.create({ ...dto, unit: dto.unit || "tCO2e", venueStatus: this.validVenue(dto.venueStatus, "synthetic_demo"), availability: dto.availability || "not_configured", lifecycleStatus: "active", createdBy: actorId ?? null, lifecycleHistory: [this.event("create", null, "active", actorId)] });
    this.validateCeiling(row); return this.ceilingRepo.save(row);
  }

  async createTrading(dto: EmissionTradingCreateDto, actorId?: number) {
    const state = this.validateTrade(dto);
    if (dto.idempotencyKey) { const existing = await this.tradeRepo.findOne({ where: { idempotencyKey: dto.idempotencyKey } }); if (existing) return existing; }
    const row = this.tradeRepo.create({ ...dto, currency: dto.currency || "LAK", ...state, lifecycleStatus: "active", createdBy: actorId ?? null, certificateBridgeEventId: null, lifecycleHistory: [this.event("create", null, "active", actorId)] });
    return this.tradeRepo.save(row);
  }

  async createParticipant(dto: EmissionParticipantCreateDto, actorId?: number) {
    const row = this.participantRepo.create({ ...dto, participantStatus: dto.participantStatus || "active", lifecycleStatus: "active", createdBy: actorId ?? null, lifecycleHistory: [this.event("create", null, "active", actorId)] });
    this.validateParticipant(row); return this.participantRepo.save(row);
  }

  async listCeilings(page?: number, pageSize?: number, filters: Filters = {}) {
    const rows = await this.ceilingRepo.find({ order: { createdAt: "DESC" } }); const names = await this.companyNames(rows.map((r) => r.companyId));
    const result = rows.filter((r) => (!filters.year || r.year === filters.year) && (!filters.series || this.match(r.seriesName || r.sector, filters.series)) && (!filters.venueStatus || this.venue(r.venueStatus) === filters.venueStatus) && (!filters.status || filters.status === "all" || (r.lifecycleStatus || "active") === filters.status) && (this.match(r.seriesName, filters.search) || this.match(r.sector, filters.search) || this.match(names.get(r.companyId), filters.search))).map((r) => ({ ...r, companyName: names.get(r.companyId) || null }));
    return this.slice(result, page, pageSize, filters);
  }
  async getCeiling(id: number) { const row = await this.ceiling(id); return { data: row, meta: this.managementMeta({ id }, 1, 1, 1) }; }
  async getCeilingHistory(id: number) { const row = await this.ceiling(id); return { data: row.lifecycleHistory || [], meta: this.managementMeta({ id }, 1, 1, (row.lifecycleHistory || []).length) }; }
  async updateCeiling(id: number, dto: EmissionCeilingUpdateDto, actorId?: number) {
    const row = await this.ceiling(id); if (row.lifecycleStatus === "archived") throw new BadRequestException("Archived emission ceilings cannot be edited.");
    const { reason, ...changes } = dto; const next = { ...row, ...changes, unit: changes.unit || row.unit || "tCO2e", venueStatus: changes.venueStatus || row.venueStatus || "synthetic_demo", availability: changes.availability || row.availability || "not_configured" }; this.validateCeiling(next);
    Object.assign(row, changes, { updatedAt: Date.now(), updatedBy: actorId ?? null, lifecycleReason: reason?.trim() || null }); this.append(row, this.event("update", "active", "active", actorId, reason)); return this.ceilingRepo.save(row);
  }
  async archiveCeiling(id: number, reason: string, actorId?: number) {
    const row = await this.ceiling(id); const why = this.reason(reason); if (row.lifecycleStatus === "archived") throw new BadRequestException("Emission ceiling is already archived."); const now = Date.now(); Object.assign(row, { lifecycleStatus: "archived", lifecycleReason: why, archivedAt: now, archivedBy: actorId ?? null, updatedAt: now, updatedBy: actorId ?? null }); this.append(row, this.event("archive", "active", "archived", actorId, why)); return this.ceilingRepo.save(row);
  }

  async listParticipants(page?: number, pageSize?: number, filters: Filters = {}) {
    const rows = await this.participantRepo.find({ order: { year: "DESC", createdAt: "DESC" } }); const names = await this.companyNames(rows.map((r) => r.companyId));
    const result = rows.filter((r) => (!filters.year || r.year === filters.year) && (!filters.series || this.match(r.seriesName, filters.series)) && (!filters.status || filters.status === "all" || (r.lifecycleStatus || "active") === filters.status) && (this.match(r.facilityName, filters.search) || this.match(names.get(r.companyId), filters.search))).map((r) => ({ ...r, companyName: names.get(r.companyId) || null }));
    return this.slice(result, page, pageSize, filters);
  }
  async getParticipant(id: number) { const row = await this.participant(id); return { data: row, meta: this.managementMeta({ id }, 1, 1, 1) }; }
  async getParticipantHistory(id: number) { const row = await this.participant(id); return { data: row.lifecycleHistory || [], meta: this.managementMeta({ id }, 1, 1, (row.lifecycleHistory || []).length) }; }
  async updateParticipant(id: number, dto: EmissionParticipantUpdateDto, actorId?: number) {
    const row = await this.participant(id); if (row.lifecycleStatus === "archived") throw new BadRequestException("Archived emission participants cannot be edited."); const { reason, ...changes } = dto; this.validateParticipant({ ...row, ...changes }); Object.assign(row, changes, { updatedAt: Date.now(), updatedBy: actorId ?? null, lifecycleReason: reason?.trim() || null }); this.append(row, this.event("update", "active", "active", actorId, reason)); return this.participantRepo.save(row);
  }
  async archiveParticipant(id: number, reason: string, actorId?: number) {
    const row = await this.participant(id); const why = this.reason(reason); if (row.lifecycleStatus === "archived") throw new BadRequestException("Emission participant is already archived."); const now = Date.now(); Object.assign(row, { lifecycleStatus: "archived", participantStatus: "archived", lifecycleReason: why, archivedAt: now, archivedBy: actorId ?? null, updatedAt: now, updatedBy: actorId ?? null }); this.append(row, this.event("archive", "active", "archived", actorId, why)); return this.participantRepo.save(row);
  }

  async listTrades(page?: number, pageSize?: number, filters: Filters = {}) {
    const rows = await this.tradeRepo.find({ order: { tradeDate: "DESC" } }); const names = await this.companyNames(rows.flatMap((r) => [r.sellerCompanyId, r.buyerCompanyId]));
    const result = rows.filter((r) => (!filters.year || new Date(Number(r.tradeDate)).getUTCFullYear() === filters.year) && (!filters.series || this.match(r.seriesName, filters.series)) && (!filters.venueStatus || this.venue(r.venueStatus) === filters.venueStatus) && (!filters.status || filters.status === "all" || (r.lifecycleStatus || "active") === filters.status) && (this.match(names.get(r.sellerCompanyId), filters.search) || this.match(names.get(r.buyerCompanyId), filters.search) || this.match(r.seriesName, filters.search))).map((r) => ({ ...r, sellerName: names.get(r.sellerCompanyId) || null, buyerName: names.get(r.buyerCompanyId) || null }));
    return this.slice(result, page, pageSize, filters);
  }
  async getTrade(id: number) { const row = await this.trade(id); return { data: row, meta: this.managementMeta({ id }, 1, 1, 1) }; }
  async getTradeHistory(id: number) { const row = await this.trade(id); return { data: row.lifecycleHistory || [], meta: this.managementMeta({ id }, 1, 1, (row.lifecycleHistory || []).length) }; }
  async updateTrade(id: number, dto: EmissionTradingUpdateDto, actorId?: number) {
    const row = await this.trade(id); if ((row.lifecycleStatus || "active") !== "active") throw new BadRequestException("Only active trades can be edited."); if (isSettledTrade(row.settlementStatus)) throw new BadRequestException("Settled trades are immutable; use reversal for a correction.");
    const { reason, ...changes } = dto; const state = this.validateTrade({ ...row, ...changes }); Object.assign(row, changes, state, { currency: changes.currency || row.currency || "LAK", updatedAt: Date.now(), updatedBy: actorId ?? null, lifecycleReason: reason?.trim() || null }); this.append(row, this.event("update", "active", "active", actorId, reason)); return this.tradeRepo.save(row);
  }
  async voidTrade(id: number, reason: string, actorId?: number) {
    const row = await this.trade(id); const why = this.reason(reason); if ((row.lifecycleStatus || "active") !== "active") throw new BadRequestException("Only active trades can be voided."); if (isSettledTrade(row.settlementStatus)) throw new BadRequestException("Settled trades cannot be voided; use reversal to preserve settlement history."); const now = Date.now(); Object.assign(row, { lifecycleStatus: "voided", settlementStatus: "voided", lifecycleReason: why, updatedAt: now, updatedBy: actorId ?? null }); this.append(row, this.event("void", "active", "voided", actorId, why)); return this.tradeRepo.save(row);
  }
  async reverseTrade(id: number, reason: string, actorId?: number) {
    const original = await this.trade(id); const why = this.reason(reason); if ((original.lifecycleStatus || "active") !== "active") throw new BadRequestException("Only active trades can be reversed."); const originalId = original.id; Object.assign(original, { lifecycleStatus: "reversed", settlementStatus: "reversed", lifecycleReason: why, updatedAt: Date.now(), updatedBy: actorId ?? null }); this.append(original, this.event("reverse", "active", "reversed", actorId, why)); const savedOriginal = await this.tradeRepo.save(original);
    const reversal = this.tradeRepo.create({ sellerCompanyId: original.buyerCompanyId, buyerCompanyId: original.sellerCompanyId, units: -Number(original.units), valueLAK: original.valueLAK == null ? original.valueLAK : -Number(original.valueLAK), currency: original.currency || "LAK", seriesName: original.seriesName, ceilingAllocationId: original.ceilingAllocationId, venueStatus: this.venue(original.venueStatus), settlementStatus: "reversed", certificateBridgeEventId: null, idempotencyKey: null, tradeDate: original.tradeDate, lifecycleStatus: "reversed", lifecycleReason: why, updatedBy: actorId ?? null, reversalOfTradeId: originalId, lifecycleHistory: [this.event("reverse", null, "reversed", actorId, why)] });
    const savedReversal = await this.tradeRepo.save(reversal); return { original: savedOriginal, reversal: savedReversal };
  }

  async publicSummary(filters: Omit<Filters, "status" | "search"> = {}) {
    const ceilings = (await this.ceilingRepo.find()).filter((r) => r.lifecycleStatus !== "archived" && (!filters.year || r.year === filters.year) && (!filters.series || (r.seriesName || r.sector || "").toLowerCase() === filters.series.toLowerCase()) && (!filters.venueStatus || this.venue(r.venueStatus) === filters.venueStatus));
    const trades = (await this.tradeRepo.find()).filter((r) => r.lifecycleStatus !== "voided" && (!filters.year || new Date(Number(r.tradeDate)).getUTCFullYear() === filters.year) && (!filters.series || (r.seriesName || "").toLowerCase() === filters.series.toLowerCase()) && (!filters.venueStatus || this.venue(r.venueStatus) === filters.venueStatus));
    const companies = new Set(ceilings.map((r) => r.companyId)); const tradeCompanies = new Set(trades.flatMap((r) => [r.sellerCompanyId, r.buyerCompanyId]));
    return { data: { configuration: { venue_status: this.venue(filters.venueStatus), venue_name: this.venue(filters.venueStatus) === "not_configured" ? null : "Synthetic demonstration market", policy_status: "not_configured", settlement_status: "not_applicable" }, ceiling: { totalUnits: ceilings.reduce((s, r) => s + Number(r.units || 0), 0), companies: companies.size, unit: "tCO2e" }, trading: { totalUnits: trades.reduce((s, r) => s + Number(r.units || 0), 0), totalValueLAK: trades.reduce((s, r) => s + Number(r.valueLAK || 0), 0), companies: tradeCompanies.size, unit: "tCO2e", currency: "LAK" }, formula_id: "sum_filtered_ceiling_allocations_and_market_trades_v1" }, meta: this.meta(filters) };
  }

  async publicSeries(page?: number, pageSize?: number, filters: Omit<Filters, "status" | "search"> = {}) {
    const p = this.paging(page, pageSize); const groups = new Map<string, { seriesName: string; year: number; units: number; companies: Set<number>; availability: string; venueStatus: MarketStatus; unit: string }>();
    (await this.ceilingRepo.find()).filter((r) => r.lifecycleStatus !== "archived" && (!filters.year || r.year === filters.year) && (!filters.series || (r.seriesName || r.sector || "").toLowerCase().includes(filters.series.toLowerCase())) && (!filters.venueStatus || this.venue(r.venueStatus) === filters.venueStatus)).forEach((r) => { const seriesName = r.seriesName || r.sector || "Not configured"; const key = `${seriesName}::${r.year}`; const group = groups.get(key) || { seriesName, year: r.year, units: 0, companies: new Set<number>(), availability: r.availability || "not_configured", venueStatus: this.venue(r.venueStatus), unit: r.unit || "tCO2e" }; group.units += Number(r.units || 0); group.companies.add(r.companyId); groups.set(key, group); });
    const all = Array.from(groups.values()).sort((a, b) => b.year - a.year || a.seriesName.localeCompare(b.seriesName)).map((r) => ({ record_id: `ceiling-series-${r.seriesName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${r.year}`, series_name: r.seriesName, year: r.year, allocated_units: r.units, unit: r.unit, participant_count: r.companies.size, exchange_available_units: null, availability: r.availability, venue_status: r.venueStatus, formula_id: "sum_ceiling_allocations_by_series_year_v1" }));
    return { data: all.slice((p.page - 1) * p.pageSize, p.page * p.pageSize), meta: this.meta(filters, p.page, p.pageSize, all.length) };
  }

  async publicTransactions(page?: number, pageSize?: number, filters: Omit<Filters, "status"> = {}) {
    const p = this.paging(page, pageSize); const source = (await this.tradeRepo.find({ order: { tradeDate: "DESC" } })).filter((r) => r.lifecycleStatus !== "voided" && (!filters.year || new Date(Number(r.tradeDate)).getUTCFullYear() === filters.year) && (!filters.series || this.match(r.seriesName, filters.series)) && (!filters.venueStatus || this.venue(r.venueStatus) === filters.venueStatus)); const names = await this.companyNames(source.flatMap((r) => [r.sellerCompanyId, r.buyerCompanyId])); const searched = source.filter((r) => this.match(names.get(r.sellerCompanyId), filters.search) || this.match(names.get(r.buyerCompanyId), filters.search) || this.match(r.seriesName, filters.search));
    const data = searched.slice((p.page - 1) * p.pageSize, p.page * p.pageSize).map((r) => ({ record_id: `market-trade-${r.id}`, date: Number(r.tradeDate), series_name: r.seriesName || null, seller: { record_id: `organisation-${r.sellerCompanyId}`, name: names.get(r.sellerCompanyId) || "Withheld" }, buyer: { record_id: `organisation-${r.buyerCompanyId}`, name: names.get(r.buyerCompanyId) || "Withheld" }, quantity: Number(r.units || 0), unit: "tCO2e", value: r.valueLAK == null ? null : Number(r.valueLAK), currency: r.currency || "LAK", price_per_unit: Number(r.units) !== 0 && r.valueLAK != null ? Number(r.valueLAK) / Number(r.units) : null, venue_status: this.venue(r.venueStatus), settlement_status: r.settlementStatus || "not_applicable", lifecycle_status: r.lifecycleStatus || "active", reversal_of_trade_id: r.reversalOfTradeId || null, ceiling_allocation_id: r.ceilingAllocationId || null, certificate_bridge: r.certificateBridgeEventId ? "configured" : "absent", formula_id: "market_trade_event_quantity_and_entered_lak_value_v1" }));
    return { data, meta: this.meta(filters, p.page, p.pageSize, searched.length) };
  }

  async publicParticipants(page?: number, pageSize?: number, filters: Omit<Filters, "status"> = {}) {
    const p = this.paging(page, pageSize); const source = (await this.participantRepo.find({ order: { year: "DESC", createdAt: "DESC" } })).filter((r) => r.lifecycleStatus !== "archived" && (!filters.year || r.year === filters.year) && (!filters.series || this.match(r.seriesName, filters.series))); const names = await this.companyNames(source.map((r) => r.companyId)); const searched = source.filter((r) => this.match(r.facilityName, filters.search) || this.match(names.get(r.companyId), filters.search)); const data = searched.slice((p.page - 1) * p.pageSize, p.page * p.pageSize).map((r) => ({ record_id: `market-participant-${r.id}`, facility_name: r.facilityName, organisation: { record_id: `organisation-${r.companyId}`, name: names.get(r.companyId) || "Withheld" }, capacity_description: r.capacityDescription, year: r.year, series_name: r.seriesName || null, sector: r.sector || null, participant_status: r.participantStatus || "active", dataset_kind: "demo_synthetic" })); return { data, meta: this.meta(filters, p.page, p.pageSize, searched.length) };
  }
}
