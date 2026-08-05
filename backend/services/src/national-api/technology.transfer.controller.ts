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
import { TechnologyTransferService } from "@app/shared/technology-transfer/technology.transfer.service";
import { TechnologyTransferCreateDto } from "@app/shared/dto/technology.transfer.create.dto";
import { TechnologyTransferUpdateDto } from "@app/shared/dto/technology.transfer.update.dto";
import { ResourceArchiveDto } from "@app/shared/dto/resource.archive.dto";
import { TechnologyTransferEntity } from "@app/shared/entities/technology.transfer.entity";

@ApiTags("TechnologyTransfer")
@Controller("technologyTransfer")
export class TechnologyTransferController {
  constructor(
    private readonly technologyTransferService: TechnologyTransferService
  ) {}

  // Public, unauthenticated - this data is intentionally fully public,
  // mirroring SRN's public "Technology Development & Transfer Support
  // Received" table.
  @Get("public/list")
  async publicList(
    @Query("q") q?: string,
    @Query("sector") sector?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.technologyTransferService.publicList({
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
    PoliciesGuardEx(false, Action.Manage, TechnologyTransferEntity)
  )
  @Get("management")
  async managementList(
    @Query("q") q?: string,
    @Query("includeArchived") includeArchived?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.technologyTransferService.managementList({
      q,
      includeArchived: includeArchived === "true",
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 25,
    });
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, TechnologyTransferEntity)
  )
  @Get("management/:id")
  async managementDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.technologyTransferService.managementDetail(id);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, TechnologyTransferEntity)
  )
  @Post()
  async create(@Body() dto: TechnologyTransferCreateDto) {
    return await this.technologyTransferService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, TechnologyTransferEntity)
  )
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: TechnologyTransferUpdateDto
  ) {
    return await this.technologyTransferService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, TechnologyTransferEntity)
  )
  @Patch(":id/archive")
  async archive(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ResourceArchiveDto
  ) {
    return await this.technologyTransferService.archive(id, dto.reason);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, TechnologyTransferEntity)
  )
  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return await this.technologyTransferService.remove(id);
  }
}
