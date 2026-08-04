import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { CommunityProgramCategory } from "../enum/community.program.category.enum";
import { CommunityProgramStatus } from "../enum/community.program.status.enum";

export class CommunityProgramCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  region: string;

  @ApiProperty({ enum: CommunityProgramCategory })
  @IsNotEmpty()
  @IsEnum(CommunityProgramCategory)
  category: CommunityProgramCategory;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  participantCount?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  startYear: number;

  @ApiPropertyOptional({ enum: CommunityProgramStatus })
  @IsOptional()
  @IsEnum(CommunityProgramStatus)
  status?: CommunityProgramStatus;
}
