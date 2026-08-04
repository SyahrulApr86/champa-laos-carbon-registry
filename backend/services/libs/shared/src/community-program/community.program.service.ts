import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CommunityProgramEntity } from "../entities/community.program.entity";
import { CommunityProgramCreateDto } from "../dto/community.program.create.dto";

@Injectable()
export class CommunityProgramService {
  private readonly logger = new Logger(CommunityProgramService.name);

  constructor(
    @InjectRepository(CommunityProgramEntity)
    private communityProgramRepo: Repository<CommunityProgramEntity>
  ) {}

  async create(
    dto: CommunityProgramCreateDto
  ): Promise<CommunityProgramEntity> {
    this.logger.verbose("Community program create received", dto.name);
    const record = this.communityProgramRepo.create(dto);
    const saved = await this.communityProgramRepo.save(record);

    saved.programId = "CCP-" + String(saved.id).padStart(4, "0");
    return await this.communityProgramRepo.save(saved);
  }

  // Public, unauthenticated listing - this registry is intentionally fully
  // public, mirroring the other community-facing registry tabs.
  async publicList(): Promise<CommunityProgramEntity[]> {
    return await this.communityProgramRepo.find({
      order: { createdAt: "DESC" },
    });
  }

  async publicSummary(): Promise<{
    totalPrograms: number;
    byCategory: Record<string, number>;
    byRegion: Record<string, number>;
    totalParticipants: number;
  }> {
    const records = await this.communityProgramRepo.find();

    let totalParticipants = 0;
    const byCategory: Record<string, number> = {};
    const byRegion: Record<string, number> = {};

    for (const record of records) {
      totalParticipants += Number(record.participantCount) || 0;
      byCategory[record.category] = (byCategory[record.category] || 0) + 1;
      byRegion[record.region] = (byRegion[record.region] || 0) + 1;
    }

    return {
      totalPrograms: records.length,
      byCategory,
      byRegion,
      totalParticipants,
    };
  }

  // Public, unauthenticated single-program detail lookup - keyed by the
  // human-readable programId (e.g. CCP-0001), never the internal numeric
  // id. Never throws on a missing id: returns { found: false }.
  // CommunityProgramEntity, unlike AdaptationProjectEntity, has no
  // submitting-company FK - so unlike the Adaptation detail response,
  // no "Responsible organization" field is returned here; the frontend
  // must not fabricate one.
  async publicDetail(id: string): Promise<any> {
    const key = (id || "").trim();
    if (!key) {
      return { found: false };
    }

    const record = await this.communityProgramRepo.findOneBy({
      programId: key,
    });
    if (!record) {
      return { found: false };
    }

    return {
      found: true,
      programId: record.programId,
      name: record.name,
      region: record.region,
      category: record.category,
      description: record.description,
      participantCount: record.participantCount,
      startYear: record.startYear,
      status: record.status,
      createdAt: record.createdAt,
    };
  }
}
