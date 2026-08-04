import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReddPlusEntity } from "../entities/redd.plus.entity";
import { Region } from "../entities/region.entity";
import { ReddPlusService } from "./redd.plus.service";

@Module({
  imports: [TypeOrmModule.forFeature([ReddPlusEntity, Region])],
  providers: [ReddPlusService, Logger],
  exports: [ReddPlusService],
})
export class ReddPlusModule {}
