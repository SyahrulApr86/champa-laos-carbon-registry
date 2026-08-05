import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TechnologyTransferEntity } from "../entities/technology.transfer.entity";
import { TechnologyTransferCreateDto } from "../dto/technology.transfer.create.dto";
import { TechnologyTransferUpdateDto } from "../dto/technology.transfer.update.dto";
import {
  createPublicMeta,
  PublicListResponse,
} from "../public-data/public.data.contract";

export interface TechnologyTransferManagementOptions {
  q?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

export type TechnologyTransferPublicRow = Omit<
  TechnologyTransferEntity,
  "archivedAt" | "archiveReason" | "setCreatedAt"
>;

@Injectable()
export class TechnologyTransferService {
  private readonly logger = new Logger(TechnologyTransferService.name);

  constructor(
    @InjectRepository(TechnologyTransferEntity)
    private technologyTransferRepo: Repository<TechnologyTransferEntity>
  ) {}

  async create(
    dto: TechnologyTransferCreateDto
  ): Promise<TechnologyTransferEntity> {
    this.logger.verbose(
      "Technology transfer record create received",
      dto.title
    );
    const record = this.technologyTransferRepo.create(dto);
    return await this.technologyTransferRepo.save(record);
  }

  async managementList(
    options: TechnologyTransferManagementOptions = {}
  ): Promise<PublicListResponse<TechnologyTransferEntity>> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 25));
    const keyword = (options.q || "").trim().toLowerCase();
    const records = await this.technologyTransferRepo.find({
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

  async managementDetail(id: number): Promise<TechnologyTransferEntity> {
    const record = await this.technologyTransferRepo.findOneBy({ id });
    if (!record) {
      throw new HttpException(
        "Technology transfer record not found",
        HttpStatus.NOT_FOUND
      );
    }
    return record;
  }

  async update(
    id: number,
    dto: TechnologyTransferUpdateDto
  ): Promise<TechnologyTransferEntity> {
    const record = await this.managementDetail(id);
    if (record.archivedAt != null) {
      throw new HttpException(
        "Archived technology transfer records cannot be edited",
        HttpStatus.CONFLICT
      );
    }
    Object.assign(record, dto, { updatedAt: Date.now() });
    return await this.technologyTransferRepo.save(record);
  }

  async archive(
    id: number,
    reason?: string
  ): Promise<TechnologyTransferEntity> {
    const record = await this.managementDetail(id);
    Object.assign(record, {
      archivedAt: Date.now(),
      archiveReason: reason || null,
      updatedAt: Date.now(),
    });
    return await this.technologyTransferRepo.save(record);
  }

  async remove(id: number): Promise<{ id: number; deleted: true }> {
    await this.managementDetail(id);
    await this.technologyTransferRepo.delete(id);
    return { id, deleted: true };
  }

  // Public, unauthenticated - this data is intentionally fully public,
  // mirroring SRN's public "Technology Development & Transfer Support
  // Received" table.
  async publicList(
    options: {
      q?: string;
      sector?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PublicListResponse<TechnologyTransferPublicRow>> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 10));
    const records = await this.technologyTransferRepo.find({
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
