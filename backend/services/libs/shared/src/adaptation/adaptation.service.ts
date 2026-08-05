import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { AdaptationProjectEntity } from "../entities/adaptation.project.entity";
import { AdaptationCreateDto } from "../dto/adaptation.create.dto";
import { AdaptationStageUpdateDto } from "../dto/adaptation.stage.update.dto";
import { AdaptationUpdateDto } from "../dto/adaptation.update.dto";
import { AdaptationArchiveDto } from "../dto/adaptation.archive.dto";
import { AdaptationSector } from "../enum/adaptation.sector.enum";
import { AdaptationStage } from "../enum/adaptation.stage.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { User } from "../entities/user.entity";
import { Company } from "../entities/company.entity";
import {
  createPublicMeta,
  PublicDetailResponse,
  PublicListResponse,
} from "../public-data/public.data.contract";

export interface AdaptationPublicRow {
  adaptationId: string;
  title: string;
  sector: string;
  region: string | null;
  status: string;
}

export interface AdaptationPublicDetail extends AdaptationPublicRow {
  found: boolean;
  description: string;
  period: { start: null; end: null; availability: "not_configured" };
  duration: null;
  goal: { value: null; availability: "not_configured" };
  vulnerability: { value: null; availability: "not_configured" };
  documents: { items: []; availability: "not_configured" };
  responsibleOrganisation: {
    name: string | null;
    address: string | null;
    type: string | null;
    availability: "available" | "not_available";
  };
  createdAt: number;
}

@Injectable()
export class AdaptationService {
  private readonly logger = new Logger(AdaptationService.name);

  constructor(
    @InjectRepository(AdaptationProjectEntity)
    private adaptationRepo: Repository<AdaptationProjectEntity>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>
  ) {}

  // Only project developers submit adaptation projects.
  async create(
    dto: AdaptationCreateDto,
    user: User
  ): Promise<AdaptationProjectEntity> {
    if (user.companyRole !== CompanyRole.PROJECT_DEVELOPER) {
      throw new HttpException(
        "Only project developers can submit adaptation projects",
        HttpStatus.FORBIDDEN
      );
    }

    const adaptation = this.adaptationRepo.create({
      ...dto,
      companyId: user.companyId,
      createdByUserId: user.id ?? null,
    });

    const saved = await this.adaptationRepo.save(adaptation);

    saved.adaptationId = "ADP-" + String(saved.id).padStart(4, "0");
    return await this.adaptationRepo.save(saved);
  }

  // Project developers see only their own active submissions; DNA/Ministry
  // reviewers see all active records. Archived rows remain available through
  // the authenticated management list when explicitly requested.
  async query(
    user: User,
    includeArchived = false
  ): Promise<AdaptationProjectEntity[]> {
    this.assertCanAccessManagement(user);

    const where: Record<string, unknown> = includeArchived
      ? {}
      : { archivedAt: IsNull() };
    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      where.companyId = user.companyId;
    }

    return await this.adaptationRepo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async managementDetail(id: number, user: User): Promise<AdaptationProjectEntity> {
    const adaptation = await this.findOne(id);
    this.assertCanAccessRecord(adaptation, user);
    return adaptation;
  }

  async update(
    id: number,
    dto: AdaptationUpdateDto,
    user: User
  ): Promise<AdaptationProjectEntity> {
    const adaptation = await this.findOne(id);
    this.assertCanAccessRecord(adaptation, user);
    this.assertEditable(adaptation);

    if (Object.keys(dto).length === 0) {
      throw new HttpException(
        "At least one adaptation project field is required",
        HttpStatus.BAD_REQUEST
      );
    }

    Object.assign(adaptation, dto, {
      updatedAt: new Date().getTime(),
      updatedByUserId: user.id ?? null,
    });
    return await this.adaptationRepo.save(adaptation);
  }

  async updateStage(
    id: number,
    dto: AdaptationStageUpdateDto,
    user: User
  ): Promise<AdaptationProjectEntity> {
    if (!this.isReviewer(user)) {
      throw new HttpException(
        "Only DNA or Ministry can update adaptation project stage",
        HttpStatus.FORBIDDEN
      );
    }

    const adaptation = await this.adaptationRepo.findOneBy({ id });
    if (!adaptation) {
      throw new HttpException(
        "Adaptation project not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (adaptation.currentStage === AdaptationStage.ARCHIVED) {
      throw new HttpException(
        "Archived adaptation projects cannot change stage",
        HttpStatus.CONFLICT
      );
    }

    if (dto.stage === AdaptationStage.ARCHIVED) {
      throw new HttpException(
        "Use the archive lifecycle action to archive an adaptation project",
        HttpStatus.BAD_REQUEST
      );
    }

    adaptation.currentStage = dto.stage;
    adaptation.updatedAt = new Date().getTime();
    adaptation.updatedByUserId = user.id ?? null;
    return await this.adaptationRepo.save(adaptation);
  }

  async archive(
    id: number,
    dto: AdaptationArchiveDto,
    user: User
  ): Promise<AdaptationProjectEntity> {
    const adaptation = await this.findOne(id);
    this.assertCanAccessRecord(adaptation, user);
    this.assertEditable(adaptation);

    adaptation.currentStage = AdaptationStage.ARCHIVED;
    adaptation.updatedAt = new Date().getTime();
    adaptation.archivedAt = new Date().getTime();
    adaptation.archivedByUserId = user.id ?? null;
    adaptation.archiveReason = dto.reason ?? null;
    adaptation.updatedByUserId = user.id ?? null;
    return await this.adaptationRepo.save(adaptation);
  }

  // Public, unauthenticated search - only non-sensitive fields are exposed.
  async publicSearch(
    q: string,
    page = 1,
    size = 10,
    filters: { sector?: string; region?: string; status?: string } = {}
  ): Promise<PublicListResponse<AdaptationPublicRow>> {
    const keyword = (q || "").trim();
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, size));

    let qb = this.adaptationRepo
      .createQueryBuilder("adaptation")
      .where(`"adaptation"."archivedAt" IS NULL`)
      .orderBy(`"adaptation"."createdAt"`, "DESC")
      .skip((safePage - 1) * safeSize)
      .take(safeSize);

    if (keyword) {
      qb = qb.andWhere(`"adaptation"."title" ILIKE :keyword`, {
        keyword: `%${keyword}%`,
      });
    }
    if (filters.sector) {
      qb = qb.andWhere(`"adaptation"."sector" = :sector`, {
        sector: filters.sector,
      });
    }
    if (filters.region) {
      qb = qb.andWhere(`"adaptation"."region" = :region`, {
        region: filters.region,
      });
    }
    if (filters.status) {
      qb = qb.andWhere(`"adaptation"."currentStage" = :status`, {
        status: filters.status,
      });
    }

    const [results, total] = await qb.getManyAndCount();

    return {
      data: results.map((r) => this.toPublicRow(r)),
      meta: createPublicMeta(
        {
          q: q || null,
          sector: filters.sector || null,
          region: filters.region || null,
          status: filters.status || null,
        },
        {
          pagination: {
            page: safePage,
            page_size: safeSize,
            total_items: total,
          },
        }
      ),
    };
  }

  async publicSummary(): Promise<{ data: {
    totalProjects: number;
    bySector: Record<string, number>;
    byStage: Record<string, number>;
    sectorUnit: "records";
    stageUnit: "records";
  }; meta: ReturnType<typeof createPublicMeta> }> {
    const projects = await this.adaptationRepo.find({
      where: { archivedAt: IsNull() },
    });

    const bySector: Record<string, number> = {};
    for (const sector of Object.values(AdaptationSector)) {
      bySector[sector] = 0;
    }

    const byStage: Record<string, number> = {};
    for (const stage of Object.values(AdaptationStage)) {
      byStage[stage] = 0;
    }

    for (const project of projects) {
      if (bySector[project.sector] !== undefined) {
        bySector[project.sector]++;
      }
      if (byStage[project.currentStage] !== undefined) {
        byStage[project.currentStage]++;
      }
    }

    return {
      data: {
        totalProjects: projects.length,
        bySector,
        byStage,
        sectorUnit: "records",
        stageUnit: "records",
      },
      meta: createPublicMeta({}, { pagination: { total_items: projects.length } }),
    };
  }

  // Public, unauthenticated single-project detail lookup - keyed by the
  // human-readable adaptationId (e.g. ADP-0001), never the internal
  // numeric id. Never throws on a missing id: returns { found: false }.
  // Responsible org name/address are resolved from the linked Company
  // (a real FK on the entity), matching SRN's "Responsible organization"
  // panel - this project registry, unlike CommunityProgramEntity, does
  // track a submitting organisation.
  async publicDetail(
    id: string
  ): Promise<PublicDetailResponse<AdaptationPublicDetail>> {
    const key = (id || "").trim();
    if (!key) {
      return {
        data: null,
        meta: createPublicMeta({ id: id || null }, { availability: "not_available" }),
      };
    }

    const project = await this.adaptationRepo.findOneBy({
      adaptationId: key,
      archivedAt: IsNull(),
    });
    if (!project) {
      return {
        data: null,
        meta: createPublicMeta({ id: key }, { availability: "not_available" }),
      };
    }

    const company = await this.companyRepo.findOneBy({
      companyId: project.companyId,
    });

    return {
      data: {
        found: true,
        ...this.toPublicRow(project),
        description: project.description,
        period: { start: null, end: null, availability: "not_configured" },
        duration: null,
        goal: { value: null, availability: "not_configured" },
        vulnerability: { value: null, availability: "not_configured" },
        documents: { items: [], availability: "not_configured" },
        responsibleOrganisation: {
          name: company?.name ?? null,
          address: company?.address ?? null,
          type: company?.companyRole ?? null,
          availability: company ? "available" : "not_available",
        },
        createdAt: project.createdAt,
      },
      meta: createPublicMeta({ id: key }, { unit: "records", pagination: { total_items: 1 } }),
    };
  }

  private toPublicRow(record: AdaptationProjectEntity): AdaptationPublicRow {
    return {
      adaptationId: record.adaptationId,
      title: record.title,
      sector: record.sector,
      region: record.region ?? null,
      status: record.currentStage,
    };
  }

  private async findOne(id: number): Promise<AdaptationProjectEntity> {
    const adaptation = await this.adaptationRepo.findOneBy({ id });
    if (!adaptation) {
      throw new HttpException(
        "Adaptation project not found",
        HttpStatus.NOT_FOUND
      );
    }
    return adaptation;
  }

  private assertCanAccessManagement(user: User) {
    if (
      this.isReviewer(user) ||
      user.companyRole === CompanyRole.PROJECT_DEVELOPER
    ) {
      return;
    }
    throw new HttpException(
      "Only project developers, DNA, or Ministry can manage adaptation projects",
      HttpStatus.FORBIDDEN
    );
  }

  private assertCanAccessRecord(record: AdaptationProjectEntity, user: User) {
    const isOwner =
      user.companyRole === CompanyRole.PROJECT_DEVELOPER &&
      record.companyId === user.companyId;
    if (this.isReviewer(user) || isOwner) {
      return;
    }
    throw new HttpException(
      "You do not have access to this adaptation project",
      HttpStatus.FORBIDDEN
    );
  }

  private assertEditable(record: AdaptationProjectEntity) {
    if (
      record.currentStage !== AdaptationStage.SUBMITTED &&
      record.currentStage !== AdaptationStage.UNDER_REVIEW
    ) {
      throw new HttpException(
        "Only submitted or under-review adaptation projects can be edited or archived",
        HttpStatus.CONFLICT
      );
    }
  }

  private isReviewer(user: User): boolean {
    return (
      user.role === Role.Root ||
      ((user.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
        user.companyRole === CompanyRole.MINISTRY) &&
        user.role !== Role.ViewOnly)
    );
  }
}
