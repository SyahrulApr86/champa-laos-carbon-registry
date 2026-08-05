import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, ValidateIf } from "class-validator";
import { CertificateLedgerEventType, CertificatePortionState } from "../enum/certificate.ledger.enum";

export class RecordCertificateLedgerEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  idempotencyKey: string;

  @IsString()
  @IsNotEmpty()
  certificateLotId: string;

  @IsEnum(CertificateLedgerEventType)
  eventType: CertificateLedgerEventType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  sourcePortionId?: string;

  @ValidateIf((dto) => dto.eventType === CertificateLedgerEventType.REVERSED)
  @IsString()
  parentEventId?: string;

  @IsOptional()
  @IsString()
  toOwnerCompanyId?: string;

  @IsOptional()
  @IsString()
  actorReference?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  effectiveAt?: string;
}

export interface CertificateRegistryQuery {
  q?: string;
  page?: number;
  pageSize?: number;
  scheme?: string;
  sector?: string;
  state?: CertificatePortionState;
  holderId?: string;
}
