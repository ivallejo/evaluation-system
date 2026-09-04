import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEvaluationMeasurementTable1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE evaluation_measurements (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        evaluation_id       UUID NOT NULL REFERENCES evaluations(id),
        measurement_type_id UUID NOT NULL REFERENCES measurement_types(id),
        value               NUMERIC(6,2) NOT NULL,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (evaluation_id, measurement_type_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE evaluation_measurements`);
  }
}
