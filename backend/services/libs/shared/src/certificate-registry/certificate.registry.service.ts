import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "crypto";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { CertificateRegistryQuery, RecordCertificateLedgerEventDto } from "../dto/certificate.ledger.dto";
import { CertificateLedgerEvent } from "../entities/certificate.ledger.event.entity";
import { CertificateLot } from "../entities/certificate.lot.entity";
import { CertificatePortion } from "../entities/certificate.portion.entity";
import { ProgrammePublicDocument } from "../entities/programme.public.document.entity";
import { ProgrammePublicProfile } from "../entities/programme.public.profile.entity";
import { ProgrammeWorkflowMilestone } from "../entities/programme.workflow.milestone.entity";
import { Programme } from "../entities/programme.entity";
import { Company } from "../entities/company.entity";
import { CertificateLedgerEventType, CertificatePortionState, PublicAvailability } from "../enum/certificate.ledger.enum";
import { assertLotConservation, assertNonNegativePortion } from "./certificate.registry.invariants";

const DISCLOSURE = "Synthetic demonstration data — not official Lao PDR statistics, legal authorisation, market activity, or certificate records.";
const EPSILON = 0.000001;

type Transition = {
  sourceState?: CertificatePortionState;
  targetState: CertificatePortionState;
  requiresRecipient?: boolean;
};

@Injectable()
export class CertificateRegistryService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @InjectRepository(CertificateLot) private readonly lotRepo: Repository<CertificateLot>,
    @InjectRepository(CertificatePortion) private readonly portionRepo: Repository<CertificatePortion>,
    @InjectRepository(CertificateLedgerEvent) private readonly eventRepo: Repository<CertificateLedgerEvent>,
    @InjectRepository(Programme) private readonly programmeRepo: Repository<Programme>,
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(ProgrammePublicProfile) private readonly profileRepo: Repository<ProgrammePublicProfile>,
    @InjectRepository(ProgrammeWorkflowMilestone) private readonly milestoneRepo: Repository<ProgrammeWorkflowMilestone>,
    @InjectRepository(ProgrammePublicDocument) private readonly documentRepo: Repository<ProgrammePublicDocument>
  ) {}

  /**
   * Applies one immutable ledger event and updates only the lot's current
   * portion projection. This is intentionally not exposed as a public route;
   * W1 and authorised future workflow services call it with an idempotency key.
   */
  async recordEvent(dto: RecordCertificateLedgerEventDto): Promise<CertificateLedgerEvent> {
    const quantity = Number(dto.quantity);
    assertNonNegativePortion(quantity);
    if (quantity <= 0) throw new BadRequestException("Certificate event quantity must be positive");

    return this.entityManager.transaction(async (manager) => {
      const events = manager.getRepository(CertificateLedgerEvent);
      const existing = await events.findOneBy({ idempotencyKey: dto.idempotencyKey });
      if (existing) return existing;

      const lots = manager.getRepository(CertificateLot);
      const portions = manager.getRepository(CertificatePortion);
      const lot = await lots.findOne({
        where: { certificateLotId: dto.certificateLotId },
        lock: { mode: "pessimistic_write" },
      });
      if (!lot) throw new NotFoundException("Certificate lot not found");

      const eventId = `cle-${createHash("sha256").update(dto.idempotencyKey).digest("hex")}`;
      const recordedAt = new Date();
      const effectiveAt = dto.effectiveAt ? new Date(dto.effectiveAt) : recordedAt;
      if (Number.isNaN(effectiveAt.getTime())) throw new BadRequestException("Invalid effectiveAt");

      let source: CertificatePortion | null = null;
      let original: CertificateLedgerEvent | null = null;
      let transition: Transition;
      if (dto.eventType === CertificateLedgerEventType.ISSUED) {
        const existingPortions = await portions.findBy({ certificateLotId: lot.certificateLotId });
        if (existingPortions.length || Math.abs(Number(lot.issuedQuantity) - quantity) > EPSILON) {
          throw new BadRequestException("ISSUED must initialise a lot with its exact issued quantity");
        }
        transition = { targetState: CertificatePortionState.AVAILABLE, requiresRecipient: true };
      } else {
        if (!dto.sourcePortionId) throw new BadRequestException("sourcePortionId is required for this certificate event");
        source = await portions.findOne({
          where: { certificatePortionId: dto.sourcePortionId, certificateLotId: lot.certificateLotId },
          lock: { mode: "pessimistic_write" },
        });
        if (!source) throw new NotFoundException("Certificate source portion not found");
        if (Number(source.quantity) + EPSILON < quantity) throw new BadRequestException("Certificate event exceeds source portion balance");

        if (dto.eventType === CertificateLedgerEventType.REVERSED) {
          if (!dto.parentEventId) throw new BadRequestException("parentEventId is required for a reversal");
          original = await events.findOneBy({ eventId: dto.parentEventId });
          if (!original) throw new NotFoundException("Original certificate event not found");
          if (original.certificateLotId !== lot.certificateLotId || Math.abs(Number(original.quantity) - quantity) > EPSILON) {
            throw new BadRequestException("Reversal must reference the same lot and exact original quantity");
          }
          if (!original.fromState || !original.toState || source.state !== original.toState) {
            throw new BadRequestException("Original event is not reversible from the supplied source portion");
          }
          transition = { sourceState: original.toState, targetState: original.fromState };
        } else {
          transition = this.transitionFor(dto.eventType);
          if (source.state !== transition.sourceState) {
            throw new BadRequestException(`Certificate event requires ${transition.sourceState} source state`);
          }
        }
      }

      const targetOwner = dto.eventType === CertificateLedgerEventType.REVERSED
        ? original?.fromOwnerCompanyId ?? source?.ownerCompanyId ?? null
        : dto.toOwnerCompanyId ?? source?.ownerCompanyId ?? null;
      if (transition.requiresRecipient && targetOwner === null) {
        throw new BadRequestException("Recipient owner is required for this certificate event");
      }

      if (source) {
        const remaining = Number(source.quantity) - quantity;
        if (remaining <= EPSILON) await portions.remove(source);
        else {
          source.quantity = remaining.toFixed(6);
          source.asOf = recordedAt;
          await portions.save(source);
        }
      }

      const target = portions.create({
        certificatePortionId: `${eventId}:portion`.slice(0, 128),
        certificateLotId: lot.certificateLotId,
        parentPortionId: source?.certificatePortionId ?? null,
        ownerCompanyId: targetOwner,
        state: transition.targetState,
        quantity: quantity.toFixed(6),
        withheldReason: transition.targetState === CertificatePortionState.WITHHELD ? dto.reason ?? "withheld" : null,
        asOf: recordedAt,
      });
      await portions.save(target);

      const event = events.create({
        eventId,
        idempotencyKey: dto.idempotencyKey,
        certificateLotId: lot.certificateLotId,
        sourcePortionId: source?.certificatePortionId ?? null,
        parentEventId: original?.eventId ?? null,
        eventType: dto.eventType,
        quantity: quantity.toFixed(6),
        unit: lot.unit,
        fromOwnerCompanyId: source?.ownerCompanyId ?? null,
        toOwnerCompanyId: targetOwner,
        fromState: source?.state ?? null,
        toState: transition.targetState,
        effectiveAt,
        recordedAt,
        actorReference: dto.actorReference ?? null,
        reason: dto.reason ?? null,
        sourceType: String(lot.provenance?.source_type ?? "synthetic_demo"),
        asOf: lot.asOf,
      });
      await events.save(event);
      await this.assertLotConservationWith(manager, lot.certificateLotId, lot.issuedQuantity);
      return event;
    });
  }

  async getPublicCertificates(query: CertificateRegistryQuery = {}): Promise<any> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
    const allLots = await this.lotRepo.find({ order: { certificateId: "ASC" } });
    const programmeMap = await this.programmeMap(allLots.map((lot) => lot.programmeId));
    const portions = await this.portionRepo.find({ where: { certificateLotId: In(allLots.map((lot) => lot.certificateLotId)) } });
    const events = await this.eventRepo.find({ where: { certificateLotId: In(allLots.map((lot) => lot.certificateLotId)) } });
    const holders = await this.companyMap(portions.map((portion) => portion.ownerCompanyId).filter(Boolean) as string[]);

    const rows = allLots.map((lot) => this.publicCertificateRow(
      lot,
      portions.filter((portion) => portion.certificateLotId === lot.certificateLotId),
      events.filter((event) => event.certificateLotId === lot.certificateLotId),
      programmeMap.get(lot.programmeId),
      holders
    )).filter((row) => this.matchesCertificateQuery(row, query));
    const start = (page - 1) * pageSize;
    const source = allLots[0]?.provenance ?? {};
    return {
      data: rows.slice(start, start + pageSize),
      meta: this.meta(source, rows.length, page, pageSize, {
        q: query.q ?? null, scheme: query.scheme ?? null, sector: query.sector ?? null,
        state: query.state ?? null, holderId: query.holderId ?? null,
      }),
    };
  }

  async getPublicCertificateDetail(certificateId: string): Promise<any> {
    const lot = await this.lotRepo.findOneBy({ certificateId });
    if (!lot) throw new NotFoundException("Certificate not found");
    const [portions, events, programme] = await Promise.all([
      this.portionRepo.find({ where: { certificateLotId: lot.certificateLotId } }),
      this.eventRepo.find({ where: { certificateLotId: lot.certificateLotId }, order: { effectiveAt: "ASC" } }),
      this.programmeRepo.findOneBy({ programmeId: lot.programmeId }),
    ]);
    const holders = await this.companyMap(portions.map((portion) => portion.ownerCompanyId).filter(Boolean) as string[]);
    return { data: { ...this.publicCertificateRow(lot, portions, events, programme ?? undefined, holders), audit_history: events.map((event) => this.publicEvent(event)) }, meta: this.meta(lot.provenance, 1, 1, 1, {}) };
  }

  /** Source facts for F01. W3 owns presentation and must not combine these with ceiling trades. */
  async getPublicCertificateMetrics(query: Pick<CertificateRegistryQuery, "scheme" | "sector"> = {}): Promise<any> {
    const allLots = await this.lotRepo.find({ order: { certificateId: "ASC" } });
    const programmeMap = await this.programmeMap(allLots.map((lot) => lot.programmeId));
    const portions = await this.portionRepo.find({ where: { certificateLotId: In(allLots.map((lot) => lot.certificateLotId)) } });
    const events = await this.eventRepo.find({ where: { certificateLotId: In(allLots.map((lot) => lot.certificateLotId)) } });
    const holders = await this.companyMap(portions.map((portion) => portion.ownerCompanyId).filter(Boolean) as string[]);
    const rows = allLots.map((lot) => this.publicCertificateRow(
      lot,
      portions.filter((portion) => portion.certificateLotId === lot.certificateLotId),
      events.filter((event) => event.certificateLotId === lot.certificateLotId),
      programmeMap.get(lot.programmeId), holders
    )).filter((row) => this.matchesCertificateQuery(row, query));
    const sum = (selector: (row: any) => number) => rows.reduce((total, row) => total + selector(row), 0);
    const source = allLots[0]?.provenance ?? {};
    return {
      data: {
        formula_id: "certificate_registry_metrics_v1",
        certificate_lot_count: rows.length,
        issued_total: sum((row) => row.issued_quantity),
        available_balance: sum((row) => row.balances.available),
        transferred_event_total: sum((row) => row.event_totals.transferred),
        retired_balance: sum((row) => row.balances.retired),
        cancelled_balance: sum((row) => row.balances.cancelled),
        exchange_assigned_balance: sum((row) => row.balances.exchange_assigned),
        withheld_balance: sum((row) => row.balances.withheld),
        buffer_balance: sum((row) => row.balances.buffer),
        unit: rows[0]?.unit ?? "tCO2e",
      },
      meta: this.meta(source, rows.length, 1, rows.length || 1, { scheme: query.scheme ?? null, sector: query.sector ?? null }),
    };
  }

  async getPublicMitigationDetail(programmeId: string): Promise<any> {
    const programme = await this.programmeRepo.findOneBy({ programmeId });
    if (!programme) return { data: null, meta: this.meta({}, 0, 1, 1, {}) };
    const [profile, milestones, documents] = await Promise.all([
      this.profileRepo.findOneBy({ programmeId }),
      this.milestoneRepo.find({ where: { programmeId }, order: { sequence: "ASC" } }),
      this.documentRepo.find({ where: { programmeId }, order: { title: "ASC" } }),
    ]);
    const provenance = profile?.provenance ?? {};
    return {
      data: {
        programme_id: programme.programmeId,
        title: programme.title,
        sector: programme.sector,
        status: programme.currentStage,
        period: { start: programme.startTime ?? null, end: programme.endTime ?? null, availability: programme.startTime && programme.endTime ? PublicAvailability.AVAILABLE : PublicAvailability.NOT_AVAILABLE },
        goals: profile?.goals ?? null,
        action_summary: profile?.actionSummary ?? null,
        location: programme.programmeProperties?.geographicalLocation ?? null,
        vulnerability: { availability: profile?.vulnerabilityAvailability ?? PublicAvailability.NOT_CONFIGURED, summary: profile?.vulnerabilitySummary ?? null },
        milestones: milestones.map((milestone) => ({ key: milestone.milestoneKey, label: milestone.label, sequence: milestone.sequence, status: milestone.status, availability: milestone.availability, occurred_at: milestone.occurredAt, summary: milestone.publicSummary })),
        documents: documents.map((document) => ({ document_id: document.publicDocumentId, title: document.title, category: document.category, availability: document.availability, url: document.availability === PublicAvailability.AVAILABLE ? document.publicUrl : null, withheld_reason: document.withheldReason })),
      },
      meta: this.meta(provenance, 1, 1, 1, {}),
    };
  }

  private transitionFor(eventType: CertificateLedgerEventType): Transition {
    const transitions: Partial<Record<CertificateLedgerEventType, Transition>> = {
      [CertificateLedgerEventType.TRANSFERRED]: { sourceState: CertificatePortionState.AVAILABLE, targetState: CertificatePortionState.AVAILABLE, requiresRecipient: true },
      [CertificateLedgerEventType.RETIRED]: { sourceState: CertificatePortionState.AVAILABLE, targetState: CertificatePortionState.RETIRED },
      [CertificateLedgerEventType.CANCELLED]: { sourceState: CertificatePortionState.AVAILABLE, targetState: CertificatePortionState.CANCELLED },
      [CertificateLedgerEventType.ASSIGNED_TO_EXCHANGE]: { sourceState: CertificatePortionState.AVAILABLE, targetState: CertificatePortionState.ASSIGNED_TO_EXCHANGE },
      [CertificateLedgerEventType.UNASSIGNED_FROM_EXCHANGE]: { sourceState: CertificatePortionState.ASSIGNED_TO_EXCHANGE, targetState: CertificatePortionState.AVAILABLE },
      [CertificateLedgerEventType.WITHHELD]: { sourceState: CertificatePortionState.AVAILABLE, targetState: CertificatePortionState.WITHHELD },
      [CertificateLedgerEventType.RELEASED]: { sourceState: CertificatePortionState.WITHHELD, targetState: CertificatePortionState.AVAILABLE },
    };
    const transition = transitions[eventType];
    if (!transition) throw new BadRequestException(`Unsupported certificate event type: ${eventType}`);
    return transition;
  }

  private async assertLotConservationWith(manager: EntityManager, certificateLotId: string, issuedQuantity: string): Promise<void> {
    const portions = await manager.getRepository(CertificatePortion).findBy({ certificateLotId });
    assertLotConservation(issuedQuantity, portions);
  }

  private publicCertificateRow(lot: CertificateLot, portions: CertificatePortion[], events: CertificateLedgerEvent[], programme: Programme | undefined, holders: Map<string, Company>) {
    const balance = (state: CertificatePortionState) => portions.filter((portion) => portion.state === state).reduce((sum, portion) => sum + Number(portion.quantity), 0);
    const eventTotal = (type: CertificateLedgerEventType) => events.filter((event) => event.eventType === type).reduce((sum, event) => sum + Number(event.quantity), 0);
    const available = balance(CertificatePortionState.AVAILABLE);
    const exchangeAssigned = balance(CertificatePortionState.ASSIGNED_TO_EXCHANGE);
    const retired = balance(CertificatePortionState.RETIRED);
    const cancelled = balance(CertificatePortionState.CANCELLED);
    const withheld = balance(CertificatePortionState.WITHHELD);
    const buffer = balance(CertificatePortionState.BUFFER);
    const holder = portions.find((portion) => portion.state === CertificatePortionState.AVAILABLE && portion.ownerCompanyId)?.ownerCompanyId ?? null;
    return {
      certificate_id: lot.certificateId,
      certificate_lot_id: lot.certificateLotId,
      public_detail_url: `/national/programme/public/certificate-registry/${encodeURIComponent(lot.certificateId)}`,
      registry_scheme: lot.registryScheme,
      registry_number: lot.registryNumber,
      serial_number: lot.serialNumber,
      activity: programme?.title ?? null,
      sector: programme?.sector ?? null,
      account_holder: holder ? holders.get(holder)?.name ?? null : null,
      holder_company_id: holder,
      vintage: { start: lot.vintageStart, end: lot.vintageEnd },
      issued_quantity: Number(lot.issuedQuantity),
      issued_at: lot.issuedAt,
      unit: lot.unit,
      balances: { available, exchange_assigned: exchangeAssigned, retired, cancelled, withheld, buffer },
      event_totals: { transferred: eventTotal(CertificateLedgerEventType.TRANSFERRED), retired: eventTotal(CertificateLedgerEventType.RETIRED), cancelled: eventTotal(CertificateLedgerEventType.CANCELLED) },
      formula_id: "certificate_lot_portion_balance_v1",
      availability: PublicAvailability.AVAILABLE,
      policy_fields: this.policyFields(lot.publicFields),
    };
  }

  private policyFields(fields: Record<string, unknown>) {
    const names = ["authorisation_id", "authorisation_status", "article_6_status", "first_transfer_definition", "party", "beneficiary", "retirement_purpose", "cancellation_purpose"];
    return Object.fromEntries(names.map((name) => [name, fields?.[name] ?? { value: null, availability: PublicAvailability.NOT_CONFIGURED }]));
  }

  private publicEvent(event: CertificateLedgerEvent) {
    return { event_id: event.eventId, parent_event_id: event.parentEventId, type: event.eventType, quantity: Number(event.quantity), unit: event.unit, from_state: event.fromState, to_state: event.toState, effective_at: event.effectiveAt, reason: event.reason, source_type: event.sourceType };
  }

  private matchesCertificateQuery(row: any, query: CertificateRegistryQuery): boolean {
    const q = query.q?.trim().toLowerCase();
    if (q && ![row.certificate_id, row.registry_number, row.activity, row.account_holder].filter(Boolean).some((value: string) => value.toLowerCase().includes(q))) return false;
    if (query.scheme && row.registry_scheme !== query.scheme) return false;
    if (query.sector && row.sector !== query.sector) return false;
    if (query.holderId && row.holder_company_id !== query.holderId) return false;
    const balanceKeyByState: Partial<Record<CertificatePortionState, string>> = {
      [CertificatePortionState.AVAILABLE]: "available",
      [CertificatePortionState.ASSIGNED_TO_EXCHANGE]: "exchange_assigned",
      [CertificatePortionState.WITHHELD]: "withheld",
      [CertificatePortionState.RETIRED]: "retired",
      [CertificatePortionState.CANCELLED]: "cancelled",
      [CertificatePortionState.BUFFER]: "buffer",
    };
    if (query.state && Number(row.balances[balanceKeyByState[query.state]]) <= 0) return false;
    return true;
  }

  private async programmeMap(ids: string[]): Promise<Map<string, Programme>> {
    if (!ids.length) return new Map();
    return new Map((await this.programmeRepo.findBy({ programmeId: In(ids) })).map((programme) => [programme.programmeId, programme]));
  }

  private async companyMap(ids: string[]): Promise<Map<string, Company>> {
    const unique = [...new Set(ids.map((id) => Number(id)).filter(Number.isFinite))];
    if (!unique.length) return new Map();
    return new Map((await this.companyRepo.findBy({ companyId: In(unique) })).map((company) => [String(company.companyId), company]));
  }

  private meta(source: Record<string, unknown>, totalItems: number, page: number, pageSize: number, filters: Record<string, unknown>) {
    const asOf = source?.as_of ?? "2026-08-05T00:00:00Z";
    return {
      dataset_kind: source?.dataset_kind ?? "demo_synthetic", scenario: source?.scenario ?? "Champa registry demonstration", as_of: asOf,
      period: { start: source?.period_start ?? "2021-01-01", end: source?.period_end ?? "2026-12-31" },
      source: { type: source?.source_type ?? "synthetic_demo", label: source?.source_label ?? "Champa parity demo" }, methodology_version: source?.methodology_version ?? "champa-parity-demo-v1",
      unit: "tCO2e", scale: 1, currency: null, timezone: "UTC", filters,
      pagination: { page, page_size: pageSize, total_items: totalItems, total_pages: Math.ceil(totalItems / pageSize) }, availability: PublicAvailability.AVAILABLE, disclosure: DISCLOSURE,
    };
  }
}
