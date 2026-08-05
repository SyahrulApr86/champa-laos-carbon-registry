import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Configurable emission-ceiling allocation. This is deliberately a separate
// namespace from certificate lots and must never be aggregated as a credit
// balance.
@Entity()
export class EmissionCeilingEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column({ type: "int" })
  year: number;

  // Free-text ceiling-series label, e.g. "Power Generation 2024".
  // Nullable - older rows or minimal submissions may omit it.
  @Column({ type: "varchar", nullable: true })
  seriesName: string;

  // Free-text sector label the ceiling applies to (e.g. "Power Generation").
  @Column({ type: "varchar", nullable: true })
  sector: string;

  @Column({ type: "varchar", nullable: true })
  unit: string;

  @Column({ type: "varchar", nullable: true })
  venueStatus: string;

  @Column({ type: "varchar", nullable: true })
  availability: string;

  @Column({ type: "decimal", precision: 18, scale: 2 })
  units: number;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date().getTime();
  }
}
