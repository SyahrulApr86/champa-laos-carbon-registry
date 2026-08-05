import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { ExpertStatus } from "../enum/expert.status.enum";

export class ExpertStatusUpdateDto {
  @ApiProperty({ enum: ExpertStatus })
  @IsEnum(ExpertStatus)
  status: ExpertStatus;
}
