import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { CertificatePortionState } from "../enum/certificate.ledger.enum";

/** A mutually exclusive current-state projection for part of one certificate lot. */
@Entity({ name: "certificate_portion" })
@Index(["certificateLotId", "state"])
export class CertificatePortion {
  @PrimaryColumn({ type: "varchar", length: 128 })
  certificatePortionId: string;

  @Index()
  @Column({ type: "varchar", length: 96 })
  certificateLotId: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  parentPortionId: string | null;

  @Column({ type: "bigint", nullable: true })
  ownerCompanyId: string | null;

  @Column({ type: "enum", enum: CertificatePortionState })
  state: CertificatePortionState;

  @Column({ type: "decimal", precision: 18, scale: 6 })
  quantity: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  withheldReason: string | null;

  @Column({ type: "timestamptz" })
  asOf: Date;
}
