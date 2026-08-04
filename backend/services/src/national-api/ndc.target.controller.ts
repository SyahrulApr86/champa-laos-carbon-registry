import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { NdcTargetService } from "@app/shared/ndc-target/ndc.target.service";
import { NdcTargetCreateDto } from "@app/shared/dto/ndc.target.create.dto";
import { NdcTargetEntity } from "@app/shared/entities/ndc.target.entity";

@ApiTags("NdcTarget")
@Controller("ndcTarget")
export class NdcTargetController {
  constructor(private readonly ndcTargetService: NdcTargetService) {}

  // Public, unauthenticated - raw export of every recorded sector/year row.
  @Get("public/list")
  async publicList() {
    return await this.ndcTargetService.publicList();
  }

  // Public, unauthenticated - per-sector latest-year figures, or the 'All'
  // aggregate (summed across every sector's own latest year) when `sector`
  // is omitted or 'All'. Feeds the homepage NDC Achievement tab's 6 tabs.
  @Get("public/summary")
  async publicSummary(@Query("sector") sector?: string) {
    return await this.ndcTargetService.publicSummary(sector);
  }

  // Public, unauthenticated - yearly baseline/achieved time series for the
  // requested sector (or the 'All' aggregate), feeding the trend charts.
  @Get("public/series")
  async publicSeries(@Query("sector") sector?: string) {
    return await this.ndcTargetService.publicSeries(sector);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, NdcTargetEntity)
  )
  @Post()
  async create(@Body() dto: NdcTargetCreateDto) {
    return await this.ndcTargetService.create(dto);
  }
}
