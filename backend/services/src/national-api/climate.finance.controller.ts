import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { ClimateFinanceService } from "@app/shared/climate-finance/climate.finance.service";
import { ClimateFinanceCreateDto } from "@app/shared/dto/climate.finance.create.dto";
import { ClimateFinanceUpdateDto } from "@app/shared/dto/climate.finance.update.dto";
import { ResourceArchiveDto } from "@app/shared/dto/resource.archive.dto";
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
    @Query("size") size?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sector") sector?: string,
    @Query("channel") channel?: string,
    @Query("status") status?: string
  ) {
    return await this.climateFinanceService.publicSearch(
      q,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : size ? parseInt(size, 10) : 10,
      { sector, channel, status }
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
  @Get("management")
  async managementList(
    @Query("q") q?: string,
    @Query("includeArchived") includeArchived?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.climateFinanceService.managementList({
      q,
      includeArchived: includeArchived === "true",
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 25,
    });
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, ClimateFinanceEntity)
  )
  @Get("management/:id")
  async managementDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.climateFinanceService.managementDetail(id);
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

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, ClimateFinanceEntity)
  )
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ClimateFinanceUpdateDto
  ) {
    return await this.climateFinanceService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, ClimateFinanceEntity)
  )
  @Patch(":id/archive")
  async archive(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ResourceArchiveDto
  ) {
    return await this.climateFinanceService.archive(id, dto.reason);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, ClimateFinanceEntity)
  )
  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return await this.climateFinanceService.remove(id);
  }
}
