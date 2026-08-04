import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { EmissionTradingService } from "@app/shared/emission-trading/emission.trading.service";
import { EmissionCeilingCreateDto } from "@app/shared/dto/emission.ceiling.create.dto";
import { EmissionTradingCreateDto } from "@app/shared/dto/emission.trading.create.dto";
import { EmissionParticipantCreateDto } from "@app/shared/dto/emission.participant.create.dto";
import { EmissionCeilingEntity } from "@app/shared/entities/emission.ceiling.entity";
import { EmissionParticipantEntity } from "@app/shared/entities/emission.participant.entity";

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

  // Public, unauthenticated - PTBAE-PU "Series" tab equivalent.
  @Get("public/series")
  async publicSeries(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.emissionTradingService.publicSeries(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined
    );
  }

  // Public, unauthenticated - PTBAE-PU "Carbon Exchange Transactions" tab
  // equivalent.
  @Get("public/transactions")
  async publicTransactions(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.emissionTradingService.publicTransactions(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined
    );
  }

  // Public, unauthenticated - PTBAE-PU "Participants" tab equivalent.
  @Get("public/participants")
  async publicParticipants(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.emissionTradingService.publicParticipants(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined
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

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, EmissionParticipantEntity)
  )
  @Post("participant")
  async createParticipant(@Body() dto: EmissionParticipantCreateDto) {
    return await this.emissionTradingService.createParticipant(dto);
  }
}
