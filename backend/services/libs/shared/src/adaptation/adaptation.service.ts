import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdaptationProjectEntity } from "../entities/adaptation.project.entity";
import { AdaptationCreateDto } from "../dto/adaptation.create.dto";
import { AdaptationStageUpdateDto } from "../dto/adaptation.stage.update.dto";
import { AdaptationSector } from "../enum/adaptation.sector.enum";
import { AdaptationStage } from "../enum/adaptation.stage.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { User } from "../entities/user.entity";
import { Company } from "../entities/company.entity";

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
    });

    const saved = await this.adaptationRepo.save(adaptation);

    saved.adaptationId = "ADP-" + String(saved.id).padStart(4, "0");
    return await this.adaptationRepo.save(saved);
  }

  // Project developers see only their own submissions; DNA/Ministry see all.
  async query(user: User): Promise<AdaptationProjectEntity[]> {
    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      return await this.adaptationRepo.find({
        where: { companyId: user.companyId },
        order: { createdAt: "DESC" },
      });
    }
    return await this.adaptationRepo.find({ order: { createdAt: "DESC" } });
  }

  async updateStage(
    id: number,
    dto: AdaptationStageUpdateDto,
    user: User
  ): Promise<AdaptationProjectEntity> {
    if (
      user.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
      user.companyRole !== CompanyRole.MINISTRY
    ) {
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

    adaptation.currentStage = dto.stage;
    return await this.adaptationRepo.save(adaptation);
  }

  // Public, unauthenticated search - only non-sensitive fields are exposed.
  async publicSearch(
    q: string,
    page = 1,
    size = 10
  ): Promise<{ data: any[]; total: number }> {
    const keyword = (q || "").trim();
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, size));

    let qb = this.adaptationRepo
      .createQueryBuilder("adaptation")
      .orderBy(`"adaptation"."createdAt"`, "DESC")
      .skip((safePage - 1) * safeSize)
      .take(safeSize);

    if (keyword) {
      qb = qb.andWhere(`"adaptation"."title" ILIKE :keyword`, {
        keyword: `%${keyword}%`,
      });
    }

    const [results, total] = await qb.getManyAndCount();

    return {
      data: results.map((r) => ({
        adaptationId: r.adaptationId,
        title: r.title,
        sector: r.sector,
        region: r.region,
        status: r.currentStage,
      })),
      total,
    };
  }

  async publicSummary(): Promise<{
    totalProjects: number;
    bySector: Record<string, number>;
    byStage: Record<string, number>;
  }> {
    const projects = await this.adaptationRepo.find();

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
      totalProjects: projects.length,
      bySector,
      byStage,
    };
  }

  // Public, unauthenticated single-project detail lookup - keyed by the
  // human-readable adaptationId (e.g. ADP-0001), never the internal
  // numeric id. Never throws on a missing id: returns { found: false }.
  // Responsible org name/address are resolved from the linked Company
  // (a real FK on the entity), matching SRN's "Responsible organization"
  // panel - this project registry, unlike CommunityProgramEntity, does
  // track a submitting organisation.
  async publicDetail(id: string): Promise<any> {
    const key = (id || "").trim();
    if (!key) {
      return { found: false };
    }

    const project = await this.adaptationRepo.findOneBy({
      adaptationId: key,
    });
    if (!project) {
      return { found: false };
    }

    const company = await this.companyRepo.findOneBy({
      companyId: project.companyId,
    });

    return {
      found: true,
      adaptationId: project.adaptationId,
      title: project.title,
      description: project.description,
      sector: project.sector,
      region: project.region,
      currentStage: project.currentStage,
      responsibleOrgName: company?.name,
      responsibleOrgAddress: company?.address,
      responsibleOrgType: company?.companyRole,
      createdAt: project.createdAt,
    };
  }
}
