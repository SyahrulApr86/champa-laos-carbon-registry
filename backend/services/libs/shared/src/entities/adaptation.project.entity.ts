import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { AdaptationSector } from "../enum/adaptation.sector.enum";
import { AdaptationStage } from "../enum/adaptation.stage.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Adaptation project registry - tracks climate adaptation projects, separate
// from the mitigation/programme (carbon credit) flow. Project developers
// submit; DNA/Ministry review and approve/reject.
@Entity()
export class AdaptationProjectEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  adaptationId: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({
    type: "enum",
    enum: AdaptationSector,
    array: false,
  })
  sector: AdaptationSector;

  @Column({ nullable: true })
  region: string;

  @Column()
  companyId: number;

  @Column({ nullable: true })
  createdByUserId: number;

  @Column({ nullable: true })
  updatedByUserId: number;

  @Column({
    type: "enum",
    enum: AdaptationStage,
    array: false,
    default: AdaptationStage.SUBMITTED,
  })
  currentStage: AdaptationStage;

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
