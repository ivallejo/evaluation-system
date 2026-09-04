import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMeasurementTypes1700000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO measurement_types (id, code, name, unit, category, active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'BICEP_RELAXED',    'Bícep Relajado',  'cm', 'superior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'BICEP_CONTRACTED', 'Bícep Contraído', 'cm', 'superior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'FOREARM',          'Antebrazo',       'cm', 'superior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'WRIST',            'Muñeca',          'cm', 'superior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'NECK',             'Cuello',          'cm', 'superior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'CHEST',            'Pecho',           'cm', 'superior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'ABDOMEN',          'Abdomen',         'cm', 'inferior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'WAIST',            'Cintura',         'cm', 'inferior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'HIPS',             'Caderas',         'cm', 'inferior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'THIGH',            'Muslo',           'cm', 'inferior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'THIGH_MINUS_1CM',  'Muslo menos 1cm', 'cm', 'inferior', TRUE, NOW(), NOW()),
        (gen_random_uuid(), 'CALF',             'Pantorrilla',     'cm', 'inferior', TRUE, NOW(), NOW())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM measurement_types
      WHERE code IN (
        'BICEP_RELAXED', 'BICEP_CONTRACTED', 'FOREARM', 'WRIST', 'NECK', 'CHEST',
        'ABDOMEN', 'WAIST', 'HIPS', 'THIGH', 'THIGH_MINUS_1CM', 'CALF'
      )
    `);
  }
}
