import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Optional certification profile for a Validation/Verification Agency
// (a Company with companyRole = INDEPENDENT_CERTIFIER), keyed by companyId.
// Kept as a small linked table rather than bloating the core Company
// entity, since these fields are specific to certifier agencies and most
// agencies will not have this populated yet - the public detail page shows
// an honest empty state until a profile row exists.
// Mirrors SRN Indonesia's LVV detail page: certificate number, validity
// period, scope coverage by sector, mitigation/reporting applicability, and
// configurable scheme eligibility.
@Entity()
export class CertifierProfileEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  companyId: number;

  @Column({ nullable: true })
  certificateNumber: string;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  certificateIssuedDate: number;

  @Column({ type: "bigint", transformer: NumberTransformer, nullable: true })
  certificateValidUntil: number;

  // Reuses the real Sector enum values (see enum/sector.enum.ts).
  @Column("varchar", { array: true, nullable: true })
  scopeSectors: string[];

  @Column({ nullable: true })
  appliesToDram: boolean;

  @Column({ nullable: true })
  appliesToLcam: boolean;

  @Column({ nullable: true })
  eligibleForSpei: boolean;

  @Column({ nullable: true })
  eligibleForPtbaePu: boolean;

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
