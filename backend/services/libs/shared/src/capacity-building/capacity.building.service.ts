import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CapacityBuildingEntity } from "../entities/capacity.building.entity";
import { CapacityBuildingCreateDto } from "../dto/capacity.building.create.dto";
import { createPublicMeta, PublicListResponse } from "../public-data/public.data.contract";

@Injectable()
export class CapacityBuildingService {
  private readonly logger = new Logger(CapacityBuildingService.name);

  constructor(
    @InjectRepository(CapacityBuildingEntity)
    private capacityBuildingRepo: Repository<CapacityBuildingEntity>
  ) {}

  async create(
    dto: CapacityBuildingCreateDto
  ): Promise<CapacityBuildingEntity> {
    this.logger.verbose(
      "Capacity building record create received",
      dto.title
    );
    const record = this.capacityBuildingRepo.create(dto);
    return await this.capacityBuildingRepo.save(record);
  }

  // Public, unauthenticated - this data is intentionally fully public,
  // mirroring SRN's public "Capacity Building Support Received" table.
  async publicList(options: {
    q?: string;
    sector?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PublicListResponse<CapacityBuildingEntity>> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 10));
    const records = await this.capacityBuildingRepo.find({
      order: { createdAt: "DESC" },
    });
    const keyword = (options.q || "").trim().toLowerCase();
    const filtered = records.filter((record) =>
      (!keyword || `${record.title} ${record.recipientEntity} ${record.implementingEntity}`.toLowerCase().includes(keyword)) &&
      (!options.sector || record.sector === options.sector) &&
      (!options.status || record.status === options.status)
    );
    return {
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      meta: createPublicMeta(
        { q: options.q || null, sector: options.sector || null, status: options.status || null },
        { pagination: { page, page_size: pageSize, total_items: filtered.length } }
      ),
    };
  }
}
