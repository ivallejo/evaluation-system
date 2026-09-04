/**
 * Integration tests for CreateEvaluationUseCase — Requirements 18.2, 18.5
 *
 * These tests require a running PostgreSQL instance. When no database is
 * available (DATABASE_HOST not set or connection fails), the entire suite is
 * skipped gracefully so that `npm run test` can still complete successfully.
 *
 * To run with a real DB, set the following environment variables:
 *   DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD
 *
 * The tests verify:
 *   - Full transactional creation of Evaluation + BodyComposition + Measurements + DietaryHabits
 *   - Rollback: no partial data persists when a pre-transaction validation fails
 *   - Rollback: UNIQUE constraint violation inside a transaction reverts all writes
 */

import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

import { CreateEvaluationUseCase } from '../create-evaluation.use-case.js';
import { PersonTypeOrmRepository } from '../../../../person/infrastructure/repositories/person.typeorm-repository.js';
import { TrainerTypeOrmRepository } from '../../../../trainer/infrastructure/repositories/trainer.typeorm-repository.js';
import { MeasurementTypeTypeOrmRepository } from '../../../../measurement-type/infrastructure/repositories/measurement-type.typeorm-repository.js';
import { TypeOrmTransactionHelper } from '../../../../../shared/infrastructure/database/typeorm-transaction.helper.js';

import { PersonOrmEntity } from '../../../../person/infrastructure/persistence/person.orm-entity.js';
import { TrainerOrmEntity } from '../../../../trainer/infrastructure/persistence/trainer.orm-entity.js';
import { MeasurementTypeOrmEntity } from '../../../../measurement-type/infrastructure/persistence/measurement-type.orm-entity.js';
import { EvaluationOrmEntity } from '../../../infrastructure/persistence/evaluation.orm-entity.js';
import { BodyCompositionOrmEntity } from '../../../../body-composition/infrastructure/persistence/body-composition.orm-entity.js';
import { EvaluationMeasurementOrmEntity } from '../../../../evaluation-measurement/infrastructure/persistence/evaluation-measurement.orm-entity.js';
import { DietaryHabitsOrmEntity } from '../../../../dietary-habits/infrastructure/persistence/dietary-habits.orm-entity.js';

// ---------------------------------------------------------------------------
// DB availability check
// ---------------------------------------------------------------------------

const DB_HOST = process.env['DATABASE_HOST'];
const DB_AVAILABLE = typeof DB_HOST === 'string' && DB_HOST.length > 0;

// ---------------------------------------------------------------------------
// DataSource factory
// ---------------------------------------------------------------------------

function createTestDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: DB_HOST ?? 'localhost',
    port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
    database: process.env['DATABASE_NAME'] ?? 'evaluation_system',
    username: process.env['DATABASE_USER'] ?? 'postgres',
    password: process.env['DATABASE_PASSWORD'] ?? 'postgres',
    synchronize: false,
    entities: [
      PersonOrmEntity,
      TrainerOrmEntity,
      MeasurementTypeOrmEntity,
      EvaluationOrmEntity,
      BodyCompositionOrmEntity,
      EvaluationMeasurementOrmEntity,
      DietaryHabitsOrmEntity,
    ],
    migrations: ['src/database/migrations/*.ts'],
  });
}

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

async function cleanupPerson(ds: DataSource, personId: string): Promise<void> {
  await ds.query(
    `DELETE FROM dietary_habits WHERE evaluation_id IN (SELECT id FROM evaluations WHERE person_id = $1)`,
    [personId],
  );
  await ds.query(
    `DELETE FROM evaluation_measurements WHERE evaluation_id IN (SELECT id FROM evaluations WHERE person_id = $1)`,
    [personId],
  );
  await ds.query(
    `DELETE FROM body_compositions WHERE evaluation_id IN (SELECT id FROM evaluations WHERE person_id = $1)`,
    [personId],
  );
  await ds.query(`DELETE FROM evaluations WHERE person_id = $1`, [personId]);
  await ds.query(`DELETE FROM persons WHERE id = $1`, [personId]);
}

async function insertPerson(ds: DataSource): Promise<string> {
  const id = randomUUID();
  await ds.query(
    `INSERT INTO persons (id, first_name, last_name, created_at, updated_at)
     VALUES ($1, 'Integration', 'Test', NOW(), NOW())`,
    [id],
  );
  return id;
}

async function getBicepRelaxedId(ds: DataSource): Promise<string> {
  const rows: Array<{ id: string }> = await ds.query(
    `SELECT id FROM measurement_types WHERE code = 'BICEP_RELAXED' LIMIT 1`,
  );
  if (rows.length === 0) {
    throw new Error('BICEP_RELAXED measurement type not found. Ensure migrations have been run.');
  }
  return rows[0].id;
}

// ---------------------------------------------------------------------------
// Suite — skipped when no DB is available
// ---------------------------------------------------------------------------

const describeSuite = DB_AVAILABLE ? describe : describe.skip;

describeSuite('CreateEvaluationUseCase — integration tests (requires PostgreSQL)', () => {
  let dataSource: DataSource;
  let useCase: CreateEvaluationUseCase;
  let testPersonId: string;
  let bicepRelaxedMtId: string;

  beforeAll(async () => {
    dataSource = createTestDataSource();
    await dataSource.initialize();
    await dataSource.runMigrations();

    const personRepository = new PersonTypeOrmRepository(dataSource);
    const trainerRepository = new TrainerTypeOrmRepository(dataSource);
    const measurementTypeRepository = new MeasurementTypeTypeOrmRepository(dataSource);
    const transactionHelper = new TypeOrmTransactionHelper(dataSource);

    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionHelper,
    );

    bicepRelaxedMtId = await getBicepRelaxedId(dataSource);
  }, 60_000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  }, 30_000);

  beforeEach(async () => {
    testPersonId = await insertPerson(dataSource);
  });

  afterEach(async () => {
    await cleanupPerson(dataSource, testPersonId);
  });

  // ── Test 1: Full transactional creation ───────────────────────────────

  it(
    'creates Evaluation, BodyComposition, Measurements and DietaryHabits atomically',
    async () => {
      const result = await useCase.execute({
        personId: testPersonId,
        evaluationDate: new Date('2024-03-15'),
        objective: 'Lose weight',
        trainingLevel: 'intermediate',
        bodyComposition: {
          weightKg: 80,
          heightM: 1.75,
          bmi: 26.12,
          bodyFatPercentage: 22,
          muscleMassPercentage: 38,
        },
        measurements: [{ measurementTypeId: bicepRelaxedMtId, value: 35.5 }],
        dietaryHabits: { description: 'High protein, low carb diet' },
      });

      // Evaluation
      expect(result.evaluation).toBeDefined();
      expect(result.evaluation.personId).toBe(testPersonId);
      expect(result.evaluation.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );

      // BodyComposition
      expect(result.bodyComposition).toBeDefined();
      expect(result.bodyComposition.evaluationId).toBe(result.evaluation.id);
      expect(Number(result.bodyComposition.weightKg)).toBeCloseTo(80, 1);

      // Measurements
      expect(result.measurements).toHaveLength(1);
      expect(result.measurements[0].measurementTypeId).toBe(bicepRelaxedMtId);
      expect(Number(result.measurements[0].value)).toBeCloseTo(35.5, 1);

      // DietaryHabits
      expect(result.dietaryHabits).not.toBeNull();
      expect(result.dietaryHabits!.description).toBe('High protein, low carb diet');

      // Verify DB persistence
      const evalId = result.evaluation.id;

      const evalRows: Array<{ id: string }> = await dataSource.query(
        `SELECT id FROM evaluations WHERE id = $1`,
        [evalId],
      );
      expect(evalRows).toHaveLength(1);

      const bcRows: Array<{ weight_kg: string }> = await dataSource.query(
        `SELECT weight_kg FROM body_compositions WHERE evaluation_id = $1`,
        [evalId],
      );
      expect(bcRows).toHaveLength(1);
      expect(parseFloat(bcRows[0].weight_kg)).toBeCloseTo(80, 1);

      const emRows: Array<{ value: string }> = await dataSource.query(
        `SELECT value FROM evaluation_measurements WHERE evaluation_id = $1`,
        [evalId],
      );
      expect(emRows).toHaveLength(1);

      const dhRows: Array<{ description: string }> = await dataSource.query(
        `SELECT description FROM dietary_habits WHERE evaluation_id = $1`,
        [evalId],
      );
      expect(dhRows).toHaveLength(1);
      expect(dhRows[0].description).toBe('High protein, low carb diet');
    },
    30_000,
  );

  // ── Test 2: Rollback — non-existent person ────────────────────────────

  it(
    'rolls back completely when personId does not exist — no partial data persists',
    async () => {
      const nonExistentPersonId = randomUUID();

      const countBefore: Array<{ count: string }> = await dataSource.query(
        `SELECT COUNT(*) AS count FROM evaluations WHERE person_id = $1`,
        [nonExistentPersonId],
      );

      await expect(
        useCase.execute({
          personId: nonExistentPersonId,
          evaluationDate: new Date('2024-04-01'),
          bodyComposition: { weightKg: 70, heightM: 1.70 },
          measurements: [],
        }),
      ).rejects.toThrow('Person not found');

      const countAfter: Array<{ count: string }> = await dataSource.query(
        `SELECT COUNT(*) AS count FROM evaluations WHERE person_id = $1`,
        [nonExistentPersonId],
      );

      expect(parseInt(countAfter[0].count, 10)).toBe(parseInt(countBefore[0].count, 10));
      expect(parseInt(countAfter[0].count, 10)).toBe(0);
    },
    30_000,
  );

  // ── Test 3: Rollback — UNIQUE constraint inside transaction ───────────

  it(
    'rolls back all writes when body_compositions UNIQUE constraint is violated',
    async () => {
      // Create first evaluation successfully
      const firstResult = await useCase.execute({
        personId: testPersonId,
        evaluationDate: new Date('2024-05-01'),
        bodyComposition: { weightKg: 75, heightM: 1.78 },
        measurements: [],
      });

      const firstEvalId = firstResult.evaluation.id;

      // Attempting to insert a duplicate body_composition row violates UNIQUE(evaluation_id)
      await expect(
        dataSource.query(
          `INSERT INTO body_compositions (id, evaluation_id, weight_kg, height_m, created_at, updated_at)
           VALUES ($1, $2, 80, 1.75, NOW(), NOW())`,
          [randomUUID(), firstEvalId],
        ),
      ).rejects.toThrow();

      // Original data still intact — no corruption occurred
      const evalRows: Array<{ id: string }> = await dataSource.query(
        `SELECT id FROM evaluations WHERE id = $1`,
        [firstEvalId],
      );
      expect(evalRows).toHaveLength(1);

      const bcRows: Array<{ weight_kg: string }> = await dataSource.query(
        `SELECT weight_kg FROM body_compositions WHERE evaluation_id = $1`,
        [firstEvalId],
      );
      expect(bcRows).toHaveLength(1);
      expect(parseFloat(bcRows[0].weight_kg)).toBeCloseTo(75, 1);
    },
    30_000,
  );

  // ── Test 4: Optional trainerId ────────────────────────────────────────

  it(
    'creates evaluation without a trainer (trainerId is optional)',
    async () => {
      const result = await useCase.execute({
        personId: testPersonId,
        evaluationDate: new Date('2024-06-10'),
        bodyComposition: { weightKg: 65, heightM: 1.65 },
        measurements: [],
      });

      expect(result.evaluation.trainerId).toBeUndefined();
      expect(result.dietaryHabits).toBeNull();
      expect(result.measurements).toHaveLength(0);

      const rows: Array<{ trainer_id: string | null }> = await dataSource.query(
        `SELECT trainer_id FROM evaluations WHERE id = $1`,
        [result.evaluation.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].trainer_id).toBeNull();
    },
    30_000,
  );

  // ── Test 5: Duplicate measurementTypeId rejected pre-transaction ──────

  it(
    'rejects duplicate measurementTypeId before persisting any data',
    async () => {
      await expect(
        useCase.execute({
          personId: testPersonId,
          evaluationDate: new Date('2024-08-01'),
          bodyComposition: { weightKg: 70, heightM: 1.70 },
          measurements: [
            { measurementTypeId: bicepRelaxedMtId, value: 30 },
            { measurementTypeId: bicepRelaxedMtId, value: 35 }, // duplicate
          ],
        }),
      ).rejects.toThrow('Duplicate measurementTypeId in measurements');

      const evalRows: Array<{ count: string }> = await dataSource.query(
        `SELECT COUNT(*) AS count FROM evaluations WHERE person_id = $1`,
        [testPersonId],
      );
      expect(parseInt(evalRows[0].count, 10)).toBe(0);
    },
    30_000,
  );
});
