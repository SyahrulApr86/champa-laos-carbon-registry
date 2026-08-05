import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";

export enum MethodologyLifecycleAction {
  PUBLISH = "publish",
  ARCHIVE = "archive",
}

export class MethodologyLifecycleDto {
  @ApiProperty({ enum: MethodologyLifecycleAction })
  @IsNotEmpty()
  @IsEnum(MethodologyLifecycleAction)
  action: MethodologyLifecycleAction;
}
