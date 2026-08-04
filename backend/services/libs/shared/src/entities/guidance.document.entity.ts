import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NumberTransformer } from "../functions/number.transformer.decorator";

// Downloadable guidance/reference document (PDF, etc.) published under the
// Instruments > Module directory. Recorded by DNA/Ministry, publicly
// viewable in the registry. documentUrl may be an external link or a
// base64 data-URI upload (`data:<mimetype>;base64,<data>`), matching the
// convention used elsewhere in this codebase (e.g. programmeDto.designDocument).
// Mirrors SRN Indonesia's Instruments > Module page (title, subtitle/
// description, category, PDF type, download link).
@Entity()
export class GuidanceDocumentEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: "text" })
  documentUrl: string;

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
