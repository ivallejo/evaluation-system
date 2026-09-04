import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainerTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE trainers (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR NOT NULL,
        last_name  VARCHAR NOT NULL,
        active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE trainers`);
  }
}
