import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommunityProgramEntity } from "../entities/community.program.entity";
import { CommunityProgramService } from "./community.program.service";

@Module({
  imports: [TypeOrmModule.forFeature([CommunityProgramEntity])],
  providers: [CommunityProgramService, Logger],
  exports: [CommunityProgramService],
})
export class CommunityProgramModule {}
