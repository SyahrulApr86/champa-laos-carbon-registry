import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CapacityBuildingEntity } from "../entities/capacity.building.entity";
import { CapacityBuildingService } from "./capacity.building.service";

@Module({
  imports: [TypeOrmModule.forFeature([CapacityBuildingEntity])],
  providers: [CapacityBuildingService, Logger],
  exports: [CapacityBuildingService],
})
export class CapacityBuildingModule {}
