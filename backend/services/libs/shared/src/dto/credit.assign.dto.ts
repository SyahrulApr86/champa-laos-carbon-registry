import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreditAssignDto {
  @IsString()
  @IsNotEmpty()
  programmeId: string;

  @IsNumber()
  amount: number;
}
