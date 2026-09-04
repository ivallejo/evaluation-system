import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEvaluationTable1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE evaluations (
        id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        person_id                   UUID NOT NULL REFERENCES persons(id),
        trainer_id                  UUID REFERENCES trainers(id),
        evaluation_date             DATE NOT NULL,
        objective                   TEXT,
        training_level              VARCHAR,
        pre_existing_injuries       TEXT,
        important_medical_diagnosis TEXT,
        other_comments              TEXT,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE evaluations`);
  }
}
