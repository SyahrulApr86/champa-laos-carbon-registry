import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UtilModule } from "../util/util.module";
import { CertificateRegistryModule } from "../certificate-registry/certificate.registry.module";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { CertificateIssuanceRequest } from "../entities/certificate.issuance.request.entity";
import { CertificateLot } from "../entities/certificate.lot.entity";
import { CertificateIssuanceRequestService } from "./certificate.issuance.request.service";

@Module({
  imports: [
    UtilModule,
    CertificateRegistryModule,
    TypeOrmModule.forFeature([
      CreditBlocksEntity,
      CertificateIssuanceRequest,
      CertificateLot,
    ]),
  ],
  providers: [CertificateIssuanceRequestService],
  exports: [CertificateIssuanceRequestService],
})
export class CertificateIssuanceRequestModule {}
