import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class NdcTargetCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  year: number;

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
  @IsString()
  notes?: string;
}
