import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBodyCompositionTable1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE body_compositions (
        id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        evaluation_id             UUID NOT NULL UNIQUE REFERENCES evaluations(id),
        weight_kg                 NUMERIC(6,2) NOT NULL CHECK (weight_kg > 0),
        height_m                  NUMERIC(4,3) NOT NULL CHECK (height_m > 0),
        bmi                       NUMERIC(5,2),
        body_fat_percentage       NUMERIC(5,2) CHECK (body_fat_percentage BETWEEN 0 AND 100),
        muscle_mass_percentage    NUMERIC(5,2) CHECK (muscle_mass_percentage BETWEEN 0 AND 100),
        ideal_weight_kg           NUMERIC(6,2),
        ideal_bmi                 NUMERIC(5,2),
        ideal_body_fat_percentage NUMERIC(5,2),
        created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE body_compositions`);
  }
}
