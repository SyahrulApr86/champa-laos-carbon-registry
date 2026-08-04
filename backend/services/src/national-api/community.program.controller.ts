import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
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
  async publicList() {
    return await this.communityProgramService.publicList();
  }

  @Get("public/summary")
  async publicSummary() {
    return await this.communityProgramService.publicSummary();
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
