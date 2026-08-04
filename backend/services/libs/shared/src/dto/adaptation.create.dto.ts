import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AdaptationSector } from "../enum/adaptation.sector.enum";

export class AdaptationCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ enum: AdaptationSector })
  @IsNotEmpty()
  @IsEnum(AdaptationSector)
  sector: AdaptationSector;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;
}
