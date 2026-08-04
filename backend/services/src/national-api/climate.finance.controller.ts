import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { ClimateFinanceService } from "@app/shared/climate-finance/climate.finance.service";
import { ClimateFinanceCreateDto } from "@app/shared/dto/climate.finance.create.dto";
import { ClimateFinanceEntity } from "@app/shared/entities/climate.finance.entity";

@ApiTags("ClimateFinance")
@Controller("climateFinance")
export class ClimateFinanceController {
  constructor(private readonly climateFinanceService: ClimateFinanceService) {}

  // Public, unauthenticated - this data is intentionally fully public,
  // mirroring SRN's public "Financial Support Received" table.
  @Get("public/search")
  async publicSearch(
    @Query("q") q: string,
    @Query("page") page?: string,
    @Query("size") size?: string
  ) {
    return await this.climateFinanceService.publicSearch(
      q,
      page ? parseInt(page, 10) : 1,
      size ? parseInt(size, 10) : 10
    );
  }

  @Get("public/summary")
  async publicSummary() {
    return await this.climateFinanceService.publicSummary();
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, ClimateFinanceEntity)
  )
  @Post()
  async create(@Body() dto: ClimateFinanceCreateDto) {
    return await this.climateFinanceService.create(dto);
  }
}
