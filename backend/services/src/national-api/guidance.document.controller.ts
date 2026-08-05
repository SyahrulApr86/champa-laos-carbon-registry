import {
  Body,
  Controller,
  Get,
  Param,
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
import { GuidanceDocumentService } from "@app/shared/guidance-document/guidance.document.service";
import { GuidanceDocumentCreateDto } from "@app/shared/dto/guidance.document.create.dto";
import { GuidanceDocumentUpdateDto } from "@app/shared/dto/guidance.document.update.dto";
import { GuidanceDocumentEntity } from "@app/shared/entities/guidance.document.entity";
import { GuidanceDocumentStatus } from "@app/shared/enum/guidance.document.status.enum";

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
  async publicList(
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc"
  ) {
    try {
      return await this.guidanceDocumentService.getPublicList(
        search,
        category,
        page ? parseInt(page, 10) : 1,
        pageSize ? parseInt(pageSize, 10) : 10,
        sortOrder ?? "desc"
      );
    } catch (err) {
      return [];
    }
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, GuidanceDocumentEntity)
  )
  @Get("admin")
  async adminList(
    @Query("search") search?: string,
    @Query("status") status?: GuidanceDocumentStatus,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return await this.guidanceDocumentService.findAdminList(
      search,
      status,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 25
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, GuidanceDocumentEntity)
  )
  @Get("admin/:id")
  async adminDetail(@Param("id", ParseIntPipe) id: number) {
    return await this.guidanceDocumentService.findAdminOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, GuidanceDocumentEntity)
  )
  @Post()
  async create(
    @Body() dto: GuidanceDocumentCreateDto,
    @Request() request: any
  ) {
    return await this.guidanceDocumentService.create(dto, request.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, GuidanceDocumentEntity)
  )
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: GuidanceDocumentUpdateDto,
    @Request() request: any
  ) {
    return await this.guidanceDocumentService.update(
      id,
      dto,
      request.user?.id
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, GuidanceDocumentEntity)
  )
  @Post(":id/publish")
  async publish(
    @Param("id", ParseIntPipe) id: number,
    @Request() request: any
  ) {
    return await this.guidanceDocumentService.publish(id, request.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(false, Action.Manage, GuidanceDocumentEntity)
  )
  @Post(":id/archive")
  async archive(
    @Param("id", ParseIntPipe) id: number,
    @Request() request: any
  ) {
    return await this.guidanceDocumentService.archive(id, request.user?.id);
  }
}
