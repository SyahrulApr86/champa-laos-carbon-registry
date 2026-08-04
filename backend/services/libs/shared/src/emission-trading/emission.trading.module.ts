import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmissionCeilingEntity } from "../entities/emission.ceiling.entity";
import { EmissionTradingEntity } from "../entities/emission.trading.entity";
import { EmissionTradingService } from "./emission.trading.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([EmissionCeilingEntity, EmissionTradingEntity]),
  ],
  providers: [EmissionTradingService, Logger],
  exports: [EmissionTradingService],
})
export class EmissionTradingModule {}
