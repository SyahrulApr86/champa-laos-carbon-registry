import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { NdcTargetService } from "@app/shared/ndc-target/ndc.target.service";
import { NdcTargetCreateDto } from "@app/shared/dto/ndc.target.create.dto";
import { NdcTargetEntity } from "@app/shared/entities/ndc.target.entity";

@ApiTags("NdcTarget")
@Controller("ndcTarget")
export class NdcTargetController {
  constructor(private readonly ndcTargetService: NdcTargetService) {}

  // Public, unauthenticated - feeds the homepage NDC Achievement trend chart.
  @Get("public/list")
  async publicList() {
    return await this.ndcTargetService.publicList();
  }

  @Get("public/summary")
  async publicSummary() {
    return await this.ndcTargetService.publicSummary();
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, NdcTargetEntity)
  )
  @Post()
  async create(@Body() dto: NdcTargetCreateDto) {
    return await this.ndcTargetService.create(dto);
  }
}
