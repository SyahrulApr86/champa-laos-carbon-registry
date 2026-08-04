import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { ProjectCreateDto } from "@app/shared/dto/project.create.dto";
import { QueryDto } from "@app/shared/dto/query.dto";
import { ProjectEntity } from "@app/shared/entities/projects.entity";
import { ProjectManagementService } from "@app/shared/project-management/project-management.service";
import { ProgrammeService } from "@app/shared/programme/programme.service";
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Get,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("ProjectManagement")
@ApiBearerAuth()
@Controller("projectManagement")
export class ProjectManagementController {
  constructor(
    private projectManagementService: ProjectManagementService,
    private programmeService: ProgrammeService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Post("query")
  async getAll(@Body() query: QueryDto, @Request() req) {
    return this.projectManagementService.query(
      query,
      req.abilityCondition,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Post("getProjectById")
  async getProjectById(
    @Body("programmeId") programmeId: string,
    @Request() req
  ) {
    return this.projectManagementService.getProjectById(programmeId, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Get("logs")
  getLogs(@Query("refId") refId: string, @Request() req) {
    return this.projectManagementService.getLogs(refId, req.user);
  }

  // Public, unauthenticated endpoint: intentionally has no @UseGuards/@CheckPolicies.
  // Reads from ProgrammeService (backed by the Programme table, the model the
  // create/authorize flow actually writes to) rather than ProjectEntity, which
  // the replicator never populates in this fork. Only non-sensitive,
  // high-level project information is returned — no approval details,
  // internal identifiers, or personal data.
  @Get("public/search")
  async publicSearch(@Query("q") q: string) {
    return this.programmeService.publicSearch(q);
  }
}
