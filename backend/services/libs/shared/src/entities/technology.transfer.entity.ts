import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { ClimateActionType } from "../enum/climate.action.type.enum";
import { SupportStatus } from "../enum/support.status.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Technology development & transfer support tracking, analogous to SRN's
// "Technology Development & Transfer Support Received" table. Recorded by
// DNA/Ministry, publicly viewable under the Resources section.
@Entity()
export class TechnologyTransferEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column()
  technologyType: string;

  @Column({ nullable: true })
  timeframe: string;

  @Column()
  recipientEntity: string;

  @Column()
  implementingEntity: string;

  @Column({
    type: "enum",
    enum: ClimateActionType,
    array: false,
  })
  type: ClimateActionType;

  @Column()
  sector: string;

  @Column({ nullable: true })
  subsector: string;

  @Column({
    type: "enum",
    enum: SupportStatus,
    array: false,
    default: SupportStatus.ON_GOING,
  })
  status: SupportStatus;

  @Column({ type: "text", nullable: true })
  impactEstimatedResult: string;

  @Column({ type: "text", nullable: true })
  additionalInformation: string;

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
