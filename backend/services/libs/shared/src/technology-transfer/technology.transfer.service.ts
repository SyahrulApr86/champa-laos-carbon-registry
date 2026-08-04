import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TechnologyTransferEntity } from "../entities/technology.transfer.entity";
import { TechnologyTransferCreateDto } from "../dto/technology.transfer.create.dto";

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

  // Public, unauthenticated - this data is intentionally fully public,
  // mirroring SRN's public "Technology Development & Transfer Support
  // Received" table.
  async publicList(): Promise<TechnologyTransferEntity[]> {
    return await this.technologyTransferRepo.find({
      order: { createdAt: "DESC" },
    });
  }
}
