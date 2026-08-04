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
import { AdaptationService } from "@app/shared/adaptation/adaptation.service";
import { AdaptationCreateDto } from "@app/shared/dto/adaptation.create.dto";
import { AdaptationStageUpdateDto } from "@app/shared/dto/adaptation.stage.update.dto";

@ApiTags("Adaptation")
@Controller("adaptation")
export class AdaptationController {
  constructor(private readonly adaptationService: AdaptationService) {}

  // Public, unauthenticated search - only non-sensitive fields exposed by
  // AdaptationService.publicSearch.
  @Get("public/search")
  async publicSearch(
    @Query("q") q: string,
    @Query("page") page?: string,
    @Query("size") size?: string
  ) {
    return await this.adaptationService.publicSearch(
      q,
      page ? parseInt(page, 10) : 1,
      size ? parseInt(size, 10) : 10
    );
  }

  @Get("public/summary")
  async publicSummary() {
    return await this.adaptationService.publicSummary();
  }

  // Role check (PROJECT_DEVELOPER only) is enforced in AdaptationService,
  // so JwtAuthGuard alone is sufficient here.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: AdaptationCreateDto, @Request() req) {
    return await this.adaptationService.create(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("query")
  async query(@Request() req) {
    return await this.adaptationService.query(req.user);
  }

  // Role check (DNA/Ministry only) is enforced in AdaptationService.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(":id/stage")
  async updateStage(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AdaptationStageUpdateDto,
    @Request() req
  ) {
    return await this.adaptationService.updateStage(id, dto, req.user);
  }
}
