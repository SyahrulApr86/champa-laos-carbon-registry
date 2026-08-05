import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { CompanyRole } from "../enum/company.role.enum";
import { RecognizedMitigationStatus } from "../enum/recognized.mitigation.status.enum";
import { Sector } from "../enum/sector.enum";

export class RecognizedMitigationUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  proponentName?: string;

  @ApiPropertyOptional({ enum: CompanyRole })
  @IsOptional()
  @IsEnum(CompanyRole)
  proponentType?: CompanyRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  proponentCompanyId?: number;

  @ApiPropertyOptional({ enum: Sector })
  @IsOptional()
  @IsEnum(Sector)
  sector?: Sector;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedReductionTco2e?: number;

  @ApiPropertyOptional({ enum: RecognizedMitigationStatus })
  @IsOptional()
  @IsEnum(RecognizedMitigationStatus)
  status?: RecognizedMitigationStatus;
}
