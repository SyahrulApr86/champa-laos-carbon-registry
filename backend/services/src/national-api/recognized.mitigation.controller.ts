import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { RecognizedMitigationService } from "@app/shared/recognized-mitigation/recognized.mitigation.service";
import { RecognizedMitigationCreateDto } from "@app/shared/dto/recognized.mitigation.create.dto";
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
  async create(@Body() dto: RecognizedMitigationCreateDto) {
    return await this.recognizedMitigationService.create(dto);
  }
}
