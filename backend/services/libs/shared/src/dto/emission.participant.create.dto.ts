import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class EmissionParticipantCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
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
  @IsNumber()
  year: number;
}
