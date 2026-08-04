import { CoreModule } from "@app/core";
import { SharedModule } from "@app/shared";
import { Logger, Module } from "@nestjs/common";
import { RateLimiterModule } from "nestjs-rate-limiter";
import { AuthController } from "./auth.controller";
import { CompanyController } from "./company.controller";
import { LocationController } from "./location.controller";
import { NationalAPIController } from "./national.api.controller";
import { NationalAPIService } from "./national.api.service";
import { ProgrammeController } from "./programme.controller";
import { SettingsController } from "./settings.controller";
import { UserController } from "./user.controller";
import { ProjectManagementController } from "./project-management.controller";
import { DocumentManagementController } from "./document.controller";
import { AnalyticsController } from "./analytics.controller";
import { CreditTransactionsManagementController } from "./credit.transactions.management.controller";
import { ReportsManagementController } from "./reports.management.controller";
import { MethodologyController } from "./methodology.controller";
import { AdaptationController } from "./adaptation.controller";
import { ClimateFinanceController } from "./climate.finance.controller";
import { EmissionTradingController } from "./emission.trading.controller";
import { NdcTargetController } from "./ndc.target.controller";
import { TechnologyTransferController } from "./technology.transfer.controller";
import { CapacityBuildingController } from "./capacity.building.controller";
import { CommunityProgramController } from "./community.program.controller";
import { ReddPlusController } from "./redd.plus.controller";
import { ExpertController } from "./expert.controller";
import { GuidanceDocumentController } from "./guidance.document.controller";
import { RecognizedMitigationController } from "./recognized.mitigation.controller";

@Module({
  imports: [
    RateLimiterModule.register({
      type: "Memory", // In-memory store for rate limiting
    }),
    SharedModule,
    CoreModule,
  ],
  controllers: [
    NationalAPIController,
    UserController,
    AuthController,
    CompanyController,
    ProgrammeController,
    SettingsController,
    LocationController,
    ProjectManagementController,
    DocumentManagementController,
    AnalyticsController,
    CreditTransactionsManagementController,
    ReportsManagementController,
    MethodologyController,
    AdaptationController,
    ClimateFinanceController,
    EmissionTradingController,
    NdcTargetController,
    TechnologyTransferController,
    CapacityBuildingController,
    CommunityProgramController,
    ReddPlusController,
    ExpertController,
    GuidanceDocumentController,
    RecognizedMitigationController,
  ],
  providers: [NationalAPIService, Logger],
})
export class NationalAPIModule {}
