import { MigrationInterface, QueryRunner } from "typeorm";

/** Adds reversible archive metadata for the public resource source tables. */
export class AddResourceManagementLifecycle1786000004000
  implements MigrationInterface
{
  name = "AddResourceManagementLifecycle1786000004000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      "climate_finance_entity",
      "technology_transfer_entity",
      "capacity_building_entity",
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "archivedAt" bigint`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "archiveReason" text`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      "capacity_building_entity",
      "technology_transfer_entity",
      "climate_finance_entity",
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "archiveReason"`
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "archivedAt"`
      );
    }
  }
}
