import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { CommunityProgramCategory } from "../enum/community.program.category.enum";
import { CommunityProgramStatus } from "../enum/community.program.status.enum";

export class CommunityProgramUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  region?: string;

  @ApiPropertyOptional({ enum: CommunityProgramCategory })
  @IsOptional()
  @IsEnum(CommunityProgramCategory)
  category?: CommunityProgramCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  participantCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  startYear?: number;

  @ApiPropertyOptional({ enum: CommunityProgramStatus })
  @IsOptional()
  @IsEnum(CommunityProgramStatus)
  status?: CommunityProgramStatus;
}
