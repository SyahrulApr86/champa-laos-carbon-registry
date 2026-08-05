import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class EmissionParticipantUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  companyId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  facilityName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  capacityDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  seriesName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  sector?: string;

  @ApiPropertyOptional({ enum: ["active", "unallocated", "withheld"] })
  @IsOptional()
  @IsIn(["active", "unallocated", "withheld"])
  participantStatus?: string;

  @ApiPropertyOptional({ description: "Why the administrative correction was made." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
