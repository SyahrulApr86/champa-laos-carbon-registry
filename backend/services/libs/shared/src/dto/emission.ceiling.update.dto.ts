import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from "class-validator";

export class EmissionCeilingUpdateDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @IsPositive() companyId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(2000) @Max(2100) year?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() units?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() seriesName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sector?: string;
  @ApiPropertyOptional({ enum: ["tCO2e"] }) @IsOptional() @IsIn(["tCO2e"]) unit?: string;
  @ApiPropertyOptional({ enum: ["synthetic_demo", "configured", "not_configured"] }) @IsOptional() @IsIn(["synthetic_demo", "configured", "not_configured"]) venueStatus?: string;
  @ApiPropertyOptional({ enum: ["available", "not_available", "not_configured"] }) @IsOptional() @IsIn(["available", "not_available", "not_configured"]) availability?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
