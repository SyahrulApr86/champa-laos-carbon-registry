import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ClimateActionType } from "../enum/climate.action.type.enum";
import { SupportStatus } from "../enum/support.status.enum";

export class CapacityBuildingCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timeframe?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  recipientEntity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  implementingEntity: string;

  @ApiProperty({ enum: ClimateActionType })
  @IsNotEmpty()
  @IsEnum(ClimateActionType)
  type: ClimateActionType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sector: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subsector?: string;

  @ApiPropertyOptional({ enum: SupportStatus })
  @IsOptional()
  @IsEnum(SupportStatus)
  status?: SupportStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  impactEstimatedResult?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalInformation?: string;
}
