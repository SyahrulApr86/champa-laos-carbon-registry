import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdaptationProjectEntity } from "../entities/adaptation.project.entity";
import { Company } from "../entities/company.entity";
import { AdaptationService } from "./adaptation.service";

@Module({
  imports: [TypeOrmModule.forFeature([AdaptationProjectEntity, Company])],
  providers: [AdaptationService, Logger],
  exports: [AdaptationService],
})
export class AdaptationModule {}
