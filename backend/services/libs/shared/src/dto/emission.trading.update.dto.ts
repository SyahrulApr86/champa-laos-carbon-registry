import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from "class-validator";

export class EmissionTradingUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  sellerCompanyId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  buyerCompanyId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  units?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Max(9999999999999999)
  valueLAK?: number;

  @ApiPropertyOptional({ enum: ["LAK"] })
  @IsOptional()
  @IsIn(["LAK"])
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  tradeDate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  seriesName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  ceilingAllocationId?: number;

  @ApiPropertyOptional({ enum: ["synthetic_demo", "configured", "not_configured"] })
  @IsOptional()
  @IsIn(["synthetic_demo", "configured", "not_configured"])
  venueStatus?: string;

  @ApiPropertyOptional({ enum: ["not_applicable", "configured", "not_configured", "pending", "settled", "completed", "finalized"] })
  @IsOptional()
  @IsIn(["not_applicable", "configured", "not_configured", "pending", "settled", "completed", "finalized"])
  settlementStatus?: string;

  @ApiPropertyOptional({ description: "Why the administrative correction was made." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
