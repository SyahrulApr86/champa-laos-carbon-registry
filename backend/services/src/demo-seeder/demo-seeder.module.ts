import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SharedModule } from "@app/shared/shared.module";
import { Company } from "@app/shared/entities/company.entity";
import { User } from "@app/shared/entities/user.entity";
import { Programme } from "@app/shared/entities/programme.entity";
import { CertificateLot } from "@app/shared/entities/certificate.lot.entity";
import { CertificatePortion } from "@app/shared/entities/certificate.portion.entity";
import { CertificateLedgerEvent } from "@app/shared/entities/certificate.ledger.event.entity";
import { CertificateRegistryModule } from "@app/shared/certificate-registry/certificate.registry.module";
import { DemoSeederService } from "./demo-seeder.service";
import { CanonicalCertificateDemoLoader } from "./canonical-certificate-demo.loader";

// Internal-only module for `RUN_MODULE=demo-seeder` (see src/main.ts). Not
// wired into any HTTP controller - deliberately unreachable from the public
// API, matching the same "run as a standalone process context" pattern
// already used by src/data-importer for CSV import. The direct
// TypeOrmModule.forFeature registration mirrors DataImporterModule: feature
// modules only export their *Service, not their underlying Repository, so
// entities the seeder reads/writes directly need their own registration.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      User,
      Programme,
      CertificateLot,
      CertificatePortion,
      CertificateLedgerEvent,
    ]),
    SharedModule,
    CertificateRegistryModule,
  ],
  providers: [DemoSeederService, CanonicalCertificateDemoLoader],
  exports: [DemoSeederService],
})
export class DemoSeederModule {}
