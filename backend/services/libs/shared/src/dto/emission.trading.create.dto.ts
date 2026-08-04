import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

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
}
