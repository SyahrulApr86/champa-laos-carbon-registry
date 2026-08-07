import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { User } from "../entities/user.entity";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { HelperService } from "../util/helpers.service";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { CertificateIssuanceRequest } from "../entities/certificate.issuance.request.entity";
import { CertificateIssuanceRequestStatus } from "../enum/certificate.issuance.request.status.enum";
import { CertificateIssuanceActionEnum } from "../enum/certificate.issuance.action.enum";
import { RequestCertificateIssuanceDto } from "../dto/certificate.issuance.request.dto";
import { CertificateIssuanceActionDto } from "../dto/certificate.issuance.action.dto";
import { CertificateLot } from "../entities/certificate.lot.entity";
import { CertificateRegistryService } from "../certificate-registry/certificate.registry.service";
import { CertificateLedgerEventType } from "../enum/certificate.ledger.enum";
import { DataResponseMessageDto } from "../dto/data.response.message";

@Injectable()
export class CertificateIssuanceRequestService {
  constructor(
    private readonly helperService: HelperService,
    private readonly certificateRegistryService: CertificateRegistryService,
    @InjectRepository(CreditBlocksEntity)
    private creditBlocksEntityRepository: Repository<CreditBlocksEntity>,
    @InjectRepository(CertificateIssuanceRequest)
    private certificateIssuanceRequestRepository: Repository<CertificateIssuanceRequest>,
    @InjectRepository(CertificateLot)
    private certificateLotRepository: Repository<CertificateLot>
  ) {}

  public async requestCertificateIssuance(
    dto: RequestCertificateIssuanceDto,
    user: User
  ) {
    try {
      if (
        user.companyRole != CompanyRole.PROJECT_DEVELOPER ||
        user.role != Role.Admin
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "certificateIssuance.noRequestPermission",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const companyId = user.companyId;
      const creditBlock = await this.creditBlocksEntityRepository.findOne({
        where: { creditBlockId: dto.blockId },
      });
      if (!creditBlock) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "certificateIssuance.creditBlockNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (creditBlock.ownerCompanyId != companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "certificateIssuance.creditBlockDoesNotOwnBySender",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const requestedAmount = dto.amount ?? creditBlock.creditAmount;
      if (
        creditBlock.creditAmount - creditBlock.reservedCreditAmount <
        requestedAmount
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "certificateIssuance.notEnoughCreditAmount",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const existingPending = await this.certificateIssuanceRequestRepository.findOne({
        where: {
          creditBlockId: dto.blockId,
          status: CertificateIssuanceRequestStatus.PENDING,
        },
      });
      if (existingPending) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "certificateIssuance.requestAlreadyPending",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      const id = `cir-${randomUUID()}`;
      const request = this.certificateIssuanceRequestRepository.create({
        id,
        creditBlockId: creditBlock.creditBlockId,
        serialNumber: creditBlock.serialNumber,
        projectRefId: creditBlock.projectRefId,
        companyId,
        requestedQuantity: Number(requestedAmount).toFixed(6),
        status: CertificateIssuanceRequestStatus.PENDING,
        requestedBy: user.id,
      });
      await this.certificateIssuanceRequestRepository.save(request);

      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "certificateIssuance.requestCreated",
          []
        ),
        {
          id,
          requestedQuantity: requestedAmount,
        }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async getCertificateRequests(user: User) {
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      return this.certificateIssuanceRequestRepository.find({
        where: { companyId: user.companyId },
        order: { requestedAt: "DESC" },
      });
    }
    if (
      [
        CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
        CompanyRole.MINISTRY,
      ].includes(user.companyRole)
    ) {
      return this.certificateIssuanceRequestRepository.find({
        order: { requestedAt: "DESC" },
      });
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString(
        "certificateIssuance.unauthorized",
        []
      ),
      HttpStatus.BAD_REQUEST
    );
  }

  public async actionCertificateIssuanceRequest(
    dto: CertificateIssuanceActionDto,
    user: User
  ) {
    try {
      if (
        ![
          CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
          CompanyRole.MINISTRY,
        ].includes(user.companyRole) ||
        ![Role.Admin, Role.Root].includes(user.role)
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "certificateIssuance.noActionPermission",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const request = await this.certificateIssuanceRequestRepository.findOne(
        { where: { id: dto.requestId } }
      );
      if (!request) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "certificateIssuance.requestNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (request.status != CertificateIssuanceRequestStatus.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "certificateIssuance.requestNotPending",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (dto.action == CertificateIssuanceActionEnum.REJECT) {
        request.status = CertificateIssuanceRequestStatus.REJECTED;
        request.remarks = dto.remarks ?? null;
        request.reviewedBy = user.id;
        request.reviewedAt = new Date().getTime();
        await this.certificateIssuanceRequestRepository.save(request);
        return new DataResponseMessageDto(
          HttpStatus.OK,
          this.helperService.formatReqMessagesString(
            "certificateIssuance.requestRejected",
            []
          ),
          { id: request.id }
        );
      }

      const creditBlock = await this.creditBlocksEntityRepository.findOne({
        where: { creditBlockId: request.creditBlockId },
      });
      if (!creditBlock) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "certificateIssuance.creditBlockNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      const suffix = randomUUID().slice(0, 8);
      const certificateLotId = `cl-cert-${request.creditBlockId}-${suffix}`;
      const certificateId = `CERT-${request.projectRefId}-${request.creditBlockId}-${suffix}`;
      const now = new Date();
      const vintageYear = creditBlock.vintage;
      const hasYear = /^\d{4}$/.test(vintageYear);
      const actorReference = user.email ?? String(user.id);

      const lot = this.certificateLotRepository.create({
        certificateLotId,
        programmeId: request.projectRefId,
        certificateId,
        registryScheme: "Champa Certificate Registry",
        registryNumber: null,
        serialNumber: request.serialNumber,
        vintageStart: hasYear ? `${vintageYear}-01-01` : null,
        vintageEnd: hasYear ? `${vintageYear}-12-31` : null,
        issuedQuantity: Number(request.requestedQuantity).toFixed(6),
        unit: "tCO2e",
        issuedAt: null,
        provenance: {
          source_type: "project_credit_issuance",
          source_label: "Project Developer certificate issuance request",
          projectRefId: request.projectRefId,
          creditBlockId: request.creditBlockId,
          certificateIssuanceRequestId: request.id,
        },
        publicFields: {},
        asOf: now,
        createdBy: actorReference,
        updatedBy: actorReference,
        archivedAt: null,
        archivedBy: null,
        archiveReason: null,
      });
      await this.certificateLotRepository.save(lot);

      await this.certificateRegistryService.recordEvent({
        idempotencyKey: `cert-issue-${request.id}`,
        certificateLotId,
        eventType: CertificateLedgerEventType.ISSUED,
        quantity: Number(request.requestedQuantity),
        toOwnerCompanyId: String(request.companyId),
        actorReference,
        reason: "Certificate issuance approved by DNA",
      });

      request.status = CertificateIssuanceRequestStatus.APPROVED;
      request.certificateLotId = certificateLotId;
      request.certificateId = certificateId;
      request.reviewedBy = user.id;
      request.reviewedAt = new Date().getTime();
      await this.certificateIssuanceRequestRepository.save(request);

      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "certificateIssuance.requestApproved",
          []
        ),
        { id: request.id, certificateId }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
