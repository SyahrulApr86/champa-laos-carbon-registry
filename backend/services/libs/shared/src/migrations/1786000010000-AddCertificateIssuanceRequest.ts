import { MigrationInterface, QueryRunner } from "typeorm";

/** Project Developer -> DNA request/approve queue that mints a certificate_lot on approval. */
export class AddCertificateIssuanceRequest1786000010000 implements MigrationInterface {
  name = "AddCertificateIssuanceRequest1786000010000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."certificate_issuance_request_status_enum" AS ENUM('Pending', 'Approved', 'Rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "certificate_issuance_request" ("id" text NOT NULL, "creditBlockId" text NOT NULL, "serialNumber" text NOT NULL, "projectRefId" text NOT NULL, "companyId" bigint NOT NULL, "requestedQuantity" numeric(18,6) NOT NULL, "status" "public"."certificate_issuance_request_status_enum" NOT NULL DEFAULT 'Pending', "certificateLotId" text, "certificateId" text, "requestedBy" bigint NOT NULL, "requestedAt" bigint NOT NULL, "reviewedBy" bigint, "reviewedAt" bigint, "remarks" text, CONSTRAINT "PK_certificate_issuance_request" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_certificate_issuance_request_company" ON "certificate_issuance_request" ("companyId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_certificate_issuance_request_credit_block" ON "certificate_issuance_request" ("creditBlockId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_certificate_issuance_request_credit_block"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_certificate_issuance_request_company"`);
    await queryRunner.query(`DROP TABLE "certificate_issuance_request"`);
    await queryRunner.query(`DROP TYPE "public"."certificate_issuance_request_status_enum"`);
  }
}
