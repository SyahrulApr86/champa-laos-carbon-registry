import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GuidanceDocumentEntity } from "../entities/guidance.document.entity";
import { GuidanceDocumentService } from "./guidance.document.service";

@Module({
  imports: [TypeOrmModule.forFeature([GuidanceDocumentEntity])],
  providers: [GuidanceDocumentService, Logger],
  exports: [GuidanceDocumentService],
})
export class GuidanceDocumentModule {}
