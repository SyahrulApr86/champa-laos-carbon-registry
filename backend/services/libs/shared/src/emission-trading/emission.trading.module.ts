import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmissionCeilingEntity } from "../entities/emission.ceiling.entity";
import { EmissionTradingEntity } from "../entities/emission.trading.entity";
import { EmissionParticipantEntity } from "../entities/emission.participant.entity";
import { Company } from "../entities/company.entity";
import { EmissionTradingService } from "./emission.trading.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmissionCeilingEntity,
      EmissionTradingEntity,
      EmissionParticipantEntity,
      Company,
    ]),
  ],
  providers: [EmissionTradingService, Logger],
  exports: [EmissionTradingService],
})
export class EmissionTradingModule {}
