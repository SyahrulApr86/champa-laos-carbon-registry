import { Module } from "@nestjs/common";
import { SharedModule } from "@app/shared/shared.module";
import { DemoSeederService } from "./demo-seeder.service";

// Internal-only module for `RUN_MODULE=demo-seeder` (see src/main.ts). Not
// wired into any HTTP controller - deliberately unreachable from the public
// API, matching the same "run as a standalone process context" pattern
// already used by src/data-importer for CSV import.
@Module({
  imports: [SharedModule],
  providers: [DemoSeederService],
  exports: [DemoSeederService],
})
export class DemoSeederModule {}
