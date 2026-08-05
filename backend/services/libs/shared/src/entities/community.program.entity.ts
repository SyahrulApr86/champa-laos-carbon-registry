import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { CommunityProgramCategory } from "../enum/community.program.category.enum";
import { CommunityProgramStatus } from "../enum/community.program.status.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Community climate program registry - tracks community/village-level climate
// resilience and action initiatives (distinct from the project-level
// Adaptation registry, which covers individual carbon-credit-adjacent
// projects). Recorded by DNA/Ministry, publicly viewable in the registry.
@Entity()
export class CommunityProgramEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  programId: string;

  @Column()
  name: string;

  @Column()
  region: string;

  @Column({
    type: "enum",
    enum: CommunityProgramCategory,
    array: false,
  })
  category: CommunityProgramCategory;

  @Column({ type: "text" })
  description: string;

  @Column({ nullable: true })
  createdByUserId: number;

  @Column({ nullable: true })
  updatedByUserId: number;

  @Column({ type: "int", nullable: true })
  participantCount: number;

  @Column({ type: "int" })
  startYear: number;

  @Column({
    type: "enum",
    enum: CommunityProgramStatus,
    array: false,
    default: CommunityProgramStatus.ACTIVE,
  })
  status: CommunityProgramStatus;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  updatedAt: number;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  archivedAt: number;

  @Column({ nullable: true })
  archivedByUserId: number;

  @Column({ type: "text", nullable: true })
  archiveReason: string;

  @BeforeInsert()
  setCreatedAt() {
    const timestamp = new Date().getTime();
    this.createdAt = timestamp;
    this.updatedAt = timestamp;
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date().getTime();
  }
}
