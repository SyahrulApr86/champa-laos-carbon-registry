import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { MethodologyEntity } from "../entities/methodology.entity";
import { MethodologyCreateDto } from "../dto/methodology.create.dto";
import { MethodologyUpdateDto } from "../dto/methodology.update.dto";
import { Sector } from "../enum/sector.enum";
import { MethodologyStatus } from "../enum/methodology.status.enum";
import { DataListResponseDto } from "../dto/data.list.response";

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
  ): Promise<DataListResponseDto & { page: number; pageSize: number; totalPages: number; meta: Record<string, unknown> }> {
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
      .orderBy(sortColumns[sortBy] ?? sortColumns.methodologyNumber, sortOrder === "desc" ? "DESC" : "ASC")
      .addOrderBy(`methodology."id"`, "ASC")
      .offset(safeSize * safePage - safeSize)
      .limit(safeSize)
      .getManyAndCount();

    return {
      ...new DataListResponseDto(
        data.map((record) => ({
          ...record,
          publicationStatus: record.status,
          methodologyVersion: null,
          documentUrl: null,
        })),
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
        disclosure: "Synthetic demonstration data — not official Lao PDR policy or approval records.",
      },
    };
  }

  async findPublicOne(id: number) {
    const record = await this.methodologyRepo.findOneBy({ id });
    if (!record) {
      throw new HttpException("Methodology not found", HttpStatus.NOT_FOUND);
    }
    return {
      ...record,
      publicationStatus: record.status,
      methodologyVersion: null,
      documentUrl: null,
      meta: {
        dataset_kind: "demo_synthetic",
        source_type: "synthetic_demo",
        scenario: "Champa registry demonstration",
        disclosure: "Synthetic demonstration data — not official Lao PDR policy or approval records.",
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

  async create(dto: MethodologyCreateDto): Promise<MethodologyEntity> {
    this.logger.verbose("Methodology create received", dto.methodologyNumber);

    const methodology = this.methodologyRepo.create(dto);

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

  async update(
    id: number,
    dto: MethodologyUpdateDto
  ): Promise<MethodologyEntity> {
    const methodology = await this.findOne(id);

    Object.assign(methodology, dto);

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
}
