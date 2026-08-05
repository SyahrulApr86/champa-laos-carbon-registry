import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { MethodologyService } from "@app/shared/methodology/methodology.service";
import { MethodologyCreateDto } from "@app/shared/dto/methodology.create.dto";
import { MethodologyUpdateDto } from "@app/shared/dto/methodology.update.dto";
import { MethodologyLifecycleDto } from "@app/shared/dto/methodology.lifecycle.dto";
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
    @Query("size") size?: string,
    @Query("sortBy") sortBy?: "methodologyNumber" | "name" | "source",
    @Query("sortOrder") sortOrder?: "asc" | "desc"
  ) {
    return await this.methodologyService.findPublic(
      keyword,
      category,
      status,
      page ? parseInt(page, 10) : 1,
      size ? parseInt(size, 10) : 10,
      sortBy ?? "methodologyNumber",
      sortOrder ?? "asc"
    );
  }

  @Get("public/:id")
  async getPublicMethodology(@Param("id", ParseIntPipe) id: number) {
    return await this.methodologyService.findPublicOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Read, MethodologyEntity)
  )
  @Get()
  async list(
    @Query("keyword") keyword?: string,
    @Query("category") category?: Sector,
    @Query("status") status?: MethodologyStatus,
    @Query("page") page?: string,
    @Query("size") size?: string,
    @Query("sortBy") sortBy?: "methodologyNumber" | "name" | "source",
    @Query("sortOrder") sortOrder?: "asc" | "desc"
  ) {
    return await this.methodologyService.findAdmin(
      keyword,
      category,
      status,
      page ? parseInt(page, 10) : 1,
      size ? parseInt(size, 10) : 10,
      sortBy ?? "methodologyNumber",
      sortOrder ?? "asc"
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Read, MethodologyEntity)
  )
  @Get(":id")
  async detail(@Param("id", ParseIntPipe) id: number) {
    return await this.methodologyService.findAdminOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Create, MethodologyEntity)
  )
  @Post()
  async create(@Body() dto: MethodologyCreateDto, @Request() req: any) {
    return await this.methodologyService.create(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Update, MethodologyEntity)
  )
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: MethodologyUpdateDto,
    @Request() req: any
  ) {
    return await this.methodologyService.update(id, dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Update, MethodologyEntity)
  )
  @Patch(":id/lifecycle")
  async lifecycle(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: MethodologyLifecycleDto,
    @Request() req: any
  ) {
    return await this.methodologyService.transition(id, dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Delete, MethodologyEntity)
  )
  @Delete(":id")
  async archive(@Param("id", ParseIntPipe) id: number, @Request() req: any) {
    return await this.methodologyService.archive(id, req.user);
  }
}
