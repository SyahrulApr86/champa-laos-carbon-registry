import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SharedModule } from "@app/shared/shared.module";
import { Company } from "@app/shared/entities/company.entity";
import { User } from "@app/shared/entities/user.entity";
import { Programme } from "@app/shared/entities/programme.entity";
import { DemoSeederService } from "./demo-seeder.service";

// Internal-only module for `RUN_MODULE=demo-seeder` (see src/main.ts). Not
// wired into any HTTP controller - deliberately unreachable from the public
// API, matching the same "run as a standalone process context" pattern
// already used by src/data-importer for CSV import. The direct
// TypeOrmModule.forFeature registration mirrors DataImporterModule: feature
// modules only export their *Service, not their underlying Repository, so
// entities the seeder reads/writes directly need their own registration.
@Module({
  imports: [TypeOrmModule.forFeature([Company, User, Programme]), SharedModule],
  providers: [DemoSeederService],
  exports: [DemoSeederService],
})
export class DemoSeederModule {}
