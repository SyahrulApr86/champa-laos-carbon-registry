import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { CertificateLedgerEventType, CertificatePortionState } from "../enum/certificate.ledger.enum";

/** Immutable event journal. Portions are a replaceable current-state projection. */
@Entity({ name: "certificate_ledger_event" })
@Index(["certificateLotId", "effectiveAt"])
export class CertificateLedgerEvent {
  @PrimaryColumn({ type: "varchar", length: 128 })
  eventId: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 160 })
  idempotencyKey: string;

  @Index()
  @Column({ type: "varchar", length: 96 })
  certificateLotId: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  sourcePortionId: string | null;

  @Column({ type: "varchar", length: 128, nullable: true })
  parentEventId: string | null;

  @Column({ type: "enum", enum: CertificateLedgerEventType, enumName: "certificate_ledger_event_type_enum" })
  eventType: CertificateLedgerEventType;

  @Column({ type: "decimal", precision: 18, scale: 6 })
  quantity: string;

  @Column({ type: "varchar", length: 32 })
  unit: string;

  @Column({ type: "bigint", nullable: true })
  fromOwnerCompanyId: string | null;

  @Column({ type: "bigint", nullable: true })
  toOwnerCompanyId: string | null;

  @Column({ type: "enum", enum: CertificatePortionState, enumName: "certificate_portion_state_enum", nullable: true })
  fromState: CertificatePortionState | null;

  @Column({ type: "enum", enum: CertificatePortionState, enumName: "certificate_portion_state_enum", nullable: true })
  toState: CertificatePortionState | null;

  @Column({ type: "timestamptz" })
  effectiveAt: Date;

  @Column({ type: "timestamptz" })
  recordedAt: Date;

  @Column({ type: "varchar", length: 160, nullable: true })
  actorReference: string | null;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  @Column({ type: "varchar", length: 40, default: "synthetic_demo" })
  sourceType: string;

  @Column({ type: "timestamptz" })
  asOf: Date;
}
