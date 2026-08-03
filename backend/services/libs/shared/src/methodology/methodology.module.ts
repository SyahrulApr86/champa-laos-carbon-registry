import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MethodologyEntity } from "../entities/methodology.entity";
import { MethodologyService } from "./methodology.service";

@Module({
  imports: [TypeOrmModule.forFeature([MethodologyEntity])],
  providers: [MethodologyService, Logger],
  exports: [MethodologyService],
})
export class MethodologyModule {}
