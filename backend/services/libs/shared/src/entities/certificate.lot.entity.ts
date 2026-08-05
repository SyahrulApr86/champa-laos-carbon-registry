import { Column, Entity, Index, PrimaryColumn } from "typeorm";

/**
 * The issued quantity is the immutable supply ceiling for a certificate lot.
 * Current custody is held by CertificatePortion rows, never by this record.
 */
@Entity({ name: "certificate_lot" })
export class CertificateLot {
  @PrimaryColumn({ type: "varchar", length: 96 })
  certificateLotId: string;

  @Index()
  @Column({ type: "varchar", length: 96 })
  programmeId: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 128 })
  certificateId: string;

  @Column({ type: "varchar", length: 160, default: "Champa Certificate Registry" })
  registryScheme: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  registryNumber: string | null;

  @Column({ type: "varchar", length: 128, nullable: true })
  serialNumber: string | null;

  @Column({ type: "date", nullable: true })
  vintageStart: string | null;

  @Column({ type: "date", nullable: true })
  vintageEnd: string | null;

  @Column({ type: "decimal", precision: 18, scale: 6 })
  issuedQuantity: string;

  @Column({ type: "varchar", length: 32, default: "tCO2e" })
  unit: string;

  @Column({ type: "timestamptz", nullable: true })
  issuedAt: Date | null;

  @Column({ type: "jsonb", default: () => "'{}'" })
  provenance: Record<string, unknown>;

  @Column({ type: "jsonb", default: () => "'{}'" })
  publicFields: Record<string, unknown>;

  @Column({ type: "timestamptz" })
  asOf: Date;
}
