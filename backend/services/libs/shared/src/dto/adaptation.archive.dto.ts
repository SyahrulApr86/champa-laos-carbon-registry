import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdaptationArchiveDto {
  @ApiPropertyOptional({ description: "Reason retained with the lifecycle request." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
