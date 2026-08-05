import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { Sector } from "../enum/sector.enum";
import { FinanceChannel } from "../enum/finance.channel.enum";
import { FinancialInstrument } from "../enum/finance.instrument.enum";
import { FinanceStatus } from "../enum/finance.status.enum";
import { ClimateActionType } from "../enum/climate.action.type.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Climate finance tracking - climate-related financial support received
// (grants/loans), analogous to SRN's "Financial Support Received" table.
// Recorded by DNA/Ministry, publicly viewable under the Resources section.
@Entity()
export class ClimateFinanceEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({
    type: "enum",
    enum: FinanceChannel,
    array: false,
  })
  channel: FinanceChannel;

  @Column()
  recipientEntity: string;

  @Column()
  implementingEntity: string;

  @Column({ type: "bigint", transformer: NumberTransformer })
  dateSigned: number;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  dateClosing: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  amountLAK: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  amountUSD: number;

  @Column({
    type: "enum",
    enum: Sector,
    array: false,
  })
  sector: Sector;

  @Column({
    type: "enum",
    enum: FinancialInstrument,
    array: false,
  })
  financialInstrument: FinancialInstrument;

  @Column({
    type: "enum",
    enum: FinanceStatus,
    array: false,
    default: FinanceStatus.ONGOING,
  })
  status: FinanceStatus;

  @Column({
    type: "enum",
    enum: ClimateActionType,
    array: false,
  })
  type: ClimateActionType;

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
