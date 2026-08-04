import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { CapacityBuildingService } from "@app/shared/capacity-building/capacity.building.service";
import { CapacityBuildingCreateDto } from "@app/shared/dto/capacity.building.create.dto";
import { CapacityBuildingEntity } from "@app/shared/entities/capacity.building.entity";

@ApiTags("CapacityBuilding")
@Controller("capacityBuilding")
export class CapacityBuildingController {
  constructor(
    private readonly capacityBuildingService: CapacityBuildingService
  ) {}

  // Public, unauthenticated - this data is intentionally fully public,
  // mirroring SRN's public "Capacity Building Support Received" table.
  @Get("public/list")
  async publicList() {
    return await this.capacityBuildingService.publicList();
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, CapacityBuildingEntity)
  )
  @Post()
  async create(@Body() dto: CapacityBuildingCreateDto) {
    return await this.capacityBuildingService.create(dto);
  }
}
