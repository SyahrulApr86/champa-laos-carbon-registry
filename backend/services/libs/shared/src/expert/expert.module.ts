import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExpertEntity } from "../entities/expert.entity";
import { Region } from "../entities/region.entity";
import { ExpertService } from "./expert.service";

@Module({
  imports: [TypeOrmModule.forFeature([ExpertEntity, Region])],
  providers: [ExpertService, Logger],
  exports: [ExpertService],
})
export class ExpertModule {}
