import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";
import { NdcSector } from "../enum/ndc.sector.enum";

// NDC (Nationally Determined Contribution) achievement tracking - yearly
// baseline/target/achieved emissions figures recorded by DNA/Ministry per
// sector, publicly viewable to show national emission-reduction target
// progress. Pre-release: all figures are dummy placeholder data entered
// through this form, never hardcoded in source.
@Entity()
export class NdcTargetEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column({
    type: "enum",
    enum: NdcSector,
    array: false,
  })
  sector: NdcSector;

  @Column({ type: "decimal", precision: 18, scale: 2 })
  baselineEmissions: number;

  @Column({ type: "decimal", precision: 18, scale: 2 })
  targetEmissions2030: number;

  // Verified emission level for the year - reduction achieved is derived
  // as baselineEmissions - achievedEmissions. Historically the only
  // figure recorded; now paired with claimedEmissions below.
  @Column({ type: "decimal", precision: 18, scale: 2 })
  achievedEmissions: number;

  // Claimed (self-reported, pre-verification) emission level for the
  // year, distinct from the verified achievedEmissions above - mirrors
  // SRN's claimed vs verified mitigation-action series. Nullable so
  // existing/older records recorded before this distinction existed
  // remain valid; a null value means claimed was never entered
  // separately from verified.
  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  claimedEmissions: number | null;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  updatedAt: number;

  @Column({ type: "int", default: 1 })
  version: number;

  @Column({ type: "int", nullable: true })
  versionGroupId: number | null;

  @Column({ type: "int", nullable: true })
  supersedesId: number | null;

  @Column({ type: "boolean", default: true })
  published: boolean;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  archivedAt: number | null;

  @Column({ type: "int", nullable: true })
  createdBy: number | null;

  @Column({ type: "int", nullable: true })
  updatedBy: number | null;

  @Column({ type: "int", nullable: true })
  archivedBy: number | null;

  @BeforeInsert()
  setCreatedAt() {
    const timestamp = new Date().getTime();
    this.createdAt = timestamp;
    this.updatedAt = timestamp;
    this.version ??= 1;
    this.published ??= true;
  }
}
