import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Sector } from "../enum/sector.enum";
import { FinanceChannel } from "../enum/finance.channel.enum";
import { FinancialInstrument } from "../enum/finance.instrument.enum";
import { FinanceStatus } from "../enum/finance.status.enum";
import { ClimateActionType } from "../enum/climate.action.type.enum";

export class ClimateFinanceUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: FinanceChannel })
  @IsOptional()
  @IsEnum(FinanceChannel)
  channel?: FinanceChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  recipientEntity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  implementingEntity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dateSigned?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dateClosing?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999999)
  amountLAK?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999999)
  amountUSD?: number;

  @ApiPropertyOptional({ enum: Sector })
  @IsOptional()
  @IsEnum(Sector)
  sector?: Sector;

  @ApiPropertyOptional({ enum: FinancialInstrument })
  @IsOptional()
  @IsEnum(FinancialInstrument)
  financialInstrument?: FinancialInstrument;

  @ApiPropertyOptional({ enum: FinanceStatus })
  @IsOptional()
  @IsEnum(FinanceStatus)
  status?: FinanceStatus;

  @ApiPropertyOptional({ enum: ClimateActionType })
  @IsOptional()
  @IsEnum(ClimateActionType)
  type?: ClimateActionType;
}
