import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class EmissionTradingCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sellerCompanyId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  buyerCompanyId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  units: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  valueLAK?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
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

  @ApiPropertyOptional({ enum: ["not_applicable", "configured", "not_configured"] })
  @IsOptional()
  @IsIn(["not_applicable", "configured", "not_configured"])
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
