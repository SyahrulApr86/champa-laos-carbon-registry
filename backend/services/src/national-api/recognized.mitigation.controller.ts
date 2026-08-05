import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { RecognizedMitigationService } from "@app/shared/recognized-mitigation/recognized.mitigation.service";
import { RecognizedMitigationCreateDto } from "@app/shared/dto/recognized.mitigation.create.dto";
import { RecognizedMitigationUpdateDto } from "@app/shared/dto/recognized.mitigation.update.dto";
import { RecognizedMitigationStatus } from "@app/shared/enum/recognized.mitigation.status.enum";
import { RecognizedMitigationEntity } from "@app/shared/entities/recognized.mitigation.entity";

@ApiTags("RecognizedMitigation")
@Controller("recognizedMitigation")
export class RecognizedMitigationController {
  constructor(
    private readonly recognizedMitigationService: RecognizedMitigationService
  ) {}

  // Public, unauthenticated - this registry is intentionally fully public.
  @Get("public/search")
  async publicSearch(
    @Query("q") q: string,
    @Query("page") page?: string,
    @Query("size") size?: string
  ) {
    return await this.recognizedMitigationService.publicSearch(
      q,
      page ? parseInt(page, 10) : 1,
      size ? parseInt(size, 10) : 10
    );
  }

  @Get("public/summary")
  async publicSummary() {
    return await this.recognizedMitigationService.publicSummary();
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, RecognizedMitigationEntity)
  )
  @Post()
  async create(@Body() dto: RecognizedMitigationCreateDto, @Request() req) {
    return await this.recognizedMitigationService.create(dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, RecognizedMitigationEntity))
  @Get("management")
  async managementList(@Query("includeArchived") includeArchived?: string, @Query("q") q?: string, @Query("status") status?: RecognizedMitigationStatus, @Query("region") region?: string, @Query("page") page?: string, @Query("size") size?: string) {
    return await this.recognizedMitigationService.listManagement(includeArchived === "true", { q, status, region }, page ? parseInt(page, 10) : 1, size ? parseInt(size, 10) : 50);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, RecognizedMitigationEntity))
  @Get("management/:id")
  async managementDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.recognizedMitigationService.getManagementDetail(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, RecognizedMitigationEntity))
  @Put(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: RecognizedMitigationUpdateDto, @Request() req) {
    return await this.recognizedMitigationService.update(id, dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, RecognizedMitigationEntity))
  @Post(":id/version")
  async version(@Param("id", ParseIntPipe) id: number, @Body() dto: RecognizedMitigationUpdateDto, @Request() req) {
    return await this.recognizedMitigationService.version(id, dto, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, RecognizedMitigationEntity))
  @Patch(":id/archive")
  async archive(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return await this.recognizedMitigationService.archive(id, req.user?.id);
  }
}
