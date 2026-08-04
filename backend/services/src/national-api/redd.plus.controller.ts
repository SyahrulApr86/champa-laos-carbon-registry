import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { ReddPlusService } from "@app/shared/redd-plus/redd.plus.service";
import { ReddPlusCreateDto } from "@app/shared/dto/redd.plus.create.dto";
import { ReddPlusEntity } from "@app/shared/entities/redd.plus.entity";

@ApiTags("ReddPlus")
@Controller("reddPlus")
export class ReddPlusController {
  constructor(private readonly reddPlusService: ReddPlusService) {}

  // Public, unauthenticated - mirrors SRN Indonesia's REDD++ province grid;
  // intentionally fully public like the other registry tabs.
  @Get("public/byProvince")
  async publicByProvince() {
    return await this.reddPlusService.getPublicByProvince();
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, ReddPlusEntity)
  )
  @Post()
  async create(@Body() dto: ReddPlusCreateDto) {
    return await this.reddPlusService.create(dto);
  }
}
