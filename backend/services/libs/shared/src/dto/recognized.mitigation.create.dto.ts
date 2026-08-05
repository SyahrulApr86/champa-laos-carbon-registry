import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { Sector } from "../enum/sector.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { RecognizedMitigationStatus } from "../enum/recognized.mitigation.status.enum";

export class RecognizedMitigationCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(10000)
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  proponentName: string;

  @ApiProperty({ enum: CompanyRole })
  @IsNotEmpty()
  @IsEnum(CompanyRole)
  proponentType: CompanyRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  proponentCompanyId?: number;

  @ApiProperty({ enum: Sector })
  @IsNotEmpty()
  @IsEnum(Sector)
  sector: Sector;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  region: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedReductionTco2e?: number;

  @ApiPropertyOptional({ enum: RecognizedMitigationStatus })
  @IsOptional()
  @IsEnum(RecognizedMitigationStatus)
  status?: RecognizedMitigationStatus;
}
