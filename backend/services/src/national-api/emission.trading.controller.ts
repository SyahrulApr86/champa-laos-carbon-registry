import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { EmissionTradingService } from "@app/shared/emission-trading/emission.trading.service";
import { EmissionCeilingCreateDto } from "@app/shared/dto/emission.ceiling.create.dto";
import { EmissionTradingCreateDto } from "@app/shared/dto/emission.trading.create.dto";
import { EmissionCeilingEntity } from "@app/shared/entities/emission.ceiling.entity";

@ApiTags("EmissionTrading")
@Controller("emissionTrading")
export class EmissionTradingController {
  constructor(
    private readonly emissionTradingService: EmissionTradingService
  ) {}

  // Public, unauthenticated - prototype-grade aggregate summary.
  @Get("public/summary")
  async publicSummary(@Query("year") year?: string) {
    return await this.emissionTradingService.publicSummary(
      year ? parseInt(year, 10) : undefined
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, EmissionCeilingEntity)
  )
  @Post("ceiling")
  async createCeiling(@Body() dto: EmissionCeilingCreateDto) {
    return await this.emissionTradingService.createCeiling(dto);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, EmissionCeilingEntity)
  )
  @Post("trading")
  async createTrading(@Body() dto: EmissionTradingCreateDto) {
    return await this.emissionTradingService.createTrading(dto);
  }
}
