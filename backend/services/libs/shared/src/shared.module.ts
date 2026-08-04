import { Module } from "@nestjs/common";
import { SharedService } from "./shared.service";
import { ProgrammeModule } from "./programme/programme.module";
import { AnnualReportModule } from "./annualreport/annual-report.module";
import { AsyncOperationsModule } from "./async-operations/async-operations.module";
import { AuthModule } from "./auth/auth.module";
import { CadtModule } from "./cadt/cadt.module";
import { CompanyModule } from "./company/company.module";
import { EmailModule } from "./email/email.module";
import { EmailHelperModule } from "./email-helper/email-helper.module";
import { FileHandlerModule } from "./file-handler/filehandler.module";
import { LedgerDbModule } from "./ledger-db/ledger-db.module";
import { LocationModule } from "./location/location.module";
import { ProgrammeLedgerModule } from "./programme-ledger/programme-ledger.module";
import { RegistryClientModule } from "./registry-client/registry-client.module";
import { UserModule } from "./user/user.module";
import { UtilModule } from "./util/util.module";
import { ValidationModule } from "./validation/validation.module";
import { CaslModule } from "./casl/casl.module";
import { ProjectManagementModule } from "./project-management/project-management.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { DocumentManagementModule } from "./document-management/document-management.module";
import { SerialNumberManagementModule } from "./serial-number-management/serial-number-management.module";
import { CreditBlocksManagementModule } from "./credit-blocks-management/credit-blocks-management.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { CreditTransactionsManagementModule } from "./credit-transactions-management/credit-transactions-management.module";
import { AefReportManagementModule } from "./aef-report-management/aef-report-management.module";
import { MethodologyModule } from "./methodology/methodology.module";
import { AdaptationModule } from "./adaptation/adaptation.module";
import { ClimateFinanceModule } from "./climate-finance/climate.finance.module";
import { EmissionTradingModule } from "./emission-trading/emission.trading.module";
import { NdcTargetModule } from "./ndc-target/ndc.target.module";
import { CommunityProgramModule } from "./community-program/community.program.module";

@Module({
  imports: [
    ProgrammeModule,
    AnnualReportModule,
    AsyncOperationsModule,
    AuthModule,
    CadtModule,
    CompanyModule,
    EmailModule,
    EmailHelperModule,
    FileHandlerModule,
    LedgerDbModule,
    LocationModule,
    ProgrammeLedgerModule,
    RegistryClientModule,
    UserModule,
    UtilModule,
    ValidationModule,
    CaslModule,
    ProjectManagementModule,
    AuditLogsModule,
    DocumentManagementModule,
    SerialNumberManagementModule,
    CreditBlocksManagementModule,
    AnalyticsModule,
    CreditTransactionsManagementModule,
    AefReportManagementModule,
    MethodologyModule,
    AdaptationModule,
    ClimateFinanceModule,
    EmissionTradingModule,
    NdcTargetModule,
    CommunityProgramModule,
  ],
  providers: [SharedService],
  exports: [
    SharedService,
    ProgrammeModule,
    AnnualReportModule,
    AsyncOperationsModule,
    AuthModule,
    CadtModule,
    CompanyModule,
    EmailModule,
    EmailHelperModule,
    FileHandlerModule,
    LedgerDbModule,
    LocationModule,
    ProgrammeLedgerModule,
    RegistryClientModule,
    UserModule,
    UtilModule,
    ValidationModule,
    CaslModule,
    ProjectManagementModule,
    AuditLogsModule,
    DocumentManagementModule,
    SerialNumberManagementModule,
    CreditBlocksManagementModule,
    AnalyticsModule,
    CreditTransactionsManagementModule,
    AefReportManagementModule,
    MethodologyModule,
    AdaptationModule,
    ClimateFinanceModule,
    EmissionTradingModule,
    NdcTargetModule,
    CommunityProgramModule,
  ],
})
export class SharedModule {}
