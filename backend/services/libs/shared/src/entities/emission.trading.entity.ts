import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";
import { EmissionLifecycleEvent } from "../emission-trading/emission.lifecycle";

// A configured ceiling-market event. It is not a certificate transaction and
// does not change certificate supply unless W2 later supplies an approved,
// auditable bridge reference.
@Entity()
export class EmissionTradingEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sellerCompanyId: number;

  @Column()
  buyerCompanyId: number;

  @Column({ type: "decimal", precision: 18, scale: 2, transformer: NumberTransformer })
  units: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true, transformer: NumberTransformer })
  valueLAK: number;

  @Column({ type: "varchar", nullable: true, default: "LAK" })
  currency: string;

  @Column({ type: "varchar", nullable: true })
  seriesName: string;

  @Column({ type: "int", nullable: true })
  ceilingAllocationId: number;

  @Column({ type: "varchar", nullable: true })
  venueStatus: string;

  @Column({ type: "varchar", nullable: true })
  settlementStatus: string;

  // This is intentionally only an opaque reference. W7 neither creates nor
  // mutates certificate ledger events.
  @Column({ type: "varchar", nullable: true })
  certificateBridgeEventId: string;

  @Column({ type: "varchar", nullable: true })
  idempotencyKey: string;

  @Column({ type: "bigint", transformer: NumberTransformer })
  tradeDate: number;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @Column({ type: "varchar", nullable: true, default: "active" })
  lifecycleStatus: string;

  @Column({ type: "text", nullable: true })
  lifecycleReason: string;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  updatedAt: number;

  @Column({ type: "int", nullable: true })
  createdBy: number;

  @Column({ type: "int", nullable: true })
  updatedBy: number;

  @Column({ type: "int", nullable: true })
  reversalOfTradeId: number;

  @Column({ type: "jsonb", nullable: true })
  lifecycleHistory: EmissionLifecycleEvent[];

  @BeforeInsert()
  setCreatedAt() {
    const timestamp = new Date().getTime();
    this.createdAt = timestamp;
    this.updatedAt = timestamp;
  }
}
