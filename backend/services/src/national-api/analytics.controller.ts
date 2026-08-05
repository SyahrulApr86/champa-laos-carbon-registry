import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "@app/shared/analytics/analytics.service";
import { ProgrammeService } from "@app/shared/programme/programme.service";
import { ProjectDataRequestDTO } from "@app/shared/dto/project-data-request.dto";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";

@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly programmeService: ProgrammeService
  ) {}

  // Public, unauthenticated endpoint for the marketing/homepage dashboard.
  // Intentionally NOT guarded with JwtAuthGuard/PoliciesGuard - only exposes
  // aggregate counts/sums, never per-project or per-proponent detail.
  // Reads canonical certificate lots/current portions where available and
  // programme aggregates for non-certificate metrics. It deliberately never
  // exposes programme-level records through this endpoint.
  @Get("public/summary")
  async getPublicSummary() {
    return this.programmeService.getPublicAnalyticsSummary();
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Get("all")
  async getAllData() {
    return await this.analyticsService.getAllData();
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Get("getPendingActions")
  async getPendingActions(@Request() req) {
    return await this.analyticsService.getPendingActions(req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectsData")
  async getProjectsData(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectsData(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Get("getProjectSummary")
  async getProjectSummary(@Request() req) {
    return await this.analyticsService.getProjectSummary(req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectStatusSummary")
  async getProjectStatusSummary(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectStatusSummary(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectsByStatusDetail")
  async getProjectsByStatusDetail(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectsByStatusDetail(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectCountBySector")
  async getProjectCountBySector(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectCountBySector(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectCountBySectorScope")
  async getProjectCountBySectorScope(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectCountBySectorScope(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getCreditSummary")
  async getCreditSummary(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getCreditSummary(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("creditsSummaryByDate")
  async creditsSummaryByDate(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.creditsSummaryByDate(filters, req.user);
  }
}
