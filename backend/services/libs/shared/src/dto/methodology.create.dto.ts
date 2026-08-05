import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Sector } from "../enum/sector.enum";
import { MethodologyStatus } from "../enum/methodology.status.enum";

export class MethodologyCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  methodologyNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(240)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(240)
  source: string;

  @ApiProperty({ enum: Sector })
  @IsNotEmpty()
  @IsEnum(Sector)
  category: Sector;

  @ApiPropertyOptional({ enum: MethodologyStatus })
  @IsOptional()
  @IsEnum(MethodologyStatus)
  status?: MethodologyStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;
}
