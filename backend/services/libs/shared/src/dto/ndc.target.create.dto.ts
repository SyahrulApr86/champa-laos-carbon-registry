import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { NdcSector } from "../enum/ndc.sector.enum";

export class NdcTargetCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  year: number;

  @ApiProperty({ enum: NdcSector })
  @IsNotEmpty()
  @IsEnum(NdcSector)
  sector: NdcSector;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  baselineEmissions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  targetEmissions2030: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  achievedEmissions: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  claimedEmissions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
