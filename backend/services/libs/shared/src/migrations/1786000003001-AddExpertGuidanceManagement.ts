import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpertGuidanceManagement1786000003001
  implements MigrationInterface
{
  name = "AddExpertGuidanceManagement1786000003001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expert_entity" ADD COLUMN IF NOT EXISTS "createdBy" integer`);
    await queryRunner.query(`ALTER TABLE "expert_entity" ADD COLUMN IF NOT EXISTS "updatedBy" integer`);
    await queryRunner.query(`ALTER TABLE "expert_entity" ADD COLUMN IF NOT EXISTS "archivedAt" bigint`);
    await queryRunner.query(`ALTER TABLE "expert_entity" ADD COLUMN IF NOT EXISTS "archivedBy" integer`);

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."guidance_document_entity_status_enum" AS ENUM('Draft', 'Published', 'Archived');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" ADD COLUMN IF NOT EXISTS "documentGroupId" integer`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" ADD COLUMN IF NOT EXISTS "status" "public"."guidance_document_entity_status_enum" NOT NULL DEFAULT 'Published'`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" ADD COLUMN IF NOT EXISTS "createdBy" integer`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" ADD COLUMN IF NOT EXISTS "updatedBy" integer`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" ADD COLUMN IF NOT EXISTS "publishedAt" bigint`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" ADD COLUMN IF NOT EXISTS "publishedBy" integer`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" ADD COLUMN IF NOT EXISTS "archivedAt" bigint`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" ADD COLUMN IF NOT EXISTS "archivedBy" integer`);
    await queryRunner.query(`UPDATE "guidance_document_entity" SET "documentGroupId" = "id" WHERE "documentGroupId" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" DROP COLUMN IF EXISTS "archivedBy"`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" DROP COLUMN IF EXISTS "archivedAt"`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" DROP COLUMN IF EXISTS "publishedBy"`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" DROP COLUMN IF EXISTS "publishedAt"`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" DROP COLUMN IF EXISTS "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" DROP COLUMN IF EXISTS "createdBy"`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" DROP COLUMN IF EXISTS "version"`);
    await queryRunner.query(`ALTER TABLE "guidance_document_entity" DROP COLUMN IF EXISTS "documentGroupId"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."guidance_document_entity_status_enum"`);
    await queryRunner.query(`ALTER TABLE "expert_entity" DROP COLUMN IF EXISTS "archivedBy"`);
    await queryRunner.query(`ALTER TABLE "expert_entity" DROP COLUMN IF EXISTS "archivedAt"`);
    await queryRunner.query(`ALTER TABLE "expert_entity" DROP COLUMN IF EXISTS "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "expert_entity" DROP COLUMN IF EXISTS "createdBy"`);
  }
}
