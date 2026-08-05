import { ApiProperty } from "@nestjs/swagger";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Max, Min } from "class-validator";

export class EmissionParticipantCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  companyId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  facilityName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  capacityDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seriesName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ enum: ["active", "unallocated", "withheld"] })
  @IsOptional()
  @IsIn(["active", "unallocated", "withheld"])
  participantStatus?: string;
}
