import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { Sector } from "../enum/sector.enum";
import { MethodologyStatus } from "../enum/methodology.status.enum";

export class MethodologyUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  methodologyNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: Sector })
  @IsOptional()
  @IsEnum(Sector)
  category?: Sector;

  @ApiPropertyOptional({ enum: MethodologyStatus })
  @IsOptional()
  @IsEnum(MethodologyStatus)
  status?: MethodologyStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
