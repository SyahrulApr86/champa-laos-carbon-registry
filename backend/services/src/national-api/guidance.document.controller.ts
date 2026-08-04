import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { GuidanceDocumentService } from "@app/shared/guidance-document/guidance.document.service";
import { GuidanceDocumentCreateDto } from "@app/shared/dto/guidance.document.create.dto";
import { GuidanceDocumentEntity } from "@app/shared/entities/guidance.document.entity";

@ApiTags("GuidanceDocument")
@Controller("guidanceDocument")
export class GuidanceDocumentController {
  constructor(
    private readonly guidanceDocumentService: GuidanceDocumentService
  ) {}

  // Public, unauthenticated - mirrors SRN Indonesia's Instruments > Module
  // directory; intentionally fully public like the other registry tabs.
  // Wrapped in try/catch with a safe empty fallback.
  @Get("public/list")
  async publicList() {
    try {
      return await this.guidanceDocumentService.getPublicList();
    } catch (err) {
      return [];
    }
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, GuidanceDocumentEntity)
  )
  @Post()
  async create(@Body() dto: GuidanceDocumentCreateDto) {
    return await this.guidanceDocumentService.create(dto);
  }
}
