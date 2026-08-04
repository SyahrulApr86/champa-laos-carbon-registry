import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ExpertStatus } from "../enum/expert.status.enum";

export class ExpertCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  affiliation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  expertise: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  yearsOfExperience?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiPropertyOptional({ enum: ExpertStatus })
  @IsOptional()
  @IsEnum(ExpertStatus)
  status?: ExpertStatus;
}
