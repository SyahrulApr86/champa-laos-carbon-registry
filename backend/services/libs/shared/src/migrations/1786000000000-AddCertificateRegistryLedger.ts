import { MigrationInterface, QueryRunner } from "typeorm";

/** Canonical certificate-lot/portion/event ledger; legacy Programme arrays remain untouched. */
export class AddCertificateRegistryLedger1786000000000 implements MigrationInterface {
  name = "AddCertificateRegistryLedger1786000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."certificate_portion_state_enum" AS ENUM('AVAILABLE', 'ASSIGNED_TO_EXCHANGE', 'WITHHELD', 'RETIRED', 'CANCELLED', 'BUFFER')`);
    await queryRunner.query(`CREATE TYPE "public"."certificate_ledger_event_type_enum" AS ENUM('ISSUED', 'TRANSFERRED', 'RETIRED', 'CANCELLED', 'ASSIGNED_TO_EXCHANGE', 'UNASSIGNED_FROM_EXCHANGE', 'WITHHELD', 'RELEASED', 'REVERSED')`);
    await queryRunner.query(`CREATE TYPE "public"."public_availability_enum" AS ENUM('available', 'withheld', 'not_available', 'not_applicable', 'not_configured')`);
    await queryRunner.query(`CREATE TABLE "certificate_lot" ("certificateLotId" varchar(96) NOT NULL, "programmeId" varchar(96) NOT NULL, "certificateId" varchar(128) NOT NULL, "registryScheme" varchar(160) NOT NULL DEFAULT 'Champa Certificate Registry', "registryNumber" varchar(128), "serialNumber" varchar(128), "vintageStart" date, "vintageEnd" date, "issuedQuantity" numeric(18,6) NOT NULL, "unit" varchar(32) NOT NULL DEFAULT 'tCO2e', "issuedAt" TIMESTAMP WITH TIME ZONE, "provenance" jsonb NOT NULL DEFAULT '{}', "publicFields" jsonb NOT NULL DEFAULT '{}', "asOf" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_certificate_lot" PRIMARY KEY ("certificateLotId"), CONSTRAINT "UQ_certificate_lot_certificate_id" UNIQUE ("certificateId"))`);
    await queryRunner.query(`CREATE INDEX "IDX_certificate_lot_programme" ON "certificate_lot" ("programmeId")`);
    await queryRunner.query(`CREATE TABLE "certificate_portion" ("certificatePortionId" varchar(128) NOT NULL, "certificateLotId" varchar(96) NOT NULL, "parentPortionId" varchar(128), "ownerCompanyId" bigint, "state" "public"."certificate_portion_state_enum" NOT NULL, "quantity" numeric(18,6) NOT NULL, "withheldReason" varchar(120), "asOf" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_certificate_portion" PRIMARY KEY ("certificatePortionId"), CONSTRAINT "CHK_certificate_portion_nonnegative" CHECK ("quantity" >= 0))`);
    await queryRunner.query(`CREATE INDEX "IDX_certificate_portion_lot_state" ON "certificate_portion" ("certificateLotId", "state")`);
    await queryRunner.query(`CREATE TABLE "certificate_ledger_event" ("eventId" varchar(128) NOT NULL, "idempotencyKey" varchar(160) NOT NULL, "certificateLotId" varchar(96) NOT NULL, "sourcePortionId" varchar(128), "parentEventId" varchar(128), "eventType" "public"."certificate_ledger_event_type_enum" NOT NULL, "quantity" numeric(18,6) NOT NULL, "unit" varchar(32) NOT NULL, "fromOwnerCompanyId" bigint, "toOwnerCompanyId" bigint, "fromState" "public"."certificate_portion_state_enum", "toState" "public"."certificate_portion_state_enum", "effectiveAt" TIMESTAMP WITH TIME ZONE NOT NULL, "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "actorReference" varchar(160), "reason" text, "sourceType" varchar(40) NOT NULL DEFAULT 'synthetic_demo', "asOf" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_certificate_ledger_event" PRIMARY KEY ("eventId"), CONSTRAINT "UQ_certificate_ledger_event_idempotency" UNIQUE ("idempotencyKey"), CONSTRAINT "CHK_certificate_ledger_event_positive" CHECK ("quantity" > 0))`);
    await queryRunner.query(`CREATE INDEX "IDX_certificate_ledger_event_lot_effective" ON "certificate_ledger_event" ("certificateLotId", "effectiveAt")`);
    await queryRunner.query(`CREATE TABLE "programme_public_profile" ("programmeId" varchar(96) NOT NULL, "goals" text, "actionSummary" text, "vulnerabilitySummary" text, "vulnerabilityAvailability" "public"."public_availability_enum" NOT NULL DEFAULT 'not_configured', "provenance" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_programme_public_profile" PRIMARY KEY ("programmeId"))`);
    await queryRunner.query(`CREATE TABLE "programme_workflow_milestone" ("milestoneId" varchar(128) NOT NULL, "programmeId" varchar(96) NOT NULL, "sequence" integer NOT NULL, "milestoneKey" varchar(96) NOT NULL, "label" varchar(160) NOT NULL, "status" varchar(48) NOT NULL, "availability" "public"."public_availability_enum" NOT NULL DEFAULT 'not_configured', "occurredAt" TIMESTAMP WITH TIME ZONE, "publicSummary" text, CONSTRAINT "PK_programme_workflow_milestone" PRIMARY KEY ("milestoneId"), CONSTRAINT "UQ_programme_workflow_milestone_sequence" UNIQUE ("programmeId", "sequence"))`);
    await queryRunner.query(`CREATE TABLE "programme_public_document" ("publicDocumentId" varchar(128) NOT NULL, "programmeId" varchar(96) NOT NULL, "title" varchar(200) NOT NULL, "category" varchar(80) NOT NULL, "availability" "public"."public_availability_enum" NOT NULL, "publicUrl" varchar(500), "withheldReason" varchar(120), CONSTRAINT "PK_programme_public_document" PRIMARY KEY ("publicDocumentId"))`);
    await queryRunner.query(`CREATE INDEX "IDX_programme_public_document_availability" ON "programme_public_document" ("programmeId", "availability")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_programme_public_document_availability"`);
    await queryRunner.query(`DROP TABLE "programme_public_document"`);
    await queryRunner.query(`DROP TABLE "programme_workflow_milestone"`);
    await queryRunner.query(`DROP TABLE "programme_public_profile"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_certificate_ledger_event_lot_effective"`);
    await queryRunner.query(`DROP TABLE "certificate_ledger_event"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_certificate_portion_lot_state"`);
    await queryRunner.query(`DROP TABLE "certificate_portion"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_certificate_lot_programme"`);
    await queryRunner.query(`DROP TABLE "certificate_lot"`);
    await queryRunner.query(`DROP TYPE "public"."public_availability_enum"`);
    await queryRunner.query(`DROP TYPE "public"."certificate_ledger_event_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."certificate_portion_state_enum"`);
  }
}
