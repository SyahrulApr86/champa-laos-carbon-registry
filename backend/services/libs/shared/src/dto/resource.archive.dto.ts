import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class ResourceArchiveDto {
  @ApiPropertyOptional({ description: "Why this source record was archived." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
