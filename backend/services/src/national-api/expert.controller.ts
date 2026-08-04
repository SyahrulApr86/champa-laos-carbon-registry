import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { ExpertService } from "@app/shared/expert/expert.service";
import { ExpertCreateDto } from "@app/shared/dto/expert.create.dto";
import { ExpertEntity } from "@app/shared/entities/expert.entity";

@ApiTags("Expert")
@Controller("expert")
export class ExpertController {
  constructor(private readonly expertService: ExpertService) {}

  // Public, unauthenticated search - mirrors SRN Indonesia's Roster of
  // Expert directory listing.
  @Get("public/list")
  async publicList(
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.expertService.publicSearch(
      search,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ExpertEntity))
  @Post()
  async create(@Body() dto: ExpertCreateDto) {
    return await this.expertService.create(dto);
  }
}
