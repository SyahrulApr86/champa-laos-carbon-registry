import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";
import { EmissionLifecycleEvent } from "../emission-trading/emission.lifecycle";

// A configurable facility/organisation participating in a ceiling series.
// Public demo rows are synthetic until an approved source is configured.
@Entity()
export class EmissionParticipantEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column()
  facilityName: string;

  // Free-text capacity description, e.g. "50 MW".
  @Column()
  capacityDescription: string;

  @Column({ type: "int" })
  year: number;

  @Column({ type: "varchar", nullable: true })
  seriesName: string;

  @Column({ type: "varchar", nullable: true })
  sector: string;

  @Column({ type: "varchar", nullable: true })
  participantStatus: string;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @Column({ type: "varchar", nullable: true, default: "active" })
  lifecycleStatus: string;

  @Column({ type: "varchar", nullable: true })
  lifecycleReason: string;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  updatedAt: number;

  @Column({ type: "int", nullable: true })
  createdBy: number;

  @Column({ type: "int", nullable: true })
  updatedBy: number;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  archivedAt: number;

  @Column({ type: "int", nullable: true })
  archivedBy: number;

  @Column({ type: "jsonb", nullable: true })
  lifecycleHistory: EmissionLifecycleEvent[];

  @BeforeInsert()
  setCreatedAt() {
    const timestamp = new Date().getTime();
    this.createdAt = timestamp;
    this.updatedAt = timestamp;
  }
}
