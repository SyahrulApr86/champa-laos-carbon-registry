import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds lifecycle and actor fields for the adaptation and community
 * registries. All new fields are nullable so existing synthetic/demo rows
 * remain valid and retain their original provenance.
 */
export class AddAdaptationCommunityManagementFields1786000002000
  implements MigrationInterface
{
  name = "AddAdaptationCommunityManagementFields1786000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."adaptation_project_entity_currentStage_enum" ADD VALUE IF NOT EXISTS 'Archived'`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."community_program_entity_status_enum" ADD VALUE IF NOT EXISTS 'Archived'`
    );

    for (const table of ["adaptation_project_entity", "community_program_entity"]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "createdByUserId" integer`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "updatedByUserId" integer`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "archivedAt" bigint`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "archivedByUserId" integer`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "archiveReason" text`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ["community_program_entity", "adaptation_project_entity"]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "archiveReason"`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "archivedByUserId"`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "archivedAt"`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "updatedByUserId"`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "createdByUserId"`
      );
    }
    // PostgreSQL does not support removing an enum value safely. The added
    // label is harmless once no rows use it and is intentionally retained.
  }
}
