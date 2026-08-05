import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Request, UseGuards } from "@nestjs/common";
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
import { EmissionTradingEntity } from "@app/shared/entities/emission.trading.entity";
import { EmissionCeilingUpdateDto } from "@app/shared/dto/emission.ceiling.update.dto";
import { EmissionTradingUpdateDto } from "@app/shared/dto/emission.trading.update.dto";
import { EmissionParticipantUpdateDto } from "@app/shared/dto/emission.participant.update.dto";
import { EmissionLifecycleActionDto } from "@app/shared/dto/emission.lifecycle.action.dto";

@ApiTags("EmissionTrading")
@Controller("emissionTrading")
export class EmissionTradingController {
  constructor(
    private readonly emissionTradingService: EmissionTradingService
  ) {}

  // Public, unauthenticated - prototype-grade aggregate summary.
  @Get("public/summary")
  async publicSummary(
    @Query("year") year?: string,
    @Query("series") series?: string,
    @Query("venueStatus") venueStatus?: string
  ) {
    return this.emissionTradingService.publicSummary({
      year: year ? parseInt(year, 10) : undefined,
      series,
      venueStatus: venueStatus as any,
    });
  }

  // Public, unauthenticated ceiling-series listing.
  @Get("public/series")
  async publicSeries(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("year") year?: string,
    @Query("series") series?: string,
    @Query("venueStatus") venueStatus?: string
  ) {
    return this.emissionTradingService.publicSeries(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
      { year: year ? parseInt(year, 10) : undefined, series, venueStatus: venueStatus as any }
    );
  }

  // Public, unauthenticated configurable market-transaction listing.
  @Get("public/transactions")
  async publicTransactions(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("year") year?: string,
    @Query("series") series?: string,
    @Query("venueStatus") venueStatus?: string,
    @Query("search") search?: string
  ) {
    return this.emissionTradingService.publicTransactions(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
      { year: year ? parseInt(year, 10) : undefined, series, venueStatus: venueStatus as any, search }
    );
  }

  // Public, unauthenticated ceiling-participant listing.
  @Get("public/participants")
  async publicParticipants(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("year") year?: string,
    @Query("series") series?: string,
    @Query("search") search?: string
  ) {
    return this.emissionTradingService.publicParticipants(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
      { year: year ? parseInt(year, 10) : undefined, series, search }
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, EmissionCeilingEntity)
  )
  @Post("ceiling")
  async createCeiling(@Body() dto: EmissionCeilingCreateDto, @Request() req) {
    return await this.emissionTradingService.createCeiling(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, EmissionTradingEntity)
  )
  @Post("trading")
  async createTrading(@Body() dto: EmissionTradingCreateDto, @Request() req) {
    return await this.emissionTradingService.createTrading(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, EmissionParticipantEntity)
  )
  @Post("participant")
  async createParticipant(@Body() dto: EmissionParticipantCreateDto, @Request() req) {
    return await this.emissionTradingService.createParticipant(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionCeilingEntity))
  @Get("management/ceilings")
  listCeilings(@Query("page") page?: string, @Query("pageSize") pageSize?: string, @Query("year") year?: string, @Query("series") series?: string, @Query("venueStatus") venueStatus?: string, @Query("status") status?: string, @Query("search") search?: string) {
    return this.emissionTradingService.listCeilings(page ? parseInt(page, 10) : undefined, pageSize ? parseInt(pageSize, 10) : undefined, { year: year ? parseInt(year, 10) : undefined, series, venueStatus: venueStatus as any, status, search });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionCeilingEntity))
  @Get("management/ceilings/:id")
  getCeiling(@Param("id", ParseIntPipe) id: number) { return this.emissionTradingService.getCeiling(id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionCeilingEntity))
  @Get("management/ceilings/:id/history")
  getCeilingHistory(@Param("id", ParseIntPipe) id: number) { return this.emissionTradingService.getCeilingHistory(id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionCeilingEntity))
  @Put("management/ceilings/:id")
  updateCeiling(@Param("id", ParseIntPipe) id: number, @Body() dto: EmissionCeilingUpdateDto, @Request() req) { return this.emissionTradingService.updateCeiling(id, dto, req.user?.id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionCeilingEntity))
  @Post("management/ceilings/:id/archive")
  archiveCeiling(@Param("id", ParseIntPipe) id: number, @Body() dto: EmissionLifecycleActionDto, @Request() req) { if (!dto.reason?.trim()) throw new BadRequestException("Archive reason is required."); return this.emissionTradingService.archiveCeiling(id, dto.reason, req.user?.id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionParticipantEntity))
  @Get("management/participants")
  listParticipants(@Query("page") page?: string, @Query("pageSize") pageSize?: string, @Query("year") year?: string, @Query("series") series?: string, @Query("status") status?: string, @Query("search") search?: string) { return this.emissionTradingService.listParticipants(page ? parseInt(page, 10) : undefined, pageSize ? parseInt(pageSize, 10) : undefined, { year: year ? parseInt(year, 10) : undefined, series, status, search }); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionParticipantEntity))
  @Get("management/participants/:id")
  getParticipant(@Param("id", ParseIntPipe) id: number) { return this.emissionTradingService.getParticipant(id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionParticipantEntity))
  @Get("management/participants/:id/history")
  getParticipantHistory(@Param("id", ParseIntPipe) id: number) { return this.emissionTradingService.getParticipantHistory(id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionParticipantEntity))
  @Put("management/participants/:id")
  updateParticipant(@Param("id", ParseIntPipe) id: number, @Body() dto: EmissionParticipantUpdateDto, @Request() req) { return this.emissionTradingService.updateParticipant(id, dto, req.user?.id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionParticipantEntity))
  @Post("management/participants/:id/archive")
  archiveParticipant(@Param("id", ParseIntPipe) id: number, @Body() dto: EmissionLifecycleActionDto, @Request() req) { if (!dto.reason?.trim()) throw new BadRequestException("Archive reason is required."); return this.emissionTradingService.archiveParticipant(id, dto.reason, req.user?.id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionTradingEntity))
  @Get("management/trades")
  listTrades(@Query("page") page?: string, @Query("pageSize") pageSize?: string, @Query("year") year?: string, @Query("series") series?: string, @Query("venueStatus") venueStatus?: string, @Query("status") status?: string, @Query("search") search?: string) { return this.emissionTradingService.listTrades(page ? parseInt(page, 10) : undefined, pageSize ? parseInt(pageSize, 10) : undefined, { year: year ? parseInt(year, 10) : undefined, series, venueStatus: venueStatus as any, status, search }); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionTradingEntity))
  @Get("management/trades/:id")
  getTrade(@Param("id", ParseIntPipe) id: number) { return this.emissionTradingService.getTrade(id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionTradingEntity))
  @Get("management/trades/:id/history")
  getTradeHistory(@Param("id", ParseIntPipe) id: number) { return this.emissionTradingService.getTradeHistory(id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionTradingEntity))
  @Put("management/trades/:id")
  updateTrade(@Param("id", ParseIntPipe) id: number, @Body() dto: EmissionTradingUpdateDto, @Request() req) { return this.emissionTradingService.updateTrade(id, dto, req.user?.id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionTradingEntity))
  @Post("management/trades/:id/void")
  voidTrade(@Param("id", ParseIntPipe) id: number, @Body() dto: EmissionLifecycleActionDto, @Request() req) { if (!dto.reason?.trim()) throw new BadRequestException("Void reason is required."); return this.emissionTradingService.voidTrade(id, dto.reason, req.user?.id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, EmissionTradingEntity))
  @Post("management/trades/:id/reverse")
  reverseTrade(@Param("id", ParseIntPipe) id: number, @Body() dto: EmissionLifecycleActionDto, @Request() req) { if (!dto.reason?.trim()) throw new BadRequestException("Reversal reason is required."); return this.emissionTradingService.reverseTrade(id, dto.reason, req.user?.id); }
}
