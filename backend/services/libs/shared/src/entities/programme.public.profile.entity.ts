import { Column, Entity, PrimaryColumn } from "typeorm";
import { PublicAvailability } from "../enum/certificate.ledger.enum";

@Entity({ name: "programme_public_profile" })
export class ProgrammePublicProfile {
  @PrimaryColumn({ type: "varchar", length: 96 })
  programmeId: string;

  @Column({ type: "text", nullable: true })
  goals: string | null;

  @Column({ type: "text", nullable: true })
  actionSummary: string | null;

  @Column({ type: "text", nullable: true })
  vulnerabilitySummary: string | null;

  @Column({ type: "enum", enum: PublicAvailability, default: PublicAvailability.NOT_CONFIGURED })
  vulnerabilityAvailability: PublicAvailability;

  @Column({ type: "jsonb", default: () => "'{}'" })
  provenance: Record<string, unknown>;
}
