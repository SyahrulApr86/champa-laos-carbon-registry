import { MigrationInterface, QueryRunner } from "typeorm";

/** Audit and archive metadata for authenticated certificate-lot management. */
export class AddCertificateRegistryManagement1786000002000 implements MigrationInterface {
  name = "AddCertificateRegistryManagement1786000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "certificate_lot" ADD COLUMN IF NOT EXISTS "createdBy" varchar(160)`);
    await queryRunner.query(`ALTER TABLE "certificate_lot" ADD COLUMN IF NOT EXISTS "updatedBy" varchar(160)`);
    await queryRunner.query(`ALTER TABLE "certificate_lot" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "certificate_lot" ADD COLUMN IF NOT EXISTS "archivedBy" varchar(160)`);
    await queryRunner.query(`ALTER TABLE "certificate_lot" ADD COLUMN IF NOT EXISTS "archiveReason" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "certificate_lot" DROP COLUMN IF EXISTS "archiveReason"`);
    await queryRunner.query(`ALTER TABLE "certificate_lot" DROP COLUMN IF EXISTS "archivedBy"`);
    await queryRunner.query(`ALTER TABLE "certificate_lot" DROP COLUMN IF EXISTS "archivedAt"`);
    await queryRunner.query(`ALTER TABLE "certificate_lot" DROP COLUMN IF EXISTS "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "certificate_lot" DROP COLUMN IF EXISTS "createdBy"`);
  }
}
