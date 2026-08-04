import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CapacityBuildingEntity } from "../entities/capacity.building.entity";
import { CapacityBuildingCreateDto } from "../dto/capacity.building.create.dto";

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
  async publicList(): Promise<CapacityBuildingEntity[]> {
    return await this.capacityBuildingRepo.find({
      order: { createdAt: "DESC" },
    });
  }
}
