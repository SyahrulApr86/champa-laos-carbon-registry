import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CertificateIssuanceActionEnum } from "../enum/certificate.issuance.action.enum";

export class CertificateIssuanceActionDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsEnum(CertificateIssuanceActionEnum)
  action: CertificateIssuanceActionEnum;

  @IsOptional()
  @IsString()
  remarks?: string;
}
