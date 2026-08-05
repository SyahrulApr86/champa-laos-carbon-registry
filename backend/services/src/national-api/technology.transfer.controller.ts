import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { TechnologyTransferService } from "@app/shared/technology-transfer/technology.transfer.service";
import { TechnologyTransferCreateDto } from "@app/shared/dto/technology.transfer.create.dto";
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
      q, sector, status,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    });
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
}
