import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { PublicAvailability } from "../enum/certificate.ledger.enum";

@Entity({ name: "programme_public_document" })
@Index(["programmeId", "availability"])
export class ProgrammePublicDocument {
  @PrimaryColumn({ type: "varchar", length: 128 })
  publicDocumentId: string;

  @Column({ type: "varchar", length: 96 })
  programmeId: string;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @Column({ type: "varchar", length: 80 })
  category: string;

  @Column({ type: "enum", enum: PublicAvailability, enumName: "public_availability_enum" })
  availability: PublicAvailability;

  @Column({ type: "varchar", length: 500, nullable: true })
  publicUrl: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  withheldReason: string | null;
}
