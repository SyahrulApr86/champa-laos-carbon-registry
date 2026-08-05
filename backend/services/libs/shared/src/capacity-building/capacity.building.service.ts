import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CapacityBuildingEntity } from "../entities/capacity.building.entity";
import { CapacityBuildingCreateDto } from "../dto/capacity.building.create.dto";
import { CapacityBuildingUpdateDto } from "../dto/capacity.building.update.dto";
import {
  createPublicMeta,
  PublicListResponse,
} from "../public-data/public.data.contract";

export interface CapacityBuildingManagementOptions {
  q?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

export type CapacityBuildingPublicRow = Omit<
  CapacityBuildingEntity,
  "archivedAt" | "archiveReason" | "setCreatedAt"
>;

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
    this.logger.verbose("Capacity building record create received", dto.title);
    const record = this.capacityBuildingRepo.create(dto);
    return await this.capacityBuildingRepo.save(record);
  }

  async managementList(
    options: CapacityBuildingManagementOptions = {}
  ): Promise<PublicListResponse<CapacityBuildingEntity>> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 25));
    const keyword = (options.q || "").trim().toLowerCase();
    const records = await this.capacityBuildingRepo.find({
      order: { createdAt: "DESC" },
    });
    const filtered = records.filter(
      (record) =>
        (options.includeArchived || record.archivedAt == null) &&
        (!keyword ||
          `${record.title} ${record.recipientEntity} ${record.implementingEntity}`
            .toLowerCase()
            .includes(keyword))
    );
    return {
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      meta: createPublicMeta(
        {
          q: options.q || null,
          includeArchived: options.includeArchived ? "true" : "false",
        },
        {
          pagination: {
            page,
            page_size: pageSize,
            total_items: filtered.length,
          },
        }
      ),
    };
  }

  async managementDetail(id: number): Promise<CapacityBuildingEntity> {
    const record = await this.capacityBuildingRepo.findOneBy({ id });
    if (!record) {
      throw new HttpException(
        "Capacity building record not found",
        HttpStatus.NOT_FOUND
      );
    }
    return record;
  }

  async update(
    id: number,
    dto: CapacityBuildingUpdateDto
  ): Promise<CapacityBuildingEntity> {
    const record = await this.managementDetail(id);
    if (record.archivedAt != null) {
      throw new HttpException(
        "Archived capacity building records cannot be edited",
        HttpStatus.CONFLICT
      );
    }
    Object.assign(record, dto, { updatedAt: Date.now() });
    return await this.capacityBuildingRepo.save(record);
  }

  async archive(id: number, reason?: string): Promise<CapacityBuildingEntity> {
    const record = await this.managementDetail(id);
    Object.assign(record, {
      archivedAt: Date.now(),
      archiveReason: reason || null,
      updatedAt: Date.now(),
    });
    return await this.capacityBuildingRepo.save(record);
  }

  async remove(id: number): Promise<{ id: number; deleted: true }> {
    await this.managementDetail(id);
    await this.capacityBuildingRepo.delete(id);
    return { id, deleted: true };
  }

  // Public, unauthenticated - this data is intentionally fully public,
  // mirroring SRN's public "Capacity Building Support Received" table.
  async publicList(
    options: {
      q?: string;
      sector?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PublicListResponse<CapacityBuildingPublicRow>> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 10));
    const records = await this.capacityBuildingRepo.find({
      order: { createdAt: "DESC" },
    });
    const keyword = (options.q || "").trim().toLowerCase();
    const filtered = records.filter(
      (record) =>
        record.archivedAt == null &&
        (!keyword ||
          `${record.title} ${record.recipientEntity} ${record.implementingEntity}`
            .toLowerCase()
            .includes(keyword)) &&
        (!options.sector || record.sector === options.sector) &&
        (!options.status || record.status === options.status)
    );
    return {
      data: filtered
        .slice((page - 1) * pageSize, page * pageSize)
        .map(({ archivedAt, archiveReason, ...record }) => record),
      meta: createPublicMeta(
        {
          q: options.q || null,
          sector: options.sector || null,
          status: options.status || null,
        },
        {
          pagination: {
            page,
            page_size: pageSize,
            total_items: filtered.length,
          },
        }
      ),
    };
  }
}
