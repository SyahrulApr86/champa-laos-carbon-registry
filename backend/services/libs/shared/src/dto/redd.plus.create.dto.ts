import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { ReddPlusStatus } from "../enum/redd.plus.status.enum";

export class ReddPlusCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  forestAreaHectares?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedEmissionReductionTco2e?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  implementingEntity: string;

  @ApiPropertyOptional({ enum: ReddPlusStatus })
  @IsOptional()
  @IsEnum(ReddPlusStatus)
  status?: ReddPlusStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  startYear?: number;
}
