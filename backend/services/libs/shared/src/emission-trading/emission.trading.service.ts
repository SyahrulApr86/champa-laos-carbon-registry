import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { EmissionCeilingEntity } from "../entities/emission.ceiling.entity";
import { EmissionTradingEntity } from "../entities/emission.trading.entity";
import { EmissionParticipantEntity } from "../entities/emission.participant.entity";
import { Company } from "../entities/company.entity";
import { User } from "../entities/user.entity";
import { EmissionCeilingCreateDto } from "../dto/emission.ceiling.create.dto";
import { EmissionCeilingUpdateDto } from "../dto/emission.ceiling.update.dto";
import { EmissionTradingCreateDto } from "../dto/emission.trading.create.dto";
import { EmissionTradingUpdateDto } from "../dto/emission.trading.update.dto";
import { EmissionParticipantCreateDto } from "../dto/emission.participant.create.dto";
import { EmissionParticipantUpdateDto } from "../dto/emission.participant.update.dto";
import {
  EmissionLifecycleEvent,
  EmissionLifecycleEventAction,
  isSettledTrade,
} from "./emission.lifecycle";

const MAX_PAGE_SIZE = 50;
const DEMO_AS_OF = "2026-08-05T00:00:00.000Z";
export const MARKET_STATUSES = [
  "synthetic_demo",
  "configured",
  "not_configured",
] as const;
const CEILING_AVAILABILITIES = [
  "available",
  "not_available",
  "not_configured",
] as const;
const SETTLEMENT_STATUSES = [
  "not_applicable",
  "not_configured",
  "configured",
  "pending",
  "settled",
  "completed",
  "finalized",
] as const;
type MarketStatus = (typeof MARKET_STATUSES)[number];
type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

type MarketFilters = {
  year?: number;
  series?: string;
  venueStatus?: MarketStatus;
  search?: string;
};

type ManagementFilters = MarketFilters & { status?: string };
type Actor = Pick<User, "id"> | { id?: number } | number | undefined;

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
    const safePage = Math.max(1, Number.isFinite(page) ? page! : 1);
    const safePageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number.isFinite(pageSize) ? pageSize! : 10)
    );
    return { safePage, safePageSize };
  }

  private marketStatus(value?: string): MarketStatus {
    return MARKET_STATUSES.includes(value as MarketStatus)
      ? (value as MarketStatus)
      : "synthetic_demo";
  }

  private metadata(
    filters: Record<string, unknown>,
    pagination?: { page: number; pageSize: number; total: number }
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
      availability: "available",
      formula_id: "ceiling_market_separate_namespace_v1",
      disclosure:
        "Synthetic demonstration data — not official Lao PDR market activity, authorisation, or certificate records. Scenario: Champa registry demonstration. As of: 2026-08-05T00:00:00.000Z. Coverage: 2021–2026.",
      ledger_boundary: {
        namespace: "emission_ceiling_market",
        certificate_bridge: "absent_by_default",
        statement:
          "Ceiling allocations and market trades are not certificate balances or certificate supply.",
      },
    };
  }

  private managementMeta(
    filters: Record<string, unknown>,
    page: number,
    pageSize: number,
    total: number
  ) {
    return {
      ...this.metadata(filters, { page, pageSize, total }),
      management: true,
      audit: "lifecycle_history_on_record",
    };
  }

  private async companyNameMap(companyIds: number[]): Promise<Map<number, string>> {
    const uniqueIds = Array.from(new Set(companyIds)).filter(Boolean);
    if (!uniqueIds.length) return new Map();
    const companies = await this.companyRepo.find({
      where: { companyId: In(uniqueIds) },
    });
    return new Map(companies.map((company) => [company.companyId, company.name]));
  }

  private matches(value: string | undefined | null, search?: string) {
    return (
      !search ||
      (value || "").toLocaleLowerCase().includes(search.toLocaleLowerCase())
    );
  }

  private actorId(actor: Actor): number | null {
    return typeof actor === "number" ? actor : actor?.id ?? null;
  }

  private addLifecycleEvent(
    record: { lifecycleHistory?: EmissionLifecycleEvent[] },
    action: EmissionLifecycleEventAction,
    actor: Actor,
    reason?: string,
    changes?: Record<string, unknown>,
    relatedRecordId?: number
  ) {
    record.lifecycleHistory = [
      ...(record.lifecycleHistory || []),
      {
        action,
        at: Date.now(),
        actorId: this.actorId(actor),
        reason: reason?.trim() || null,
        ...(changes ? { changes } : {}),
        ...(relatedRecordId === undefined ? {} : { relatedRecordId }),
      },
    ];
  }

  private requireReason(reason?: string) {
    if (!reason?.trim()) {
      throw new BadRequestException("A lifecycle reason is required.");
    }
    return reason.trim();
  }

  private assertFinite(value: unknown, field: string, positive = false) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new BadRequestException(`${field} must be a finite number.`);
    }
    if (positive && value <= 0) {
      throw new BadRequestException(`${field} must be positive.`);
    }
  }

  private assertInteger(value: unknown, field: string, positive = false) {
    this.assertFinite(value, field, positive);
    if (!Number.isInteger(value)) {
      throw new BadRequestException(`${field} must be an integer.`);
    }
  }

  private validateCeiling(input: {
    companyId: number;
    year: number;
    units: number;
    unit?: string;
    venueStatus?: string;
    availability?: string;
  }) {
    this.assertInteger(input.companyId, "companyId", true);
    this.assertInteger(input.year, "year");
    if (input.year < 2000 || input.year > 2100) {
      throw new BadRequestException("year must be between 2000 and 2100.");
    }
    this.assertFinite(input.units, "units", true);
    if (input.unit !== "tCO2e") {
      throw new BadRequestException("Emission ceiling units must be tCO2e.");
    }
    const venueStatus = this.marketStatus(input.venueStatus);
    if (
      input.availability &&
      !CEILING_AVAILABILITIES.includes(
        input.availability as (typeof CEILING_AVAILABILITIES)[number]
      )
    ) {
      throw new BadRequestException(`Unsupported availability: ${input.availability}.`);
    }
    if (venueStatus === "not_configured" && input.availability === "available") {
      throw new BadRequestException(
        "A not-configured venue cannot expose available ceiling units."
      );
    }
  }

  private validateParticipant(input: {
    companyId: number;
    facilityName: string;
    capacityDescription: string;
    year: number;
  }) {
    this.assertInteger(input.companyId, "companyId", true);
    this.assertInteger(input.year, "year");
    if (input.year < 2000 || input.year > 2100) {
      throw new BadRequestException("year must be between 2000 and 2100.");
    }
    if (!input.facilityName?.trim()) {
      throw new BadRequestException("facilityName is required.");
    }
    if (!input.capacityDescription?.trim()) {
      throw new BadRequestException("capacityDescription is required.");
    }
  }

  private validateTrade(input: {
    sellerCompanyId: number;
    buyerCompanyId: number;
    units: number;
    valueLAK?: number;
    currency?: string;
    tradeDate: number;
    venueStatus?: string;
    settlementStatus?: string;
    certificateBridgeEventId?: string | null;
  }) {
    this.assertInteger(input.sellerCompanyId, "sellerCompanyId", true);
    this.assertInteger(input.buyerCompanyId, "buyerCompanyId", true);
    if (input.sellerCompanyId === input.buyerCompanyId) {
      throw new BadRequestException("Seller and buyer must be different participants.");
    }
    this.assertFinite(input.units, "units", true);
    if (input.valueLAK !== undefined && input.valueLAK !== null) {
      this.assertFinite(input.valueLAK, "valueLAK");
      if (input.valueLAK < 0) {
        throw new BadRequestException("valueLAK cannot be negative.");
      }
    }
    this.assertFinite(input.tradeDate, "tradeDate", true);
    if (input.certificateBridgeEventId) {
      throw new BadRequestException(
        "Certificate bridge is not configured for this market adapter."
      );
    }
    if (input.currency && input.currency !== "LAK") {
      throw new BadRequestException("Market trade currency must be LAK.");
    }
    const venueStatus = this.marketStatus(input.venueStatus);
    const settlementStatus = this.settlementStatus(input.settlementStatus);
    if (
      venueStatus !== "configured" &&
      ["configured", "settled", "completed", "finalized"].includes(settlementStatus)
    ) {
      throw new BadRequestException(
        "Configured or settled trades require a configured venue."
      );
    }
    return { venueStatus, settlementStatus };
  }

  private settlementStatus(value?: string): SettlementStatus {
    return SETTLEMENT_STATUSES.includes(value as SettlementStatus)
      ? (value as SettlementStatus)
      : "not_applicable";
  }

  private async findCeiling(id: number) {
    const row = await this.emissionCeilingRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Emission ceiling allocation not found.");
    return row;
  }

  private async findParticipant(id: number) {
    const row = await this.emissionParticipantRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Emission participant/facility not found.");
    return row;
  }

  private async findTrade(id: number) {
    const row = await this.emissionTradingRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Emission market trade not found.");
    return row;
  }

  private async paginateManagement<T>(
    rows: T[],
    page: number | undefined,
    pageSize: number | undefined,
    filters: ManagementFilters
  ) {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    return {
      data: rows.slice(
        (safePage - 1) * safePageSize,
        safePage * safePageSize
      ),
      meta: this.managementMeta(filters, safePage, safePageSize, rows.length),
    };
  }

  async createCeiling(dto: EmissionCeilingCreateDto, actor?: Actor) {
    const ceiling = this.emissionCeilingRepo.create({
      ...dto,
      unit: dto.unit || "tCO2e",
      venueStatus: this.marketStatus(dto.venueStatus),
      availability: dto.availability || "not_configured",
      lifecycleStatus: "active",
      createdBy: this.actorId(actor),
      updatedBy: this.actorId(actor),
      lifecycleHistory: [],
    });
    this.validateCeiling(ceiling);
    this.addLifecycleEvent(ceiling, "created", actor);
    return this.emissionCeilingRepo.save(ceiling);
  }

  async createTrading(dto: EmissionTradingCreateDto, actor?: Actor) {
    if (dto.idempotencyKey) {
      const existing = await this.emissionTradingRepo.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }
    const { venueStatus, settlementStatus } = this.validateTrade(dto);
    const trade = this.emissionTradingRepo.create({
      ...dto,
      currency: dto.currency || "LAK",
      venueStatus,
      settlementStatus,
      certificateBridgeEventId: null,
      lifecycleStatus: "active",
      createdBy: this.actorId(actor),
      updatedBy: this.actorId(actor),
      lifecycleHistory: [],
    });
    this.addLifecycleEvent(trade, "created", actor);
    return this.emissionTradingRepo.save(trade);
  }

  async createParticipant(dto: EmissionParticipantCreateDto, actor?: Actor) {
    const participant = this.emissionParticipantRepo.create({
      ...dto,
      participantStatus: dto.participantStatus || "active",
      lifecycleStatus: "active",
      createdBy: this.actorId(actor),
      updatedBy: this.actorId(actor),
      lifecycleHistory: [],
    });
    this.validateParticipant(participant);
    this.addLifecycleEvent(participant, "created", actor);
    return this.emissionParticipantRepo.save(participant);
  }

  async listCeilings(page?: number, pageSize?: number, filters: ManagementFilters = {}) {
    const rows = await this.emissionCeilingRepo.find({ order: { createdAt: "DESC" } });
    const names = await this.companyNameMap(rows.map((row) => row.companyId));
    const filtered = rows
      .filter(
        (row) =>
          (!filters.year || row.year === filters.year) &&
          (!filters.series ||
            this.matches(row.seriesName || row.sector, filters.series)) &&
          (!filters.venueStatus ||
            this.marketStatus(row.venueStatus) === filters.venueStatus) &&
          (!filters.status ||
            filters.status === "all" ||
            (row.lifecycleStatus || "active") === filters.status) &&
          (this.matches(row.seriesName, filters.search) ||
            this.matches(row.sector, filters.search) ||
            this.matches(names.get(row.companyId), filters.search))
      )
      .map((row) => ({ ...row, companyName: names.get(row.companyId) || null }));
    return this.paginateManagement(filtered, page, pageSize, filters);
  }

  async getCeiling(id: number) {
    return { data: await this.findCeiling(id), meta: this.managementMeta({ id }, 1, 1, 1) };
  }

  async getCeilingHistory(id: number) {
    const row = await this.findCeiling(id);
    return {
      data: row.lifecycleHistory || [],
      meta: this.managementMeta({ id }, 1, 1, (row.lifecycleHistory || []).length),
    };
  }

  async updateCeiling(id: number, dto: EmissionCeilingUpdateDto, actor?: Actor) {
    const row = await this.findCeiling(id);
    if (row.lifecycleStatus === "archived") {
      throw new ConflictException("Archived emission ceilings cannot be edited.");
    }
    const { reason, ...changes } = dto;
    const next = {
      ...row,
      ...changes,
      unit: changes.unit || row.unit || "tCO2e",
      venueStatus: changes.venueStatus || row.venueStatus || "synthetic_demo",
      availability: changes.availability || row.availability || "not_configured",
    };
    this.validateCeiling(next);
    Object.assign(row, changes, {
      updatedAt: Date.now(),
      updatedBy: this.actorId(actor),
      lifecycleReason: reason?.trim() || null,
    });
    this.addLifecycleEvent(row, "updated", actor, reason, changes);
    return this.emissionCeilingRepo.save(row);
  }

  async archiveCeiling(id: number, reason: string | undefined, actor?: Actor) {
    const row = await this.findCeiling(id);
    const lifecycleReason = this.requireReason(reason);
    if (row.lifecycleStatus === "archived") {
      throw new ConflictException("Emission ceiling is already archived.");
    }
    const now = Date.now();
    Object.assign(row, {
      lifecycleStatus: "archived",
      lifecycleReason,
      archivedAt: now,
      archivedBy: this.actorId(actor),
      updatedAt: now,
      updatedBy: this.actorId(actor),
    });
    this.addLifecycleEvent(row, "archived", actor, lifecycleReason);
    return this.emissionCeilingRepo.save(row);
  }

  async listParticipants(page?: number, pageSize?: number, filters: ManagementFilters = {}) {
    const rows = await this.emissionParticipantRepo.find({
      order: { year: "DESC", createdAt: "DESC" },
    });
    const names = await this.companyNameMap(rows.map((row) => row.companyId));
    const filtered = rows
      .filter(
        (row) =>
          (!filters.year || row.year === filters.year) &&
          (!filters.series || this.matches(row.seriesName, filters.series)) &&
          (!filters.status ||
            filters.status === "all" ||
            (row.lifecycleStatus || "active") === filters.status) &&
          (this.matches(row.facilityName, filters.search) ||
            this.matches(names.get(row.companyId), filters.search))
      )
      .map((row) => ({ ...row, companyName: names.get(row.companyId) || null }));
    return this.paginateManagement(filtered, page, pageSize, filters);
  }

  async getParticipant(id: number) {
    return { data: await this.findParticipant(id), meta: this.managementMeta({ id }, 1, 1, 1) };
  }

  async getParticipantHistory(id: number) {
    const row = await this.findParticipant(id);
    return {
      data: row.lifecycleHistory || [],
      meta: this.managementMeta({ id }, 1, 1, (row.lifecycleHistory || []).length),
    };
  }

  async updateParticipant(id: number, dto: EmissionParticipantUpdateDto, actor?: Actor) {
    const row = await this.findParticipant(id);
    if (row.lifecycleStatus === "archived") {
      throw new ConflictException("Archived emission participants cannot be edited.");
    }
    const { reason, ...changes } = dto;
    const next = { ...row, ...changes };
    this.validateParticipant(next);
    Object.assign(row, changes, {
      updatedAt: Date.now(),
      updatedBy: this.actorId(actor),
      lifecycleReason: reason?.trim() || null,
    });
    this.addLifecycleEvent(row, "updated", actor, reason, changes);
    return this.emissionParticipantRepo.save(row);
  }

  async archiveParticipant(id: number, reason: string | undefined, actor?: Actor) {
    const row = await this.findParticipant(id);
    const lifecycleReason = this.requireReason(reason);
    if (row.lifecycleStatus === "archived") {
      throw new ConflictException("Emission participant is already archived.");
    }
    const now = Date.now();
    Object.assign(row, {
      lifecycleStatus: "archived",
      participantStatus: "archived",
      lifecycleReason,
      archivedAt: now,
      archivedBy: this.actorId(actor),
      updatedAt: now,
      updatedBy: this.actorId(actor),
    });
    this.addLifecycleEvent(row, "archived", actor, lifecycleReason);
    return this.emissionParticipantRepo.save(row);
  }

  async listTrades(page?: number, pageSize?: number, filters: ManagementFilters = {}) {
    const rows = await this.emissionTradingRepo.find({ order: { tradeDate: "DESC" } });
    const names = await this.companyNameMap(
      rows.flatMap((row) => [row.sellerCompanyId, row.buyerCompanyId])
    );
    const filtered = rows
      .filter(
        (row) =>
          (!filters.year ||
            new Date(Number(row.tradeDate)).getUTCFullYear() === filters.year) &&
          (!filters.series || this.matches(row.seriesName, filters.series)) &&
          (!filters.venueStatus ||
            this.marketStatus(row.venueStatus) === filters.venueStatus) &&
          (!filters.status ||
            filters.status === "all" ||
            (row.lifecycleStatus || "active") === filters.status) &&
          (this.matches(names.get(row.sellerCompanyId), filters.search) ||
            this.matches(names.get(row.buyerCompanyId), filters.search) ||
            this.matches(row.seriesName, filters.search))
      )
      .map((row) => ({
        ...row,
        sellerName: names.get(row.sellerCompanyId) || null,
        buyerName: names.get(row.buyerCompanyId) || null,
      }));
    return this.paginateManagement(filtered, page, pageSize, filters);
  }

  async getTrade(id: number) {
    return { data: await this.findTrade(id), meta: this.managementMeta({ id }, 1, 1, 1) };
  }

  async getTradeHistory(id: number) {
    const row = await this.findTrade(id);
    return {
      data: row.lifecycleHistory || [],
      meta: this.managementMeta({ id }, 1, 1, (row.lifecycleHistory || []).length),
    };
  }

  async updateTrade(id: number, dto: EmissionTradingUpdateDto, actor?: Actor) {
    const row = await this.findTrade(id);
    if ((row.lifecycleStatus || "active") !== "active") {
      throw new ConflictException("Only active trades can be edited.");
    }
    if (isSettledTrade(row.settlementStatus)) {
      throw new ConflictException(
        "Settled market trades are immutable; use reversal with a reason."
      );
    }
    const { reason, ...changes } = dto;
    const next = {
      ...row,
      ...changes,
      venueStatus: changes.venueStatus || row.venueStatus || "synthetic_demo",
      settlementStatus: changes.settlementStatus || row.settlementStatus || "not_applicable",
    };
    const { venueStatus, settlementStatus } = this.validateTrade(next);
    Object.assign(row, changes, {
      venueStatus,
      settlementStatus,
      updatedAt: Date.now(),
      updatedBy: this.actorId(actor),
      lifecycleReason: reason?.trim() || null,
    });
    this.addLifecycleEvent(row, "updated", actor, reason, changes);
    return this.emissionTradingRepo.save(row);
  }

  async voidTrade(id: number, reason: string | undefined, actor?: Actor) {
    const row = await this.findTrade(id);
    const lifecycleReason = this.requireReason(reason);
    if ((row.lifecycleStatus || "active") !== "active") {
      throw new ConflictException("Only active trades can be voided.");
    }
    if (isSettledTrade(row.settlementStatus)) {
      throw new ConflictException(
        "Settled market trades cannot be voided; use reversal to preserve history."
      );
    }
    const now = Date.now();
    Object.assign(row, {
      lifecycleStatus: "voided",
      settlementStatus: "voided",
      lifecycleReason,
      updatedAt: now,
      updatedBy: this.actorId(actor),
    });
    this.addLifecycleEvent(row, "voided", actor, lifecycleReason);
    return this.emissionTradingRepo.save(row);
  }

  async reverseTrade(id: number, reason: string | undefined, actor?: Actor) {
    const original = await this.findTrade(id);
    const lifecycleReason = this.requireReason(reason);
    if ((original.lifecycleStatus || "active") !== "active") {
      throw new ConflictException("Only active trades can be reversed.");
    }
    const originalId = original.id;
    const now = Date.now();
    Object.assign(original, {
      lifecycleStatus: "reversed",
      settlementStatus: "reversed",
      lifecycleReason,
      updatedAt: now,
      updatedBy: this.actorId(actor),
    });
    this.addLifecycleEvent(original, "reversed", actor, lifecycleReason);
    const savedOriginal = await this.emissionTradingRepo.save(original);

    const reversal = this.emissionTradingRepo.create({
      sellerCompanyId: original.buyerCompanyId,
      buyerCompanyId: original.sellerCompanyId,
      units: -Number(original.units),
      valueLAK:
        original.valueLAK === null || original.valueLAK === undefined
          ? original.valueLAK
          : -Number(original.valueLAK),
      currency: original.currency || "LAK",
      seriesName: original.seriesName,
      ceilingAllocationId: original.ceilingAllocationId,
      venueStatus: this.marketStatus(original.venueStatus),
      settlementStatus: "reversed",
      certificateBridgeEventId: null,
      idempotencyKey: null,
      tradeDate: original.tradeDate,
      lifecycleStatus: "reversed",
      lifecycleReason,
      createdBy: this.actorId(actor),
      updatedBy: this.actorId(actor),
      reversalOfTradeId: originalId,
      lifecycleHistory: [],
    });
    this.addLifecycleEvent(reversal, "created", actor, lifecycleReason, undefined, originalId);
    this.addLifecycleEvent(reversal, "reversed", actor, lifecycleReason, undefined, originalId);
    const savedReversal = await this.emissionTradingRepo.save(reversal);
    return { original: savedOriginal, reversal: savedReversal };
  }

  async publicSummary(filters: MarketFilters = {}) {
    const ceilings = (await this.emissionCeilingRepo.find()).filter(
      (row) =>
        row.lifecycleStatus !== "archived" &&
        (!filters.year || row.year === filters.year) &&
        (!filters.series ||
          (row.seriesName || row.sector || "").toLowerCase() ===
            filters.series.toLowerCase()) &&
        (!filters.venueStatus ||
          this.marketStatus(row.venueStatus) === filters.venueStatus)
    );
    const trades = (await this.emissionTradingRepo.find()).filter(
      (row) =>
        row.lifecycleStatus !== "voided" &&
        (!filters.year ||
          new Date(Number(row.tradeDate)).getUTCFullYear() === filters.year) &&
        (!filters.series ||
          (row.seriesName || "").toLowerCase() === filters.series.toLowerCase()) &&
        (!filters.venueStatus ||
          this.marketStatus(row.venueStatus) === filters.venueStatus)
    );
    const ceilingCompanyIds = new Set(ceilings.map((row) => row.companyId));
    const tradeCompanyIds = new Set(
      trades.flatMap((row) => [row.sellerCompanyId, row.buyerCompanyId])
    );
    return {
      data: {
        configuration: {
          venue_status: this.marketStatus(filters.venueStatus),
          venue_name:
            this.marketStatus(filters.venueStatus) === "not_configured"
              ? null
              : "Synthetic demonstration market",
          policy_status: "not_configured",
          settlement_status: "not_applicable",
        },
        ceiling: {
          totalUnits: ceilings.reduce((sum, row) => sum + Number(row.units || 0), 0),
          companies: ceilingCompanyIds.size,
          unit: "tCO2e",
        },
        trading: {
          totalUnits: trades.reduce((sum, row) => sum + Number(row.units || 0), 0),
          totalValueLAK: trades.reduce(
            (sum, row) => sum + Number(row.valueLAK || 0),
            0
          ),
          companies: tradeCompanyIds.size,
          unit: "tCO2e",
          currency: "LAK",
        },
        formula_id: "sum_filtered_ceiling_allocations_and_market_trades_v1",
      },
      meta: this.metadata(filters),
    };
  }

  async publicSeries(page?: number, pageSize?: number, filters: MarketFilters = {}) {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    const rows = (await this.emissionCeilingRepo.find()).filter(
      (row) =>
        row.lifecycleStatus !== "archived" &&
        (!filters.year || row.year === filters.year) &&
        (!filters.series ||
          (row.seriesName || row.sector || "")
            .toLowerCase()
            .includes(filters.series.toLowerCase())) &&
        (!filters.venueStatus ||
          this.marketStatus(row.venueStatus) === filters.venueStatus)
    );
    const groups = new Map<
      string,
      {
        seriesName: string;
        year: number;
        units: number;
        companyIds: Set<number>;
        availability: string;
        venueStatus: MarketStatus;
        unit: string;
      }
    >();
    rows.forEach((row) => {
      const seriesName = row.seriesName || row.sector || "Not configured";
      const key = `${seriesName}::${row.year}`;
      const group =
        groups.get(key) || {
          seriesName,
          year: row.year,
          units: 0,
          companyIds: new Set<number>(),
          availability: row.availability || "not_configured",
          venueStatus: this.marketStatus(row.venueStatus),
          unit: row.unit || "tCO2e",
        };
      group.units += Number(row.units || 0);
      group.companyIds.add(row.companyId);
      groups.set(key, group);
    });
    const all = Array.from(groups.values())
      .sort((a, b) => b.year - a.year || a.seriesName.localeCompare(b.seriesName))
      .map((row) => ({
        record_id: `ceiling-series-${row.seriesName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}-${row.year}`,
        series_name: row.seriesName,
        year: row.year,
        allocated_units: row.units,
        unit: row.unit,
        participant_count: row.companyIds.size,
        exchange_available_units: null,
        availability: row.availability,
        venue_status: row.venueStatus,
        formula_id: "sum_ceiling_allocations_by_series_year_v1",
      }));
    return {
      data: all.slice((safePage - 1) * safePageSize, safePage * safePageSize),
      meta: this.metadata(filters, {
        page: safePage,
        pageSize: safePageSize,
        total: all.length,
      }),
    };
  }

  async publicTransactions(page?: number, pageSize?: number, filters: MarketFilters = {}) {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    const source = (await this.emissionTradingRepo.find({ order: { tradeDate: "DESC" } })).filter(
      (row) =>
        row.lifecycleStatus !== "voided" &&
        (!filters.year ||
          new Date(Number(row.tradeDate)).getUTCFullYear() === filters.year) &&
        (!filters.series || this.matches(row.seriesName, filters.series)) &&
        (!filters.venueStatus ||
          this.marketStatus(row.venueStatus) === filters.venueStatus)
    );
    const names = await this.companyNameMap(
      source.flatMap((row) => [row.sellerCompanyId, row.buyerCompanyId])
    );
    const searched = source.filter(
      (row) =>
        this.matches(names.get(row.sellerCompanyId), filters.search) ||
        this.matches(names.get(row.buyerCompanyId), filters.search) ||
        this.matches(row.seriesName, filters.search)
    );
    const data = searched
      .slice((safePage - 1) * safePageSize, safePage * safePageSize)
      .map((row) => ({
        record_id: `market-trade-${row.id}`,
        date: Number(row.tradeDate),
        series_name: row.seriesName || null,
        seller: {
          record_id: `organisation-${row.sellerCompanyId}`,
          name: names.get(row.sellerCompanyId) || "Withheld",
        },
        buyer: {
          record_id: `organisation-${row.buyerCompanyId}`,
          name: names.get(row.buyerCompanyId) || "Withheld",
        },
        quantity: Number(row.units || 0),
        unit: "tCO2e",
        value: row.valueLAK == null ? null : Number(row.valueLAK),
        currency: "LAK",
        price_per_unit:
          Number(row.units) !== 0 && row.valueLAK != null
            ? Number(row.valueLAK) / Number(row.units)
            : null,
        venue_status: this.marketStatus(row.venueStatus),
        settlement_status: row.settlementStatus || "not_applicable",
        lifecycle_status: row.lifecycleStatus || "active",
        reversal_of_trade_id: row.reversalOfTradeId || null,
        ceiling_allocation_id: row.ceilingAllocationId || null,
        certificate_bridge: row.certificateBridgeEventId ? "configured" : "absent",
        formula_id: "market_trade_event_quantity_and_entered_lak_value_v1",
      }));
    return {
      data,
      meta: this.metadata(filters, {
        page: safePage,
        pageSize: safePageSize,
        total: searched.length,
      }),
    };
  }

  async publicParticipants(page?: number, pageSize?: number, filters: MarketFilters = {}) {
    const { safePage, safePageSize } = this.normalizePaging(page, pageSize);
    const source = (await this.emissionParticipantRepo.find({
      order: { year: "DESC", createdAt: "DESC" },
    })).filter(
      (row) =>
        row.lifecycleStatus !== "archived" &&
        (!filters.year || row.year === filters.year) &&
        (!filters.series || this.matches(row.seriesName, filters.series))
    );
    const names = await this.companyNameMap(source.map((row) => row.companyId));
    const searched = source.filter(
      (row) =>
        this.matches(row.facilityName, filters.search) ||
        this.matches(names.get(row.companyId), filters.search)
    );
    const data = searched
      .slice((safePage - 1) * safePageSize, safePage * safePageSize)
      .map((row) => ({
        record_id: `market-participant-${row.id}`,
        facility_name: row.facilityName,
        organisation: {
          record_id: `organisation-${row.companyId}`,
          name: names.get(row.companyId) || "Withheld",
        },
        capacity_description: row.capacityDescription,
        year: row.year,
        series_name: row.seriesName || null,
        sector: row.sector || null,
        participant_status: row.participantStatus || "active",
        dataset_kind: "demo_synthetic",
      }));
    return {
      data,
      meta: this.metadata(filters, {
        page: safePage,
        pageSize: safePageSize,
        total: searched.length,
      }),
    };
  }
}
