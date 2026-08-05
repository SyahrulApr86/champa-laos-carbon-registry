import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { ClimateActionType } from "../enum/climate.action.type.enum";
import { SupportStatus } from "../enum/support.status.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Capacity building support tracking, analogous to SRN's "Capacity Building
// Support Received" table. Recorded by DNA/Ministry, publicly viewable
// under the Resources section.
@Entity()
export class CapacityBuildingEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

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

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  archivedAt: number;

  @Column({ type: "text", nullable: true })
  archiveReason: string;

  @BeforeInsert()
  setCreatedAt() {
    const timestamp = new Date().getTime();
    this.createdAt = timestamp;
    this.updatedAt = timestamp;
  }
}
