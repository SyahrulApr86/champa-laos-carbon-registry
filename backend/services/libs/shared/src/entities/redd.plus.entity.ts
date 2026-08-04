import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { ReddPlusStatus } from "../enum/redd.plus.status.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// REDD+ (Reducing Emissions from Deforestation and forest Degradation)
// forest-carbon project registry, scoped to Lao PDR's real 18 provinces
// (see backend/services/regions.csv, seeded into the Region table).
// Mirrors Indonesia's SRN REDD++ province-grid sub-tab under Mitigation.
// Recorded by DNA/Ministry, publicly viewable in the registry.
@Entity()
export class ReddPlusEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  province: string;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  forestAreaHectares: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  estimatedEmissionReductionTco2e: number;

  @Column()
  implementingEntity: string;

  @Column({
    type: "enum",
    enum: ReddPlusStatus,
    array: false,
    default: ReddPlusStatus.PROPOSED,
  })
  status: ReddPlusStatus;

  @Column({ type: "int", nullable: true })
  startYear: number;

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
