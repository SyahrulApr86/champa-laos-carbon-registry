import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { ExpertStatus } from "../enum/expert.status.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Roster of Expert - accredited technical experts available to support
// carbon market activities (MRV, methodology review, adaptation planning,
// etc). Mirrors SRN Indonesia's Instruments > Roster of Expert directory
// (name, institution, expertise, domicile, certification, experience).
// Experts are accredited/registered by DNA/Ministry; the roster is
// publicly searchable, honestly empty until real experts are registered.
@Entity()
export class ExpertEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  affiliation: string;

  @Column({ type: "text" })
  expertise: string;

  @Column({ nullable: true })
  certification: string;

  @Column({ type: "int", nullable: true })
  yearsOfExperience: number;

  @Column()
  province: string;

  @Column({
    type: "enum",
    enum: ExpertStatus,
    array: false,
    default: ExpertStatus.ACTIVE,
  })
  status: ExpertStatus;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  updatedAt: number;

  @BeforeInsert()
  setCreatedAt() {
    const timestamp = new Date().getTime();
    this.createdAt = timestamp;
    this.updatedAt = timestamp;
  }
}
