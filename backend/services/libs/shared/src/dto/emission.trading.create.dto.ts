import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class EmissionTradingCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  sellerCompanyId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  buyerCompanyId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  units: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  valueLAK?: number;

  @ApiPropertyOptional({ enum: ["LAK"], default: "LAK" })
  @IsOptional()
  @IsIn(["LAK"])
  currency?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  tradeDate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seriesName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ceilingAllocationId?: number;

  @ApiPropertyOptional({ enum: ["synthetic_demo", "configured", "not_configured"] })
  @IsOptional()
  @IsIn(["synthetic_demo", "configured", "not_configured"])
  venueStatus?: string;

  @ApiPropertyOptional({ enum: ["not_applicable", "configured", "not_configured", "pending", "settled", "completed", "finalized"] })
  @IsOptional()
  @IsIn(["not_applicable", "configured", "not_configured", "pending", "settled", "completed", "finalized"])
  settlementStatus?: string;

  @ApiPropertyOptional({ description: "Opaque W2-approved certificate bridge reference only" })
  @IsOptional()
  @IsString()
  certificateBridgeEventId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
