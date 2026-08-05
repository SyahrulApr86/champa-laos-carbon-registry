import { MigrationInterface, QueryRunner } from "typeorm";

// Adds the proponentCategory institutional-classification column to
// company (Government/Private Sector/NGO-Civil Society/Academia-Research/
// Community-Based Organisation/International Organisation). Nullable: only
// meaningful for PROJECT_DEVELOPER companies going forward, and rows
// imported from organisations.csv before this field existed are left
// unclassified rather than guessed at.
export class AddProponentCategoryToCompany1785906256000
  implements MigrationInterface
{
  name = "AddProponentCategoryToCompany1785906256000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."company_proponentcategory_enum" AS ENUM(
        'Government',
        'Private Sector',
        'NGO/Civil Society',
        'Academia/Research',
        'Community-Based Organisation',
        'International Organisation'
      )`
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "proponentCategory" "public"."company_proponentcategory_enum"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" DROP COLUMN "proponentCategory"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."company_proponentcategory_enum"`
    );
  }
}
