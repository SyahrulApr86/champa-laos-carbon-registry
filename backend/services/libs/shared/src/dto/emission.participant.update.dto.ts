import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, IsPositive, IsString, Max, Min } from "class-validator";

export class EmissionParticipantUpdateDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @IsPositive() companyId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() facilityName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() capacityDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(2000) @Max(2100) year?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() seriesName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sector?: string;
  @ApiPropertyOptional({ enum: ["active", "unallocated", "withheld"] }) @IsOptional() @IsIn(["active", "unallocated", "withheld"]) participantStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
