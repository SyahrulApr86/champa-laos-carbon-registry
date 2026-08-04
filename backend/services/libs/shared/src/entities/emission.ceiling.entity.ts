import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Emission ceiling & trading tracker (PTBAE-PU style, prototype). Tracks the
// emission ceiling units allocated to a company for a given year. Prototype
// grade - not tied to a specific real-world Lao regulation.
@Entity()
export class EmissionCeilingEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column({ type: "int" })
  year: number;

  @Column({ type: "decimal", precision: 18, scale: 2 })
  units: number;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date().getTime();
  }
}
