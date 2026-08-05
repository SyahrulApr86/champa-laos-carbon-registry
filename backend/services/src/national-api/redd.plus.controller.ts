import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { ReddPlusService } from "@app/shared/redd-plus/redd.plus.service";
import { ReddPlusCreateDto } from "@app/shared/dto/redd.plus.create.dto";
import { ReddPlusUpdateDto } from "@app/shared/dto/redd.plus.update.dto";
import { ReddPlusEntity } from "@app/shared/entities/redd.plus.entity";
import { ReddPlusStatus } from "@app/shared/enum/redd.plus.status.enum";

@ApiTags("ReddPlus")
@Controller("reddPlus")
export class ReddPlusController {
  constructor(private readonly reddPlusService: ReddPlusService) {}

  // Public, unauthenticated - mirrors SRN Indonesia's REDD++ province grid;
  // intentionally fully public like the other registry tabs.
  @Get("public/byProvince")
  async publicByProvince(@Query("province") province?: string) {
    return await this.reddPlusService.getPublicByProvince(province);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, ReddPlusEntity)
  )
  @Post()
  async create(@Body() dto: ReddPlusCreateDto, @Request() req) {
    return await this.reddPlusService.create(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ReddPlusEntity))
  @Get("management")
  async managementList(@Query("includeArchived") includeArchived?: string, @Query("q") q?: string, @Query("province") province?: string, @Query("status") status?: ReddPlusStatus, @Query("page") page?: string, @Query("size") size?: string) {
    return await this.reddPlusService.listManagement(includeArchived === "true", { q, province, status }, page ? parseInt(page, 10) : 1, size ? parseInt(size, 10) : 50);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ReddPlusEntity))
  @Get("management/:id")
  async managementDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.reddPlusService.getManagementDetail(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ReddPlusEntity))
  @Put(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: ReddPlusUpdateDto, @Request() req) {
    return await this.reddPlusService.update(id, dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ReddPlusEntity))
  @Post(":id/version")
  async version(@Param("id", ParseIntPipe) id: number, @Body() dto: ReddPlusUpdateDto, @Request() req) {
    return await this.reddPlusService.version(id, dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ReddPlusEntity))
  @Patch(":id/archive")
  async archive(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return await this.reddPlusService.archive(id, req.user?.id);
  }
}
