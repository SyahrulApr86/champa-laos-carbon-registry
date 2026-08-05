import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { ExpertService } from "@app/shared/expert/expert.service";
import { ExpertCreateDto } from "@app/shared/dto/expert.create.dto";
import { ExpertStatusUpdateDto } from "@app/shared/dto/expert.status.update.dto";
import { ExpertUpdateDto } from "@app/shared/dto/expert.update.dto";
import { ExpertEntity } from "@app/shared/entities/expert.entity";
import { ExpertStatus } from "@app/shared/enum/expert.status.enum";

@ApiTags("Expert")
@Controller("expert")
export class ExpertController {
  constructor(private readonly expertService: ExpertService) {}

  // Public, unauthenticated search - mirrors SRN Indonesia's Roster of
  // Expert directory listing.
  @Get("public/list")
  async publicList(
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("certification") certification?: string,
    @Query("province") province?: string,
    @Query("sortBy") sortBy?: "name" | "yearsOfExperience",
    @Query("sortOrder") sortOrder?: "asc" | "desc"
  ) {
    return await this.expertService.publicSearch(
      search,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      certification,
      province,
      sortBy ?? "name",
      sortOrder ?? "asc"
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ExpertEntity))
  @Get("admin")
  async adminList(
    @Query("search") search?: string,
    @Query("status") status?: ExpertStatus,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.expertService.findAdminList(
      search,
      status,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 25
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ExpertEntity))
  @Get("admin/:id")
  async adminDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.expertService.findAdminOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ExpertEntity))
  @Post()
  async create(@Body() dto: ExpertCreateDto, @Request() request: any) {
    return await this.expertService.create(dto, request.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ExpertEntity))
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ExpertUpdateDto,
    @Request() request: any
  ) {
    return await this.expertService.update(id, dto, request.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ExpertEntity))
  @Patch(":id/status")
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ExpertStatusUpdateDto,
    @Request() request: any
  ) {
    return await this.expertService.updateStatus(id, dto, request.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(false, Action.Manage, ExpertEntity))
  @Post(":id/archive")
  async archive(
    @Param("id", ParseIntPipe) id: number,
    @Request() request: any
  ) {
    return await this.expertService.archive(id, request.user?.id);
  }
}
