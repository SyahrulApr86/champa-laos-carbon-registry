import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreditCancelDto {
  @IsString()
  @IsNotEmpty()
  programmeId: string;

  @IsNumber()
  amount: number;
}
