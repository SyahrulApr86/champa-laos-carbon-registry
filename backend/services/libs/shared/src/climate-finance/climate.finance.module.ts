import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClimateFinanceEntity } from "../entities/climate.finance.entity";
import { ClimateFinanceService } from "./climate.finance.service";

@Module({
  imports: [TypeOrmModule.forFeature([ClimateFinanceEntity])],
  providers: [ClimateFinanceService, Logger],
  exports: [ClimateFinanceService],
})
export class ClimateFinanceModule {}
