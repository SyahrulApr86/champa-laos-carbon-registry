import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { RecognizedMitigationEntity } from "../entities/recognized.mitigation.entity";
import { RecognizedMitigationCreateDto } from "../dto/recognized.mitigation.create.dto";
import { RecognizedMitigationUpdateDto } from "../dto/recognized.mitigation.update.dto";
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

  async create(dto: RecognizedMitigationCreateDto, actorId?: number): Promise<RecognizedMitigationEntity> {
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
    const record = this.recognizedMitigationRepo.create({
      ...dto,
      version: 1,
      published: true,
      createdBy: actorId ?? null,
      updatedBy: actorId ?? null,
    });
    const saved = await this.recognizedMitigationRepo.save(record);

    saved.referenceId = "RMA-" + String(saved.id).padStart(4, "0");
    return await this.recognizedMitigationRepo.save(saved);
  }

  async listManagement(includeArchived = false, query?: { q?: string; status?: RecognizedMitigationStatus; region?: string }, page = 1, size = 50) {
    const records = await this.recognizedMitigationRepo.find({
      where: includeArchived ? {} : { archivedAt: IsNull() },
      order: { createdAt: "DESC", version: "DESC" },
    });
    const keyword = query?.q?.trim().toLowerCase();
    const filtered = records.filter((record) => {
      const matchesKeyword = !keyword || [record.title, record.proponentName, record.referenceId].filter(Boolean).some((value) => value.toLowerCase().includes(keyword));
      return (includeArchived || this.isActive(record)) && matchesKeyword && (!query?.status || record.status === query.status) && (!query?.region || record.region === query.region);
    });
    const safePage = Math.max(1, page);
    const safeSize = Math.min(100, Math.max(1, size));
    const start = (safePage - 1) * safeSize;
    return { data: filtered.slice(start, start + safeSize), total: filtered.length, page: safePage, pageSize: safeSize };
  }

  async getManagementDetail(id: number) {
    const record = await this.findManagementOne(id);
    const groupId = record.versionGroupId ?? record.id;
    const versions = await this.recognizedMitigationRepo.find({ where: [{ id: groupId }, { versionGroupId: groupId }], order: { version: "ASC" } });
    return { ...record, versions };
  }

  async update(id: number, dto: RecognizedMitigationUpdateDto, actorId?: number): Promise<RecognizedMitigationEntity> {
    const current = await this.findManagementOne(id);
    this.assertEditable(current);
    if (!Object.keys(dto).length) throw new BadRequestException("At least one mitigation field is required");
    if (dto.region) await this.validateRegion(dto.region);
    this.assertStatusTransition(current.status, dto.status);
    return await this.createVersion(current, dto, actorId);
  }

  async version(id: number, dto: RecognizedMitigationUpdateDto, actorId?: number): Promise<RecognizedMitigationEntity> {
    const current = await this.findManagementOne(id);
    this.assertEditable(current);
    if (dto.region) await this.validateRegion(dto.region);
    this.assertStatusTransition(current.status, dto.status);
    return await this.createVersion(current, dto, actorId);
  }

  async archive(id: number, actorId?: number): Promise<RecognizedMitigationEntity> {
    const record = await this.findManagementOne(id);
    if (!this.isActive(record)) return record;
    const archivedAt = Date.now();
    Object.assign(record, { archivedAt, archivedBy: actorId ?? null, updatedAt: archivedAt, updatedBy: actorId ?? null, published: false });
    return await this.recognizedMitigationRepo.save(record);
  }

  private async findManagementOne(id: number): Promise<RecognizedMitigationEntity> {
    const record = await this.recognizedMitigationRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException("Recognized mitigation action not found");
    return record;
  }

  private async validateRegion(region: string): Promise<void> {
    const valid = await this.regionRepo.findOneBy({ regionName: region, lang: "en" });
    if (!valid) throw new BadRequestException(`${region} is not a recognised Lao PDR region.`);
  }

  private assertEditable(record: RecognizedMitigationEntity): void {
    if (record.archivedAt !== null && record.archivedAt !== undefined) throw new ConflictException("Archived mitigation actions cannot be edited or versioned");
  }

  private assertStatusTransition(current: RecognizedMitigationStatus, next?: RecognizedMitigationStatus): void {
    if (!next || next === current) return;
    const allowed: Record<RecognizedMitigationStatus, RecognizedMitigationStatus[]> = {
      [RecognizedMitigationStatus.SUBMITTED]: [RecognizedMitigationStatus.UNDER_REVIEW, RecognizedMitigationStatus.REJECTED],
      [RecognizedMitigationStatus.UNDER_REVIEW]: [RecognizedMitigationStatus.RECOGNIZED, RecognizedMitigationStatus.REJECTED],
      [RecognizedMitigationStatus.RECOGNIZED]: [],
      [RecognizedMitigationStatus.REJECTED]: [RecognizedMitigationStatus.UNDER_REVIEW],
    };
    if (!allowed[current]?.includes(next)) throw new ConflictException(`Invalid recognized mitigation status transition: ${current} to ${next}`);
  }

  private async createVersion(current: RecognizedMitigationEntity, dto: RecognizedMitigationUpdateDto, actorId?: number): Promise<RecognizedMitigationEntity> {
    const now = Date.now();
    const next = this.recognizedMitigationRepo.create({
      referenceId: current.referenceId ? `${current.referenceId}-v${(current.version ?? 1) + 1}` : null,
      title: dto.title ?? current.title,
      description: dto.description ?? current.description,
      proponentName: dto.proponentName ?? current.proponentName,
      proponentType: dto.proponentType ?? current.proponentType,
      proponentCompanyId: dto.proponentCompanyId ?? current.proponentCompanyId,
      sector: dto.sector ?? current.sector,
      region: dto.region ?? current.region,
      estimatedReductionTco2e: dto.estimatedReductionTco2e ?? current.estimatedReductionTco2e,
      status: dto.status ?? current.status,
      version: (current.version ?? 1) + 1,
      versionGroupId: current.versionGroupId ?? current.id,
      supersedesId: current.id,
      published: true,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId ?? current.createdBy ?? null,
      updatedBy: actorId ?? null,
    });
    const saved = await this.recognizedMitigationRepo.save(next);
    Object.assign(current, { archivedAt: now, archivedBy: actorId ?? null, updatedAt: now, updatedBy: actorId ?? null, published: false, supersedesId: saved.id });
    await this.recognizedMitigationRepo.save(current);
    return saved;
  }

  private isActive(record: RecognizedMitigationEntity): boolean {
    return record.published !== false && record.archivedAt == null;
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
    qb = qb.andWhere(`"action"."archivedAt" IS NULL AND "action"."published" = true`);

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
    const records = (await this.recognizedMitigationRepo.find({ where: { archivedAt: IsNull(), published: true } })).filter((record) => this.isActive(record));

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
