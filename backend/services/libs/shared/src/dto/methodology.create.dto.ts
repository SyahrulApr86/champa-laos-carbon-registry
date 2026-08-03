import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Sector } from "../enum/sector.enum";
import { MethodologyStatus } from "../enum/methodology.status.enum";

export class MethodologyCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  methodologyNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
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
  description?: string;
}
