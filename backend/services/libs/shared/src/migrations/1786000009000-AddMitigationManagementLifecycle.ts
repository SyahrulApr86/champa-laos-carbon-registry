import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMitigationManagementLifecycle1786000009000 implements MigrationInterface {
  name = "AddMitigationManagementLifecycle1786000009000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ["ndc_target_entity", "recognized_mitigation_entity", "redd_plus_entity"]) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "versionGroupId" integer`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "supersedesId" integer`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "published" boolean NOT NULL DEFAULT true`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "archivedAt" bigint`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "createdBy" integer`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "updatedBy" integer`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "archivedBy" integer`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ["redd_plus_entity", "recognized_mitigation_entity", "ndc_target_entity"]) {
      for (const column of ["archivedBy", "updatedBy", "createdBy", "archivedAt", "published", "supersedesId", "versionGroupId", "version"]) {
        await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"`);
      }
    }
  }
}
