import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NdcTargetEntity } from "../entities/ndc.target.entity";
import { NdcTargetService } from "./ndc.target.service";

@Module({
  imports: [TypeOrmModule.forFeature([NdcTargetEntity])],
  providers: [NdcTargetService, Logger],
  exports: [NdcTargetService],
})
export class NdcTargetModule {}
