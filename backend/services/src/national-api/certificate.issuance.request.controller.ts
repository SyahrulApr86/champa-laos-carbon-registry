import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { CertificateIssuanceRequestService } from "@app/shared/certificate-issuance-request/certificate.issuance.request.service";
import { CertificateIssuanceActionDto } from "@app/shared/dto/certificate.issuance.action.dto";
import { RequestCertificateIssuanceDto } from "@app/shared/dto/certificate.issuance.request.dto";
import { ProjectEntity } from "@app/shared/entities/projects.entity";
import { Body, Controller, Get, Request, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("certificateIssuanceRequest")
export class CertificateIssuanceRequestController {
  constructor(
    private readonly certificateIssuanceRequestService: CertificateIssuanceRequestService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, ProjectEntity)
  )
  @Post("request")
  async requestCertificateIssuance(
    @Body() requestCertificateIssuanceDto: RequestCertificateIssuanceDto,
    @Request() req
  ) {
    return await this.certificateIssuanceRequestService.requestCertificateIssuance(
      requestCertificateIssuanceDto,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, ProjectEntity)
  )
  @Post("action")
  async actionCertificateIssuanceRequest(
    @Body() certificateIssuanceActionDto: CertificateIssuanceActionDto,
    @Request() req
  ) {
    return await this.certificateIssuanceRequestService.actionCertificateIssuanceRequest(
      certificateIssuanceActionDto,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Get("list")
  async getCertificateRequests(@Request() req) {
    return await this.certificateIssuanceRequestService.getCertificateRequests(
      req.user
    );
  }
}
