import { Type } from "class-transformer";
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateCertificateLotDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(96)
  certificateLotId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(96)
  programmeId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  certificateId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  registryScheme?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  registryNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  vintageStart?: string;

  @IsOptional()
  @IsDateString()
  vintageEnd?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  issuedQuantity: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  unit?: string;

  @IsOptional()
  @IsObject()
  provenance?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  publicFields?: Record<string, unknown>;
}

export class UpdateCertificateLotDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(96)
  programmeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  registryScheme?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  registryNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  vintageStart?: string | null;

  @IsOptional()
  @IsDateString()
  vintageEnd?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  issuedQuantity?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  unit?: string;

  @IsOptional()
  @IsObject()
  provenance?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  publicFields?: Record<string, unknown>;
}

export class ArchiveCertificateLotDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class CertificateLifecycleCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  idempotencyKey: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sourcePortionId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  parentEventId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  toOwnerCompanyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsDateString()
  effectiveAt?: string;
}
