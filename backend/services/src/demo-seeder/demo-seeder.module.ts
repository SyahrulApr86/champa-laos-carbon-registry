import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SharedModule } from "@app/shared/shared.module";
import { Company } from "@app/shared/entities/company.entity";
import { User } from "@app/shared/entities/user.entity";
import { Programme } from "@app/shared/entities/programme.entity";
import { CertificateLot } from "@app/shared/entities/certificate.lot.entity";
import { CertificatePortion } from "@app/shared/entities/certificate.portion.entity";
import { CertificateLedgerEvent } from "@app/shared/entities/certificate.ledger.event.entity";
import { AdaptationProjectEntity } from "@app/shared/entities/adaptation.project.entity";
import { CommunityProgramEntity } from "@app/shared/entities/community.program.entity";
import { MethodologyEntity } from "@app/shared/entities/methodology.entity";
import { ExpertEntity } from "@app/shared/entities/expert.entity";
import { GuidanceDocumentEntity } from "@app/shared/entities/guidance.document.entity";
import { EmissionCeilingEntity } from "@app/shared/entities/emission.ceiling.entity";
import { EmissionParticipantEntity } from "@app/shared/entities/emission.participant.entity";
import { EmissionTradingEntity } from "@app/shared/entities/emission.trading.entity";
import { NdcTargetEntity } from "@app/shared/entities/ndc.target.entity";
import { RecognizedMitigationEntity } from "@app/shared/entities/recognized.mitigation.entity";
import { CertificateRegistryModule } from "@app/shared/certificate-registry/certificate.registry.module";
import { DemoSeederService } from "./demo-seeder.service";
import { CanonicalCertificateDemoLoader } from "./canonical-certificate-demo.loader";
import { NonCertificatePublicDemoLoader } from "./non-certificate-public-demo.loader";

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
      AdaptationProjectEntity,
      CommunityProgramEntity,
      MethodologyEntity,
      ExpertEntity,
      GuidanceDocumentEntity,
      EmissionCeilingEntity,
      EmissionParticipantEntity,
      EmissionTradingEntity,
      NdcTargetEntity,
      RecognizedMitigationEntity,
    ]),
    SharedModule,
    CertificateRegistryModule,
  ],
  providers: [DemoSeederService, CanonicalCertificateDemoLoader, NonCertificatePublicDemoLoader],
  exports: [DemoSeederService],
})
export class DemoSeederModule {}
