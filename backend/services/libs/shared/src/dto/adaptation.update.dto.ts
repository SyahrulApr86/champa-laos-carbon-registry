import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { AdaptationSector } from "../enum/adaptation.sector.enum";

export class AdaptationUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: AdaptationSector })
  @IsOptional()
  @IsEnum(AdaptationSector)
  sector?: AdaptationSector;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  region?: string;
}
