import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { MethodologyEntity } from "../entities/methodology.entity";
import { MethodologyCreateDto } from "../dto/methodology.create.dto";
import { MethodologyUpdateDto } from "../dto/methodology.update.dto";
import {
  MethodologyLifecycleAction,
  MethodologyLifecycleDto,
} from "../dto/methodology.lifecycle.dto";
import { Sector } from "../enum/sector.enum";
import { MethodologyStatus } from "../enum/methodology.status.enum";
import { DataListResponseDto } from "../dto/data.list.response";
import { User } from "../entities/user.entity";

const PG_UNIQUE_VIOLATION = "23505";

@Injectable()
export class MethodologyService {
  private readonly logger = new Logger(MethodologyService.name);

  constructor(
    @InjectRepository(MethodologyEntity)
    private methodologyRepo: Repository<MethodologyEntity>
  ) {}

  // Public directory search - keyword search across methodologyNumber/name/source
  // plus optional category and status filters. No ability/company scoping since
  // this listing is intentionally public (proponents/VVBs browse without login).
  async findPublic(
    keyword?: string,
    category?: Sector,
    status?: MethodologyStatus,
    page = 1,
    size = 10,
    sortBy: "methodologyNumber" | "name" | "source" = "methodologyNumber",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<
    DataListResponseDto & {
      page: number;
      pageSize: number;
      totalPages: number;
      meta: Record<string, unknown>;
    }
  > {
    let qb = this.methodologyRepo.createQueryBuilder("methodology");

    if (keyword) {
      qb = qb.andWhere(
        `(methodology."methodologyNumber" ILIKE :keyword OR methodology."name" ILIKE :keyword OR methodology."source" ILIKE :keyword)`,
        { keyword: `%${keyword}%` }
      );
    }

    if (category) {
      qb = qb.andWhere(`methodology."category" = :category`, { category });
    }

    // The public directory represents published methods. An explicit status
    // remains supported for the existing directory filter, while the default
    // is deliberately active so archiving refreshes public results.
    if (status) {
      qb = qb.andWhere(`methodology."status" = :status`, { status });
    } else {
      qb = qb.andWhere(`methodology."status" = :status`, {
        status: MethodologyStatus.ACTIVE,
      });
    }

    const sortColumns = {
      methodologyNumber: `methodology."methodologyNumber"`,
      name: `methodology."name"`,
      source: `methodology."source"`,
    } as const;
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, size));
    const [data, total] = await qb
      .orderBy(
        sortColumns[sortBy] ?? sortColumns.methodologyNumber,
        sortOrder === "desc" ? "DESC" : "ASC"
      )
      .addOrderBy(`methodology."id"`, "ASC")
      .offset(safeSize * safePage - safeSize)
      .limit(safeSize)
      .getManyAndCount();

    return {
      ...new DataListResponseDto(
        data.map((record) => this.toPublicRecord(record)),
        total
      ),
      page: safePage,
      pageSize: safeSize,
      totalPages: Math.ceil(total / safeSize),
      meta: {
        dataset_kind: "demo_synthetic",
        source_type: "synthetic_demo",
        scenario: "Champa registry demonstration",
        availability: data.length ? "available" : "empty",
        disclosure:
          "Synthetic demonstration data, not official Lao PDR policy or approval records.",
      },
    };
  }

  async findPublicOne(id: number) {
    const record = await this.methodologyRepo.findOneBy({
      id,
      status: MethodologyStatus.ACTIVE,
    });
    if (!record) {
      throw new HttpException("Methodology not found", HttpStatus.NOT_FOUND);
    }
    return {
      ...this.toPublicRecord(record),
      meta: {
        dataset_kind: "demo_synthetic",
        source_type: "synthetic_demo",
        scenario: "Champa registry demonstration",
        disclosure:
          "Synthetic demonstration data, not official Lao PDR policy or approval records.",
      },
    };
  }

  async findOne(id: number): Promise<MethodologyEntity> {
    const methodology = await this.methodologyRepo.findOneBy({ id });
    if (!methodology) {
      throw new HttpException("Methodology not found", HttpStatus.NOT_FOUND);
    }
    return methodology;
  }

  async findAdmin(
    keyword?: string,
    category?: Sector,
    status?: MethodologyStatus,
    page = 1,
    size = 10,
    sortBy: "methodologyNumber" | "name" | "source" = "methodologyNumber",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<
    DataListResponseDto & { page: number; pageSize: number; totalPages: number }
  > {
    let qb = this.methodologyRepo.createQueryBuilder("methodology");
    const normalizedKeyword = keyword?.trim();

    if (normalizedKeyword) {
      qb = qb.andWhere(
        `(methodology."methodologyNumber" ILIKE :keyword OR methodology."name" ILIKE :keyword OR methodology."source" ILIKE :keyword)`,
        { keyword: `%${normalizedKeyword}%` }
      );
    }
    if (category) {
      qb = qb.andWhere(`methodology."category" = :category`, { category });
    }
    if (status) {
      qb = qb.andWhere(`methodology."status" = :status`, { status });
    }

    const sortColumns = {
      methodologyNumber: `methodology."methodologyNumber"`,
      name: `methodology."name"`,
      source: `methodology."source"`,
    } as const;
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, size));
    const [data, total] = await qb
      .orderBy(
        sortColumns[sortBy] ?? sortColumns.methodologyNumber,
        sortOrder === "desc" ? "DESC" : "ASC"
      )
      .addOrderBy(`methodology."id"`, "ASC")
      .offset(safeSize * safePage - safeSize)
      .limit(safeSize)
      .getManyAndCount();

    return {
      ...new DataListResponseDto(
        data.map((record) => this.toAdminRecord(record)),
        total
      ),
      page: safePage,
      pageSize: safeSize,
      totalPages: Math.ceil(total / safeSize),
    };
  }

  async findAdminOne(id: number) {
    return this.toAdminRecord(await this.findOne(id));
  }

  async create(
    dto: MethodologyCreateDto,
    user?: Pick<User, "id">
  ): Promise<MethodologyEntity> {
    this.logger.verbose("Methodology create received", dto.methodologyNumber);

    const methodology = this.methodologyRepo.create({
      ...dto,
      status: dto.status ?? MethodologyStatus.ACTIVE,
      createdBy: user?.id,
      updatedBy: user?.id,
    });

    return await this.save(methodology);
  }

  async update(
    id: number,
    dto: MethodologyUpdateDto,
    user?: Pick<User, "id">
  ): Promise<MethodologyEntity> {
    const methodology = await this.findOne(id);

    if (methodology.status === MethodologyStatus.INACTIVE) {
      throw new HttpException(
        "Archived methodologies must be published before they can be edited",
        HttpStatus.CONFLICT
      );
    }

    Object.assign(methodology, dto);
    methodology.updatedBy = user?.id ?? methodology.updatedBy;

    if (dto.status === MethodologyStatus.INACTIVE) {
      methodology.archivedAt = Date.now();
      methodology.archivedBy = user?.id;
    }

    return await this.save(methodology);
  }

  async transition(
    id: number,
    dto: MethodologyLifecycleDto,
    user?: Pick<User, "id">
  ): Promise<MethodologyEntity> {
    const methodology = await this.findOne(id);

    if (dto.action === MethodologyLifecycleAction.ARCHIVE) {
      methodology.status = MethodologyStatus.INACTIVE;
      methodology.archivedAt = Date.now();
      methodology.archivedBy = user?.id;
    } else {
      methodology.status = MethodologyStatus.ACTIVE;
      methodology.archivedAt = null;
      methodology.archivedBy = null;
    }
    methodology.updatedBy = user?.id ?? methodology.updatedBy;

    return await this.save(methodology);
  }

  // DELETE is intentionally a safe lifecycle alias. Methodology records are
  // retained so references and the admin audit fields remain recoverable.
  async archive(
    id: number,
    user?: Pick<User, "id">
  ): Promise<MethodologyEntity> {
    return this.transition(
      id,
      { action: MethodologyLifecycleAction.ARCHIVE },
      user
    );
  }

  private async save(
    methodology: MethodologyEntity
  ): Promise<MethodologyEntity> {
    return await this.methodologyRepo.save(methodology).catch((err: any) => {
      if (err instanceof QueryFailedError) {
        switch ((err as any).driverError?.code) {
          case PG_UNIQUE_VIOLATION:
            throw new HttpException(
              "A methodology with this methodology number already exists",
              HttpStatus.BAD_REQUEST
            );
        }
      }
      throw err;
    });
  }

  private toPublicRecord(record: MethodologyEntity) {
    return {
      id: record.id,
      methodologyNumber: record.methodologyNumber,
      name: record.name,
      source: record.source,
      category: record.category,
      status: record.status,
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      publicationStatus: record.status,
      methodologyVersion: null,
      documentUrl: null,
    };
  }

  private toAdminRecord(record: MethodologyEntity) {
    return {
      ...record,
      audit: {
        createdAt: record.createdAt,
        createdBy: record.createdBy ?? null,
        updatedAt: record.updatedAt,
        updatedBy: record.updatedBy ?? null,
        archivedAt: record.archivedAt ?? null,
        archivedBy: record.archivedBy ?? null,
      },
    };
  }
}
