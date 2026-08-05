import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { CommunityProgramEntity } from "../entities/community.program.entity";
import { CommunityProgramCreateDto } from "../dto/community.program.create.dto";
import { CommunityProgramUpdateDto } from "../dto/community.program.update.dto";
import { CommunityProgramArchiveDto } from "../dto/community.program.archive.dto";
import { CommunityProgramStatus } from "../enum/community.program.status.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { User } from "../entities/user.entity";
import {
  createPublicMeta,
  PublicDetailResponse,
  PublicListResponse,
} from "../public-data/public.data.contract";

export interface CommunityPublicRow {
  programId: string;
  name: string;
  region: string;
  category: string;
  participantCount: number | null;
  status: string;
  startYear: number;
}

export interface CommunityPublicDetail extends CommunityPublicRow {
  found: boolean;
  description: string;
  period: { start: string; end: string | null; availability: "not_available" };
  duration: null;
  goals: { value: null; availability: "not_available" };
  responsibleOrganisation: { value: null; availability: "not_configured" };
  vulnerability: { value: null; availability: "not_configured" };
  documents: { items: []; availability: "not_configured" };
  location: { region: string; availability: "available" | "not_available" };
  createdAt: number;
}

@Injectable()
export class CommunityProgramService {
  private readonly logger = new Logger(CommunityProgramService.name);

  constructor(
    @InjectRepository(CommunityProgramEntity)
    private communityProgramRepo: Repository<CommunityProgramEntity>
  ) {}

  async create(
    dto: CommunityProgramCreateDto,
    user?: User
  ): Promise<CommunityProgramEntity> {
    // The authenticated controller always supplies a user. The optional
    // actor preserves the migration-safe synthetic demo seeder contract.
    if (user) {
      this.assertCanManage(user);
    }
    this.logger.verbose("Community program create received", dto.name);
    const record = this.communityProgramRepo.create({
      ...dto,
      createdByUserId: user?.id ?? null,
    });
    const saved = await this.communityProgramRepo.save(record);

    saved.programId = "CCP-" + String(saved.id).padStart(4, "0");
    return await this.communityProgramRepo.save(saved);
  }

  async query(
    user: User,
    includeArchived = false
  ): Promise<CommunityProgramEntity[]> {
    this.assertCanManage(user);
    return await this.communityProgramRepo.find({
      where: includeArchived ? {} : { archivedAt: IsNull() },
      order: { createdAt: "DESC" },
    });
  }

  async managementDetail(
    id: number,
    user: User
  ): Promise<CommunityProgramEntity> {
    this.assertCanManage(user);
    return await this.findOne(id);
  }

  async update(
    id: number,
    dto: CommunityProgramUpdateDto,
    user: User
  ): Promise<CommunityProgramEntity> {
    this.assertCanManage(user);
    const record = await this.findOne(id);
    this.assertActive(record);

    if (Object.keys(dto).length === 0) {
      throw new HttpException(
        "At least one community program field is required",
        HttpStatus.BAD_REQUEST
      );
    }
    if (dto.status === CommunityProgramStatus.ARCHIVED) {
      throw new HttpException(
        "Use the archive lifecycle action to archive a community program",
        HttpStatus.BAD_REQUEST
      );
    }

    Object.assign(record, dto, {
      updatedAt: new Date().getTime(),
      updatedByUserId: user.id ?? null,
    });
    return await this.communityProgramRepo.save(record);
  }

  async archive(
    id: number,
    dto: CommunityProgramArchiveDto,
    user: User
  ): Promise<CommunityProgramEntity> {
    this.assertCanManage(user);
    const record = await this.findOne(id);
    this.assertActive(record);

    record.status = CommunityProgramStatus.ARCHIVED;
    record.updatedAt = new Date().getTime();
    record.archivedAt = new Date().getTime();
    record.archivedByUserId = user.id ?? null;
    record.archiveReason = dto.reason ?? null;
    record.updatedByUserId = user.id ?? null;
    return await this.communityProgramRepo.save(record);
  }

  // Public, unauthenticated listing - this registry is intentionally fully
  // public, mirroring the other community-facing registry tabs.
  async publicList(options: {
    q?: string;
    category?: string;
    region?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PublicListResponse<CommunityPublicRow>> {
    const keyword = (options.q || "").trim().toLowerCase();
    const category = (options.category || "").trim().toLowerCase();
    const region = (options.region || "").trim().toLowerCase();
    const status = (options.status || "").trim().toLowerCase();
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 10));
    const records = await this.communityProgramRepo.find({
      where: { archivedAt: IsNull() },
      order: { createdAt: "DESC" },
    });
    const filtered = records.filter((record) => {
      const haystack = `${record.programId} ${record.name} ${record.region} ${record.category}`.toLowerCase();
      return (
        (!keyword || haystack.includes(keyword)) &&
        (!category || String(record.category).toLowerCase() === category) &&
        (!region || String(record.region).toLowerCase() === region) &&
        (!status || String(record.status).toLowerCase() === status)
      );
    });
    const rows = filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map((record) => this.toPublicRow(record));

    return {
      data: rows,
      meta: createPublicMeta(
        { q: options.q || null, category: options.category || null, region: options.region || null, status: options.status || null },
        {
          pagination: { page, page_size: pageSize, total_items: filtered.length },
        }
      ),
    };
  }

  async publicSummary(): Promise<{ data: {
    totalPrograms: number;
    byCategory: Record<string, number>;
    byRegion: Record<string, number>;
    totalParticipants: number | null;
    categoryUnit: "records";
    participantUnit: "participants";
    byStatus: Record<string, number>;
    statusUnit: "records";
  }; meta: ReturnType<typeof createPublicMeta> }> {
    const records = await this.communityProgramRepo.find({
      where: { archivedAt: IsNull() },
    });

    let totalParticipants = 0;
    let hasParticipants = false;
    const byCategory: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const status of Object.values(CommunityProgramStatus)) {
      byStatus[status] = 0;
    }

    for (const record of records) {
      if (record.participantCount !== null && record.participantCount !== undefined) {
        totalParticipants += Number(record.participantCount);
        hasParticipants = true;
      }
      byCategory[record.category] = (byCategory[record.category] || 0) + 1;
      byRegion[record.region] = (byRegion[record.region] || 0) + 1;
      byStatus[record.status] = (byStatus[record.status] || 0) + 1;
    }

    return {
      data: {
        totalPrograms: records.length,
        byCategory,
        byRegion,
        totalParticipants: hasParticipants ? totalParticipants : null,
        categoryUnit: "records",
        participantUnit: "participants",
        byStatus,
        statusUnit: "records",
      },
      meta: createPublicMeta({}, { unit: "records", pagination: { total_items: records.length } }),
    };
  }

  // Public, unauthenticated single-program detail lookup - keyed by the
  // human-readable programId (e.g. CCP-0001), never the internal numeric
  // id. Never throws on a missing id: returns { found: false }.
  // CommunityProgramEntity, unlike AdaptationProjectEntity, has no
  // submitting-company FK - so unlike the Adaptation detail response,
  // no "Responsible organization" field is returned here; the frontend
  // must not fabricate one.
  async publicDetail(id: string): Promise<PublicDetailResponse<CommunityPublicDetail>> {
    const key = (id || "").trim();
    if (!key) {
      return {
        data: null,
        meta: createPublicMeta({ id: id || null }, { availability: "not_available" }),
      };
    }

    const record = await this.communityProgramRepo.findOneBy({
      programId: key,
      archivedAt: IsNull(),
    });
    if (!record) {
      return {
        data: null,
        meta: createPublicMeta({ id: key }, { availability: "not_available" }),
      };
    }

    return {
      data: {
        found: true,
        ...this.toPublicRow(record),
        description: record.description,
        period: {
          start: `${record.startYear}-01-01`,
          end: null,
          availability: "not_available",
        },
        duration: null,
        goals: { value: null, availability: "not_available" },
        responsibleOrganisation: { value: null, availability: "not_configured" },
        vulnerability: { value: null, availability: "not_configured" },
        documents: { items: [], availability: "not_configured" },
        location: {
          region: record.region,
          availability: record.region ? "available" : "not_available",
        },
        createdAt: record.createdAt,
      },
      meta: createPublicMeta({ id: key }, { unit: "records", pagination: { total_items: 1 } }),
    };
  }

  private toPublicRow(record: CommunityProgramEntity): CommunityPublicRow {
    return {
      programId: record.programId,
      name: record.name,
      region: record.region,
      category: record.category,
      participantCount: record.participantCount ?? null,
      status: record.status,
      startYear: record.startYear,
    };
  }

  private async findOne(id: number): Promise<CommunityProgramEntity> {
    const record = await this.communityProgramRepo.findOneBy({ id });
    if (!record) {
      throw new HttpException(
        "Community program not found",
        HttpStatus.NOT_FOUND
      );
    }
    return record;
  }

  private assertCanManage(user: User) {
    if (
      user.role === Role.Root ||
      ((user.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
        user.companyRole === CompanyRole.MINISTRY) &&
        user.role !== Role.ViewOnly)
    ) {
      return;
    }
    throw new HttpException(
      "Only DNA or Ministry users can manage community programs",
      HttpStatus.FORBIDDEN
    );
  }

  private assertActive(record: CommunityProgramEntity) {
    if (record.archivedAt !== null && record.archivedAt !== undefined) {
      throw new HttpException(
        "Archived community programs cannot be changed",
        HttpStatus.CONFLICT
      );
    }
  }
}
