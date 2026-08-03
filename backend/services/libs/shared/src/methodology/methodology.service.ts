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
    size = 10
  ): Promise<DataListResponseDto> {
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

    const [data, total] = await qb
      .orderBy(`methodology."methodologyNumber"`, "ASC")
      .offset(size * page - size)
      .limit(size)
      .getManyAndCount();

    return new DataListResponseDto(data, total);
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
