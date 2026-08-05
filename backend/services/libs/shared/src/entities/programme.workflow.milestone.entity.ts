import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { PublicAvailability } from "../enum/certificate.ledger.enum";

@Entity({ name: "programme_workflow_milestone" })
@Index(["programmeId", "sequence"], { unique: true })
export class ProgrammeWorkflowMilestone {
  @PrimaryColumn({ type: "varchar", length: 128 })
  milestoneId: string;

  @Index()
  @Column({ type: "varchar", length: 96 })
  programmeId: string;

  @Column({ type: "integer" })
  sequence: number;

  @Column({ type: "varchar", length: 96 })
  milestoneKey: string;

  @Column({ type: "varchar", length: 160 })
  label: string;

  @Column({ type: "varchar", length: 48 })
  status: string;

  @Column({ type: "enum", enum: PublicAvailability, default: PublicAvailability.NOT_CONFIGURED })
  availability: PublicAvailability;

  @Column({ type: "timestamptz", nullable: true })
  occurredAt: Date | null;

  @Column({ type: "text", nullable: true })
  publicSummary: string | null;
}
