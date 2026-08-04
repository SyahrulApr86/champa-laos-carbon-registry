import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// NDC (Nationally Determined Contribution) achievement tracking - yearly
// baseline/target/achieved emissions figures recorded by DNA/Ministry,
// publicly viewable to show national emission-reduction target progress.
// Pre-release: all figures are dummy placeholder data entered through this
// form, never hardcoded in source.
@Entity()
export class NdcTargetEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column({ type: "decimal", precision: 18, scale: 2 })
  baselineEmissions: number;

  @Column({ type: "decimal", precision: 18, scale: 2 })
  targetEmissions2030: number;

  @Column({ type: "decimal", precision: 18, scale: 2 })
  achievedEmissions: number;

  @Column({ type: "text", nullable: true })
  notes: string;

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
