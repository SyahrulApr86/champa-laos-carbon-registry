import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { CommunityProgramService } from "@app/shared/community-program/community.program.service";
import { CommunityProgramCreateDto } from "@app/shared/dto/community.program.create.dto";
import { CommunityProgramEntity } from "@app/shared/entities/community.program.entity";

@ApiTags("CommunityProgram")
@Controller("communityProgram")
export class CommunityProgramController {
  constructor(
    private readonly communityProgramService: CommunityProgramService
  ) {}

  // Public, unauthenticated - this registry is intentionally fully public.
  @Get("public/list")
  async publicList(
    @Query("q") q?: string,
    @Query("category") category?: string,
    @Query("region") region?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("size") size?: string
  ) {
    return await this.communityProgramService.publicList({
      q,
      category,
      region,
      status,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : size ? parseInt(size, 10) : 10,
    });
  }

  @Get("public/summary")
  async publicSummary() {
    return await this.communityProgramService.publicSummary();
  }

  // Public, unauthenticated single-program detail lookup - see
  // CommunityProgramService.publicDetail for the field allowlist. Never
  // throws on a missing/unknown id: returns { found: false }.
  @Get("public/detail/:id")
  async publicDetail(@Param("id") id: string) {
    try {
      return await this.communityProgramService.publicDetail(id);
    } catch (error) {
      return { data: null, meta: { availability: "not_available" } };
    }
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, CommunityProgramEntity)
  )
  @Post()
  async create(@Body() dto: CommunityProgramCreateDto) {
    return await this.communityProgramService.create(dto);
  }
}
