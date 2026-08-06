import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExpertEntity } from "../entities/expert.entity";
import { ExpertCreateDto } from "../dto/expert.create.dto";
import { ExpertUpdateDto } from "../dto/expert.update.dto";
import { ExpertStatusUpdateDto } from "../dto/expert.status.update.dto";
import { ExpertStatus } from "../enum/expert.status.enum";
import { Region } from "../entities/region.entity";

export interface ExpertPublicRow {
  id: number;
  name: string;
  affiliation: string;
  expertise: string;
  certification: string | null;
  yearsOfExperience: number | null;
  province: string;
}

@Injectable()
export class ExpertService {
  private readonly logger = new Logger(ExpertService.name);

  constructor(
    @InjectRepository(ExpertEntity)
    private expertRepo: Repository<ExpertEntity>,
    @InjectRepository(Region)
    private regionRepo: Repository<Region>
  ) {}

  async create(dto: ExpertCreateDto, actorId?: number): Promise<ExpertEntity> {
    await this.assertProvince(dto.province);
    this.validateExperience(dto.yearsOfExperience);
    this.logger.verbose("Expert create received", dto.name);
    const now = Date.now();
    const record = this.expertRepo.create({
      ...dto,
      status: dto.status ?? ExpertStatus.ACTIVE,
      createdBy: actorId,
      updatedBy: actorId,
      updatedAt: now,
    });
    return await this.expertRepo.save(record);
  }

  async findAdminList(search = "", status?: ExpertStatus, page = 1, pageSize = 25) {
    const records = await this.expertRepo.find({ order: { updatedAt: "DESC", id: "DESC" } });
    const keyword = search.trim().toLowerCase();
    const filtered = records.filter((record) =>
      (!keyword || [record.name, record.affiliation, record.expertise, record.province]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword))) &&
      (!status || record.status === status)
    );
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    return {
      data: filtered.slice((safePage - 1) * safePageSize, safePage * safePageSize),
      total: filtered.length,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async findAdminOne(id: number): Promise<ExpertEntity> {
    return await this.findOne(id);
  }

  async update(id: number, dto: ExpertUpdateDto, actorId?: number): Promise<ExpertEntity> {
    const record = await this.findOne(id);
    this.assertNotArchived(record);
    if (dto.province !== undefined) await this.assertProvince(dto.province);
    this.validateExperience(dto.yearsOfExperience);
    Object.assign(record, dto, { updatedAt: Date.now(), updatedBy: actorId });
    return await this.expertRepo.save(record);
  }

  async updateStatus(id: number, dto: ExpertStatusUpdateDto, actorId?: number): Promise<ExpertEntity> {
    const record = await this.findOne(id);
    this.assertNotArchived(record);
    record.status = dto.status;
    record.updatedAt = Date.now();
    record.updatedBy = actorId;
    return await this.expertRepo.save(record);
  }

  async archive(id: number, actorId?: number): Promise<ExpertEntity> {
    const record = await this.findOne(id);
    if (record.archivedAt) return record;
    const now = Date.now();
    record.status = ExpertStatus.INACTIVE;
    record.archivedAt = now;
    record.archivedBy = actorId;
    record.updatedAt = now;
    record.updatedBy = actorId;
    return await this.expertRepo.save(record);
  }

  async publicSearch(
    q: string,
    page = 1,
    size = 10,
    certification?: string,
    province?: string,
    sortBy: "name" | "yearsOfExperience" = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<{ data: ExpertPublicRow[]; total: number; page: number; pageSize: number; meta: Record<string, unknown> }> {
    const keyword = (q || "").trim();
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, size));
    let qb = this.expertRepo
      .createQueryBuilder("expert")
      .where(`"expert"."status" = :status`, { status: ExpertStatus.ACTIVE })
      .andWhere(`"expert"."archivedAt" IS NULL`)
      .orderBy(sortBy === "yearsOfExperience" ? `"expert"."yearsOfExperience"` : `"expert"."name"`, sortOrder === "desc" ? "DESC" : "ASC")
      .addOrderBy(`"expert"."id"`, "ASC");
    if (keyword) {
      qb = qb.andWhere(`("expert"."name" ILIKE :keyword OR "expert"."affiliation" ILIKE :keyword)`, { keyword: `%${keyword}%` });
    }
    if (certification) qb = qb.andWhere(`"expert"."certification" ILIKE :certification`, { certification: `%${certification}%` });
    if (province) qb = qb.andWhere(`"expert"."province" = :province`, { province });
    const [results, total] = await qb.skip((safePage - 1) * safeSize).take(safeSize).getManyAndCount();
    return {
      data: results.map((r) => ({ id: r.id, name: r.name, affiliation: r.affiliation, expertise: r.expertise, certification: r.certification, yearsOfExperience: r.yearsOfExperience, province: r.province })),
      total,
      page: safePage,
      pageSize: safeSize,
      meta: {
        dataset_kind: "demo_synthetic",
        source_type: "synthetic_demo",
        scenario: "Champa registry demonstration",
        availability: results.length ? "available" : "empty",
        disclosure: "Synthetic demonstration data, not official Lao PDR expert records.",
      },
    };
  }

  private async findOne(id: number): Promise<ExpertEntity> {
    const record = await this.expertRepo.findOneBy({ id });
    if (!record) throw new NotFoundException("Expert not found");
    return record;
  }

  private async assertProvince(province: string) {
    if (!(await this.regionRepo.findOneBy({ regionName: province, lang: "en" }))) {
      throw new BadRequestException(`${province} is not a recognised Lao PDR province.`);
    }
  }

  private validateExperience(yearsOfExperience?: number) {
    if (yearsOfExperience !== undefined && (!Number.isInteger(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 80)) {
      throw new BadRequestException("yearsOfExperience must be an integer between 0 and 80.");
    }
  }

  private assertNotArchived(record: ExpertEntity) {
    if (record.archivedAt) throw new BadRequestException("Archived experts are retained for audit and cannot be edited.");
  }
}
