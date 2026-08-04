import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Sector } from "../enum/sector.enum";
import { FinanceChannel } from "../enum/finance.channel.enum";
import { FinancialInstrument } from "../enum/finance.instrument.enum";
import { FinanceStatus } from "../enum/finance.status.enum";
import { ClimateActionType } from "../enum/climate.action.type.enum";

export class ClimateFinanceCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: FinanceChannel })
  @IsOptional()
  @IsEnum(FinanceChannel)
  channel?: FinanceChannel;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  recipientEntity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  implementingEntity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  dateSigned: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dateClosing?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountLAK?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountUSD?: number;

  @ApiProperty({ enum: Sector })
  @IsNotEmpty()
  @IsEnum(Sector)
  sector: Sector;

  @ApiPropertyOptional({ enum: FinancialInstrument })
  @IsOptional()
  @IsEnum(FinancialInstrument)
  financialInstrument?: FinancialInstrument;

  @ApiPropertyOptional({ enum: FinanceStatus })
  @IsOptional()
  @IsEnum(FinanceStatus)
  status?: FinanceStatus;

  @ApiProperty({ enum: ClimateActionType })
  @IsNotEmpty()
  @IsEnum(ClimateActionType)
  type: ClimateActionType;
}
