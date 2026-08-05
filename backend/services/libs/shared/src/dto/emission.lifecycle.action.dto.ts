import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import {
  EMISSION_LIFECYCLE_ACTIONS,
  EmissionLifecycleAction,
} from "../emission-trading/emission.lifecycle";

export class EmissionLifecycleActionDto {
  @ApiProperty({ enum: EMISSION_LIFECYCLE_ACTIONS })
  @IsIn(EMISSION_LIFECYCLE_ACTIONS)
  action: EmissionLifecycleAction;

  @ApiProperty({ description: "Required for every lifecycle command and retained in audit history." })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;
}
