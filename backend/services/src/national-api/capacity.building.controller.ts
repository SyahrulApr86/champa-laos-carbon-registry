import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { CapacityBuildingService } from "@app/shared/capacity-building/capacity.building.service";
import { CapacityBuildingCreateDto } from "@app/shared/dto/capacity.building.create.dto";
import { CapacityBuildingUpdateDto } from "@app/shared/dto/capacity.building.update.dto";
import { ResourceArchiveDto } from "@app/shared/dto/resource.archive.dto";
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
  async publicList(
    @Query("q") q?: string,
    @Query("sector") sector?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.capacityBuildingService.publicList({
      q,
      sector,
      status,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    });
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, CapacityBuildingEntity)
  )
  @Get("management")
  async managementList(
    @Query("q") q?: string,
    @Query("includeArchived") includeArchived?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.capacityBuildingService.managementList({
      q,
      includeArchived: includeArchived === "true",
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 25,
    });
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, CapacityBuildingEntity)
  )
  @Get("management/:id")
  async managementDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.capacityBuildingService.managementDetail(id);
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

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, CapacityBuildingEntity)
  )
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CapacityBuildingUpdateDto
  ) {
    return await this.capacityBuildingService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, CapacityBuildingEntity)
  )
  @Patch(":id/archive")
  async archive(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ResourceArchiveDto
  ) {
    return await this.capacityBuildingService.archive(id, dto.reason);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, CapacityBuildingEntity)
  )
  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return await this.capacityBuildingService.remove(id);
  }
}
