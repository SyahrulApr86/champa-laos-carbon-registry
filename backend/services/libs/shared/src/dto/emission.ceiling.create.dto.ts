import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

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

  @ApiPropertyOptional({ default: "tCO2e" })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ enum: ["synthetic_demo", "configured", "not_configured"] })
  @IsOptional()
  @IsIn(["synthetic_demo", "configured", "not_configured"])
  venueStatus?: string;

  @ApiPropertyOptional({ enum: ["available", "not_available", "not_configured"] })
  @IsOptional()
  @IsIn(["available", "not_available", "not_configured"])
  availability?: string;
}
