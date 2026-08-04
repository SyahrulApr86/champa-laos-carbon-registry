import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Emission ceiling & trading tracker (PTBAE-PU style, prototype). Tracks
// individual trading transactions of emission ceiling units between
// companies. Prototype grade - not tied to a specific real-world Lao
// regulation.
@Entity()
export class EmissionTradingEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sellerCompanyId: number;

  @Column()
  buyerCompanyId: number;

  @Column({ type: "decimal", precision: 18, scale: 2 })
  units: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  valueLAK: number;

  @Column({ type: "bigint", transformer: NumberTransformer })
  tradeDate: number;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date().getTime();
  }
}
