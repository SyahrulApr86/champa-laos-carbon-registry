import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { Sector } from "../enum/sector.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { RecognizedMitigationStatus } from "../enum/recognized.mitigation.status.enum";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Recognized Mitigation Actions - a registry for smaller-scale/
// community-level mitigation activities (e.g. a village-level fuel
// switch, a district-level waste-to-resource pilot) that are formally
// recognized by the DNA/Ministry but do not go through the full
// Programme certification track (registration, MRV, third-party
// validation/verification, credit issuance). Mirrors the smaller-scale
// recognized-action registry Indonesia's SRN exposes as a distinct child
// tab alongside its main Mitigation project registry. Recorded by
// DNA/Ministry, publicly viewable in the registry.
@Entity()
export class RecognizedMitigationEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  referenceId: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column()
  proponentName: string;

  // Reuses the platform's existing CompanyRole categories (Project
  // Developer, DNA, Ministry, etc.) rather than inventing SRN's
  // presentational proponent-type taxonomy (Central Government, Local
  // Government, Business, Institution/Agency, Development Partner, NGO,
  // Community) that this system's data model doesn't track.
  @Column({
    type: "enum",
    enum: CompanyRole,
    array: false,
  })
  proponentType: CompanyRole;

  // Optional link when the proponent is also a registered platform
  // company; many recognized proponents (e.g. a district government
  // office or a village community) are not registered platform accounts
  // at all, so this is intentionally nullable.
  @Column({ type: "int", nullable: true })
  proponentCompanyId: number;

  @Column({
    type: "enum",
    enum: Sector,
    array: false,
  })
  sector: Sector;

  @Column()
  region: string;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true, transformer: NumberTransformer })
  estimatedReductionTco2e: number;

  @Column({
    type: "enum",
    enum: RecognizedMitigationStatus,
    array: false,
    default: RecognizedMitigationStatus.SUBMITTED,
  })
  status: RecognizedMitigationStatus;

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
