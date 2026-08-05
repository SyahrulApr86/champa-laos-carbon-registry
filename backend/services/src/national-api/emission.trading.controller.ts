import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { EmissionTradingService } from "@app/shared/emission-trading/emission.trading.service";
import { EmissionCeilingCreateDto } from "@app/shared/dto/emission.ceiling.create.dto";
import { EmissionCeilingUpdateDto } from "@app/shared/dto/emission.ceiling.update.dto";
import { EmissionLifecycleActionDto } from "@app/shared/dto/emission.lifecycle.action.dto";
import { EmissionParticipantCreateDto } from "@app/shared/dto/emission.participant.create.dto";
import { EmissionParticipantUpdateDto } from "@app/shared/dto/emission.participant.update.dto";
import { EmissionTradingCreateDto } from "@app/shared/dto/emission.trading.create.dto";
import { EmissionTradingUpdateDto } from "@app/shared/dto/emission.trading.update.dto";
import { EmissionCeilingEntity } from "@app/shared/entities/emission.ceiling.entity";
import { EmissionParticipantEntity } from "@app/shared/entities/emission.participant.entity";
import { EmissionTradingEntity } from "@app/shared/entities/emission.trading.entity";

@ApiTags("EmissionTrading")
@Controller("emissionTrading")
export class EmissionTradingController {
  constructor(private readonly emissionTradingService: EmissionTradingService) {}

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
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Create, EmissionCeilingEntity))
  @Post("ceiling")
  async createCeiling(@Body() dto: EmissionCeilingCreateDto, @Request() req: any) {
    return this.emissionTradingService.createCeiling(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Create, EmissionTradingEntity))
  @Post("trading")
  async createTrading(@Body() dto: EmissionTradingCreateDto, @Request() req: any) {
    return this.emissionTradingService.createTrading(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Create, EmissionParticipantEntity))
  @Post("participant")
  async createParticipant(@Body() dto: EmissionParticipantCreateDto, @Request() req: any) {
    return this.emissionTradingService.createParticipant(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Read, EmissionCeilingEntity))
  @Get("management/ceilings")
  async listCeilings(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("year") year?: string,
    @Query("series") series?: string,
    @Query("venueStatus") venueStatus?: string,
    @Query("status") status?: string,
    @Query("search") search?: string
  ) {
    return this.emissionTradingService.listCeilings(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
      { year: year ? parseInt(year, 10) : undefined, series, venueStatus: venueStatus as any, status, search }
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Read, EmissionCeilingEntity))
  @Get("management/ceilings/:id")
  async getCeiling(@Param("id", ParseIntPipe) id: number) {
    return this.emissionTradingService.getCeiling(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Read, EmissionCeilingEntity))
  @Get("management/ceilings/:id/history")
  async getCeilingHistory(@Param("id", ParseIntPipe) id: number) {
    return this.emissionTradingService.getCeilingHistory(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Update, EmissionCeilingEntity))
  @Put("management/ceilings/:id")
  async updateCeiling(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: EmissionCeilingUpdateDto,
    @Request() req: any
  ) {
    return this.emissionTradingService.updateCeiling(id, dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Update, EmissionCeilingEntity))
  @Post("management/ceilings/:id/archive")
  async archiveCeiling(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: EmissionLifecycleActionDto,
    @Request() req: any
  ) {
    this.assertAction(dto, "archive");
    return this.emissionTradingService.archiveCeiling(id, dto.reason, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Read, EmissionParticipantEntity))
  @Get("management/participants")
  async listParticipants(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("year") year?: string,
    @Query("series") series?: string,
    @Query("status") status?: string,
    @Query("search") search?: string
  ) {
    return this.emissionTradingService.listParticipants(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
      { year: year ? parseInt(year, 10) : undefined, series, status, search }
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Read, EmissionParticipantEntity))
  @Get("management/participants/:id")
  async getParticipant(@Param("id", ParseIntPipe) id: number) {
    return this.emissionTradingService.getParticipant(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Read, EmissionParticipantEntity))
  @Get("management/participants/:id/history")
  async getParticipantHistory(@Param("id", ParseIntPipe) id: number) {
    return this.emissionTradingService.getParticipantHistory(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Update, EmissionParticipantEntity))
  @Put("management/participants/:id")
  async updateParticipant(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: EmissionParticipantUpdateDto,
    @Request() req: any
  ) {
    return this.emissionTradingService.updateParticipant(id, dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Update, EmissionParticipantEntity))
  @Post("management/participants/:id/archive")
  async archiveParticipant(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: EmissionLifecycleActionDto,
    @Request() req: any
  ) {
    this.assertAction(dto, "archive");
    return this.emissionTradingService.archiveParticipant(id, dto.reason, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Read, EmissionTradingEntity))
  @Get("management/trades")
  async listTrades(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("year") year?: string,
    @Query("series") series?: string,
    @Query("venueStatus") venueStatus?: string,
    @Query("status") status?: string,
    @Query("search") search?: string
  ) {
    return this.emissionTradingService.listTrades(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
      { year: year ? parseInt(year, 10) : undefined, series, venueStatus: venueStatus as any, status, search }
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Read, EmissionTradingEntity))
  @Get("management/trades/:id")
  async getTrade(@Param("id", ParseIntPipe) id: number) {
    return this.emissionTradingService.getTrade(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Read, EmissionTradingEntity))
  @Get("management/trades/:id/history")
  async getTradeHistory(@Param("id", ParseIntPipe) id: number) {
    return this.emissionTradingService.getTradeHistory(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Update, EmissionTradingEntity))
  @Put("management/trades/:id")
  async updateTrade(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: EmissionTradingUpdateDto,
    @Request() req: any
  ) {
    return this.emissionTradingService.updateTrade(id, dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Update, EmissionTradingEntity))
  @Post("management/trades/:id/void")
  async voidTrade(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: EmissionLifecycleActionDto,
    @Request() req: any
  ) {
    this.assertAction(dto, "void");
    return this.emissionTradingService.voidTrade(id, dto.reason, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Update, EmissionTradingEntity))
  @Post("management/trades/:id/reverse")
  async reverseTrade(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: EmissionLifecycleActionDto,
    @Request() req: any
  ) {
    this.assertAction(dto, "reverse");
    return this.emissionTradingService.reverseTrade(id, dto.reason, req.user?.id);
  }

  private assertAction(dto: EmissionLifecycleActionDto, expected: string) {
    if (dto.action !== expected) {
      throw new BadRequestException(`Lifecycle action must be ${expected}.`);
    }
  }
}
