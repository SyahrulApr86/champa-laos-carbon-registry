import { BeforeInsert, Column, Entity, PrimaryColumn } from "typeorm";
import { CertificateIssuanceRequestStatus } from "../enum/certificate.issuance.request.status.enum";

@Entity()
export class CertificateIssuanceRequest {
  @PrimaryColumn()
  id: string;

  @Column({ type: "text" })
  creditBlockId: string;

  @Column({ type: "text" })
  serialNumber: string;

  @Column({ type: "text" })
  projectRefId: string;

  @Column({ type: "bigint" })
  companyId: number;

  @Column({ type: "decimal", precision: 18, scale: 6 })
  requestedQuantity: string;

  @Column({
    type: "enum",
    enum: CertificateIssuanceRequestStatus,
    default: CertificateIssuanceRequestStatus.PENDING,
  })
  status: CertificateIssuanceRequestStatus;

  @Column({ type: "text", nullable: true })
  certificateLotId?: string | null;

  @Column({ type: "text", nullable: true })
  certificateId?: string | null;

  @Column({ type: "bigint" })
  requestedBy: number;

  @Column({ type: "bigint" })
  requestedAt: number;

  @Column({ type: "bigint", nullable: true })
  reviewedBy?: number | null;

  @Column({ type: "bigint", nullable: true })
  reviewedAt?: number | null;

  @Column({ type: "text", nullable: true })
  remarks?: string | null;

  @BeforeInsert()
  async timestampAtInsert() {
    this.requestedAt = new Date().getTime();
  }
}
