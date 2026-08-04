import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { AdaptationStage } from "../enum/adaptation.stage.enum";

export class AdaptationStageUpdateDto {
  @ApiProperty({ enum: AdaptationStage })
  @IsNotEmpty()
  @IsEnum(AdaptationStage)
  stage: AdaptationStage;
}
