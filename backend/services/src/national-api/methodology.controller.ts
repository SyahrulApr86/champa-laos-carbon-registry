import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { MethodologyService } from "@app/shared/methodology/methodology.service";
import { MethodologyCreateDto } from "@app/shared/dto/methodology.create.dto";
import { MethodologyUpdateDto } from "@app/shared/dto/methodology.update.dto";
import { MethodologyEntity } from "@app/shared/entities/methodology.entity";
import { Sector } from "@app/shared/enum/sector.enum";
import { MethodologyStatus } from "@app/shared/enum/methodology.status.enum";

@ApiTags("Methodology")
@Controller("methodology")
export class MethodologyController {
  constructor(private readonly methodologyService: MethodologyService) {}

  // Public, unauthenticated directory listing - proponents/VVBs browse the
  // approved methodology list without needing to log in. Only search/filter
  // is exposed here; create/update stay behind the admin (MAE/DNA) guard below.
  @Get("public")
  async getPublicMethodologies(
    @Query("keyword") keyword?: string,
    @Query("category") category?: Sector,
    @Query("status") status?: MethodologyStatus,
    @Query("page") page?: string,
    @Query("size") size?: string
  ) {
    return await this.methodologyService.findPublic(
      keyword,
      category,
      status,
      page ? parseInt(page, 10) : 1,
      size ? parseInt(size, 10) : 10
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, MethodologyEntity)
  )
  @Post()
  async create(@Body() dto: MethodologyCreateDto) {
    return await this.methodologyService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, MethodologyEntity)
  )
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: MethodologyUpdateDto
  ) {
    return await this.methodologyService.update(id, dto);
  }
}
