import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecognizedMitigationEntity } from "../entities/recognized.mitigation.entity";
import { Region } from "../entities/region.entity";
import { RecognizedMitigationService } from "./recognized.mitigation.service";

@Module({
  imports: [TypeOrmModule.forFeature([RecognizedMitigationEntity, Region])],
  providers: [RecognizedMitigationService, Logger],
  exports: [RecognizedMitigationService],
})
export class RecognizedMitigationModule {}
