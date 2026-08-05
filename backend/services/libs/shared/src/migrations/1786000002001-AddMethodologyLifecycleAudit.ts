import { MigrationInterface, QueryRunner } from "typeorm";

/** Preserve methodology rows while recording the actors and time of lifecycle changes. */
export class AddMethodologyLifecycleAudit1786000002001
  implements MigrationInterface
{
  name = "AddMethodologyLifecycleAudit1786000002001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "methodology_entity" ADD COLUMN IF NOT EXISTS "createdBy" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "methodology_entity" ADD COLUMN IF NOT EXISTS "updatedBy" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "methodology_entity" ADD COLUMN IF NOT EXISTS "archivedAt" bigint`
    );
    await queryRunner.query(
      `ALTER TABLE "methodology_entity" ADD COLUMN IF NOT EXISTS "archivedBy" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "methodology_entity" DROP COLUMN IF EXISTS "archivedBy"`
    );
    await queryRunner.query(
      `ALTER TABLE "methodology_entity" DROP COLUMN IF EXISTS "archivedAt"`
    );
    await queryRunner.query(
      `ALTER TABLE "methodology_entity" DROP COLUMN IF EXISTS "updatedBy"`
    );
    await queryRunner.query(
      `ALTER TABLE "methodology_entity" DROP COLUMN IF EXISTS "createdBy"`
    );
  }
}
