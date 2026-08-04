import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Emission ceiling & trading tracker (PTBAE-PU style, prototype). Tracks
// individual power-generation facilities participating in a company's
// emission ceiling allocation for a given year (SRN's "PTBAE-PU
// Participants" tab equivalent). Prototype grade - not tied to a specific
// real-world Lao regulation.
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

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date().getTime();
  }
}
