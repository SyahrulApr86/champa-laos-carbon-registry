import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmissionTradingLifecycle1786000005000 implements MigrationInterface {
  name = "AddEmissionTradingLifecycle1786000005000";

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ["emission_ceiling_entity", "emission_participant_entity"]) {
      for (const sql of [
        `ADD COLUMN IF NOT EXISTS "lifecycleStatus" varchar DEFAULT 'active'`,
        `ADD COLUMN IF NOT EXISTS "lifecycleReason" varchar`,
        `ADD COLUMN IF NOT EXISTS "updatedAt" bigint`,
        `ADD COLUMN IF NOT EXISTS "createdBy" integer`,
        `ADD COLUMN IF NOT EXISTS "updatedBy" integer`,
        `ADD COLUMN IF NOT EXISTS "archivedAt" bigint`,
        `ADD COLUMN IF NOT EXISTS "archivedBy" integer`,
        `ADD COLUMN IF NOT EXISTS "lifecycleHistory" jsonb`,
      ]) await queryRunner.query(`ALTER TABLE "${table}" ${sql}`);
    }
    for (const sql of [
      `ADD COLUMN IF NOT EXISTS "currency" varchar DEFAULT 'LAK'`,
      `ADD COLUMN IF NOT EXISTS "lifecycleStatus" varchar DEFAULT 'active'`,
      `ADD COLUMN IF NOT EXISTS "lifecycleReason" varchar`,
      `ADD COLUMN IF NOT EXISTS "updatedAt" bigint`,
      `ADD COLUMN IF NOT EXISTS "createdBy" integer`,
      `ADD COLUMN IF NOT EXISTS "updatedBy" integer`,
      `ADD COLUMN IF NOT EXISTS "reversalOfTradeId" integer`,
      `ADD COLUMN IF NOT EXISTS "lifecycleHistory" jsonb`,
    ]) await queryRunner.query(`ALTER TABLE "emission_trading_entity" ${sql}`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ["emission_ceiling_entity", "emission_participant_entity"]) for (const column of ["lifecycleHistory", "archivedBy", "archivedAt", "updatedBy", "createdBy", "updatedAt", "lifecycleReason", "lifecycleStatus"]) await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"`);
    for (const column of ["lifecycleHistory", "reversalOfTradeId", "updatedBy", "createdBy", "updatedAt", "lifecycleReason", "lifecycleStatus", "currency"]) await queryRunner.query(`ALTER TABLE "emission_trading_entity" DROP COLUMN IF EXISTS "${column}"`);
  }
}
