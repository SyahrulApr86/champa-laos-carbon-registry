import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TechnologyTransferEntity } from "../entities/technology.transfer.entity";
import { TechnologyTransferService } from "./technology.transfer.service";

@Module({
  imports: [TypeOrmModule.forFeature([TechnologyTransferEntity])],
  providers: [TechnologyTransferService, Logger],
  exports: [TechnologyTransferService],
})
export class TechnologyTransferModule {}
