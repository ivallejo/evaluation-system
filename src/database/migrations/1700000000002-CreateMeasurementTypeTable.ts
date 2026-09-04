import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMeasurementTypeTable1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE measurement_types (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code       VARCHAR NOT NULL UNIQUE,
        name       VARCHAR NOT NULL,
        unit       VARCHAR NOT NULL,
        category   VARCHAR NOT NULL CHECK (category IN ('superior', 'inferior')),
        active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE measurement_types`);
  }
}
