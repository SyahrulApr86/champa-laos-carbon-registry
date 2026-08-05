import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CertificateLedgerEvent } from "../entities/certificate.ledger.event.entity";
import { CertificateLot } from "../entities/certificate.lot.entity";
import { CertificatePortion } from "../entities/certificate.portion.entity";
import { Company } from "../entities/company.entity";
import { ProgrammePublicDocument } from "../entities/programme.public.document.entity";
import { ProgrammePublicProfile } from "../entities/programme.public.profile.entity";
import { ProgrammeWorkflowMilestone } from "../entities/programme.workflow.milestone.entity";
import { Programme } from "../entities/programme.entity";
import { CertificateRegistryService } from "./certificate.registry.service";

@Module({
  imports: [TypeOrmModule.forFeature([
    CertificateLot, CertificatePortion, CertificateLedgerEvent, Programme,
    Company, ProgrammePublicProfile, ProgrammeWorkflowMilestone, ProgrammePublicDocument,
  ])],
  providers: [CertificateRegistryService],
  exports: [CertificateRegistryService],
})
export class CertificateRegistryModule {}
