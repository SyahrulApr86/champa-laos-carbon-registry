import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Public-facing metadata for the configurable emissions-ceiling market.
 * These columns remain nullable so existing prototype rows are preserved and
 * are surfaced as not configured rather than being assigned invented values.
 */
export class AddEmissionTradingPublicFields1786000001000 implements MigrationInterface {
  name = "AddEmissionTradingPublicFields1786000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "emission_ceiling_entity" ADD COLUMN IF NOT EXISTS "unit" varchar`);
    await queryRunner.query(`ALTER TABLE "emission_ceiling_entity" ADD COLUMN IF NOT EXISTS "venueStatus" varchar`);
    await queryRunner.query(`ALTER TABLE "emission_ceiling_entity" ADD COLUMN IF NOT EXISTS "availability" varchar`);

    await queryRunner.query(`ALTER TABLE "emission_participant_entity" ADD COLUMN IF NOT EXISTS "seriesName" varchar`);
    await queryRunner.query(`ALTER TABLE "emission_participant_entity" ADD COLUMN IF NOT EXISTS "sector" varchar`);
    await queryRunner.query(`ALTER TABLE "emission_participant_entity" ADD COLUMN IF NOT EXISTS "participantStatus" varchar`);

    await queryRunner.query(`ALTER TABLE "emission_trading_entity" ADD COLUMN IF NOT EXISTS "seriesName" varchar`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" ADD COLUMN IF NOT EXISTS "ceilingAllocationId" integer`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" ADD COLUMN IF NOT EXISTS "venueStatus" varchar`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" ADD COLUMN IF NOT EXISTS "settlementStatus" varchar`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" ADD COLUMN IF NOT EXISTS "certificateBridgeEventId" varchar`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" ADD COLUMN IF NOT EXISTS "idempotencyKey" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" DROP COLUMN "idempotencyKey"`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" DROP COLUMN "certificateBridgeEventId"`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" DROP COLUMN "settlementStatus"`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" DROP COLUMN "venueStatus"`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" DROP COLUMN "ceilingAllocationId"`);
    await queryRunner.query(`ALTER TABLE "emission_trading_entity" DROP COLUMN "seriesName"`);

    await queryRunner.query(`ALTER TABLE "emission_participant_entity" DROP COLUMN "participantStatus"`);
    await queryRunner.query(`ALTER TABLE "emission_participant_entity" DROP COLUMN "sector"`);
    await queryRunner.query(`ALTER TABLE "emission_participant_entity" DROP COLUMN "seriesName"`);

    await queryRunner.query(`ALTER TABLE "emission_ceiling_entity" DROP COLUMN "availability"`);
    await queryRunner.query(`ALTER TABLE "emission_ceiling_entity" DROP COLUMN "venueStatus"`);
    await queryRunner.query(`ALTER TABLE "emission_ceiling_entity" DROP COLUMN "unit"`);
  }
}
