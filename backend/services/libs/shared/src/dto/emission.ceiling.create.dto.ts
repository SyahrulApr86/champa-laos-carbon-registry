import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class EmissionCeilingCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  units: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seriesName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sector?: string;
}
