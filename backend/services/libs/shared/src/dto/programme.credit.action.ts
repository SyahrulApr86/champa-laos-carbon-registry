import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

/**
 * A direct, irreversible credit state transition on an authorised programme.
 * If no owners or amounts are supplied, the service derives the full
 * available balance for the caller's permitted owners.
 */
export class ProgrammeCreditAction {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  programmeId: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  fromCompanyIds?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsOptional()
  companyCredit?: number[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
