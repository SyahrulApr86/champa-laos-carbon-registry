import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { Sector } from "../enum/sector.enum";
import { MethodologyStatus } from "../enum/methodology.status.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Directory of approved GHG accounting methodologies (e.g. equivalent to the
// SRN "Direktori Metodologi"). Each entry references the methodology number
// assigned by its issuing body (source), the sector/category it applies to
// and whether it is currently in force.
@Entity()
export class MethodologyEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  methodologyNumber: string;

  @Column()
  name: string;

  // The body that established/approved this methodology
  // (e.g. "Ministry of Agriculture and Environment (MAE)", "UNFCCC", "DNA").
  @Column()
  source: string;

  @Column({
    type: "enum",
    enum: Sector,
    array: false,
  })
  category: Sector;

  @Column({
    type: "enum",
    enum: MethodologyStatus,
    array: false,
    default: MethodologyStatus.ACTIVE,
  })
  status: MethodologyStatus;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "bigint", transformer: NumberTransformer })
  createdAt: number;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  updatedAt: number;

  // Actor references are intentionally nullable so existing and synthetic
  // seed records remain valid. Admin mutations populate them for auditability.
  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  archivedAt: number;

  @Column({ nullable: true })
  archivedBy: number;

  @BeforeInsert()
  setCreatedAt() {
    const timestamp = new Date().getTime();
    this.createdAt = timestamp;
    this.updatedAt = timestamp;
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date().getTime();
  }
}
