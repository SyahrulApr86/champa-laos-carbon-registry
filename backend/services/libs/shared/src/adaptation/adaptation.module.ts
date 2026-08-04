import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdaptationProjectEntity } from "../entities/adaptation.project.entity";
import { AdaptationService } from "./adaptation.service";

@Module({
  imports: [TypeOrmModule.forFeature([AdaptationProjectEntity])],
  providers: [AdaptationService, Logger],
  exports: [AdaptationService],
})
export class AdaptationModule {}
