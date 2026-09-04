/**
 * Integration tests for GetProgressUseCase — Requirements 18.2, 18.5
 *
 * These tests require a running PostgreSQL instance. When no database is
 * available (DATABASE_HOST not set), the suite is skipped.
 *
 * Tests verify:
 *   - Progress records ordered ascending by evaluationDate across multiple evaluations
 *   - weightKg, bodyFatPercentage, muscleMassPercentage are null when evaluation has no BodyComposition
 *   - waist is null when evaluation has no WAIST EvaluationMeasurement
 *   - NotFoundException when person does not exist
 */

import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

import { GetProgressUseCase } from '../get-progress.use-case.js';
import { PersonTypeOrmRepository } from '../../../../person/infrastructure/repositories/person.typeorm-repository.js';
import { ProgressTypeOrmRepository } from '../../../../../shared/infrastructure/repositories/progress.typeorm-repository.js';
import { NotFoundException } from '../../../../../shared/domain/exceptions/not-found.exception.js';
import { PersonOrmEntity } from '../../../../person/infrastructure/persistence/person.orm-entity.js';

// ---------------------------------------------------------------------------
// DB availability check
// ---------------------------------------------------------------------------

const DB_HOST = process.env['DATABASE_HOST'];
const DB_AVAILABLE = typeof DB_HOST === 'string' && DB_HOST.length > 0;

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

async function insertPerson(
  ds: DataSource,
  data: { id: string; firstName: string; lastName: string },
): Promise<void> {
  await ds.query(
    `INSERT INTO persons (id, first_name, last_name, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [data.id, data.firstName, data.lastName],
  );
}

async function insertEvaluation(
  ds: DataSource,
  data: { id: string; personId: string; evaluationDate: string },
): Promise<void> {
  await ds.query(
    `INSERT INTO evaluations (id, person_id, evaluation_date, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [data.id, data.personId, data.evaluationDate],
  );
}

async function insertBodyComposition(
  ds: DataSource,
  data: {
    id: string;
    evaluationId: string;
    weightKg: number;
    heightM: number;
    bodyFatPercentage?: number;
    muscleMassPercentage?: number;
  },
): Promise<void> {
  await ds.query(
    `INSERT INTO body_compositions (id, evaluation_id, weight_kg, height_m, body_fat_percentage, muscle_mass_percentage, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [
      data.id,
      data.evaluationId,
      data.weightKg,
      data.heightM,
      data.bodyFatPercentage ?? null,
      data.muscleMassPercentage ?? null,
    ],
  );
}

async function insertMeasurement(
  ds: DataSource,
  evaluationId: string,
  measurementTypeId: string,
  value: number,
): Promise<void> {
  await ds.query(
    `INSERT INTO evaluation_measurements (id, evaluation_id, measurement_type_id, value, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [randomUUID(), evaluationId, measurementTypeId, value],
  );
}

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

// ---------------------------------------------------------------------------
// Suite — skipped when no DB is available
// ---------------------------------------------------------------------------

const describeSuite = DB_AVAILABLE ? describe : describe.skip;

describeSuite('GetProgressUseCase — integration tests (requires PostgreSQL)', () => {
  let ds: DataSource;
  let useCase: GetProgressUseCase;
  let waistMeasurementTypeId: string;
  let currentPersonId: string;

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      host: DB_HOST ?? 'localhost',
      port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
      database: process.env['DATABASE_NAME'] ?? 'evaluation_system',
      username: process.env['DATABASE_USER'] ?? 'postgres',
      password: process.env['DATABASE_PASSWORD'] ?? 'postgres',
      synchronize: false,
      entities: [PersonOrmEntity],
    });

    await ds.initialize();

    // Resolve WAIST measurement type id — seeded by migration 1700000000007
    const rows: Array<{ id: string }> = await ds.query(
      `SELECT id FROM measurement_types WHERE code = 'WAIST' LIMIT 1`,
    );
    if (rows.length === 0) {
      throw new Error('WAIST measurement type not found — ensure migrations have been applied.');
    }
    waistMeasurementTypeId = rows[0].id;

    const personRepo = new PersonTypeOrmRepository(ds);
    const progressRepo = new ProgressTypeOrmRepository(ds);
    useCase = new GetProgressUseCase(personRepo, progressRepo);
  }, 30_000);

  afterAll(async () => {
    await ds.destroy();
  }, 15_000);

  beforeEach(() => {
    currentPersonId = randomUUID();
  });

  afterEach(async () => {
    await cleanupPerson(ds, currentPersonId);
  });

  // ── Test 1: NotFoundException when person does not exist ─────────────

  it('throws NotFoundException when person does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    await expect(useCase.execute(nonExistentId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(nonExistentId)).rejects.toThrow('Person not found');
  });

  // ── Test 2: Complete evaluation data — all fields non-null ────────────

  it('returns progress record with all non-null fields when evaluation has full data', async () => {
    const evaluationId = randomUUID();

    await insertPerson(ds, { id: currentPersonId, firstName: 'Ana', lastName: 'García' });
    await insertEvaluation(ds, {
      id: evaluationId,
      personId: currentPersonId,
      evaluationDate: '2024-03-15',
    });
    await insertBodyComposition(ds, {
      id: randomUUID(),
      evaluationId,
      weightKg: 65.5,
      heightM: 1.68,
      bodyFatPercentage: 22.0,
      muscleMassPercentage: 35.0,
    });
    await insertMeasurement(ds, evaluationId, waistMeasurementTypeId, 72.5);

    const records = await useCase.execute(currentPersonId);

    expect(records).toHaveLength(1);
    const [record] = records;
    expect(typeof record.weightKg).toBe('number');
    expect(typeof record.bodyFatPercentage).toBe('number');
    expect(typeof record.muscleMassPercentage).toBe('number');
    expect(typeof record.waist).toBe('number');
    expect(record.evaluationDate).toBeInstanceOf(Date);
  });

  // ── Test 3: Evaluation without BodyComposition → null numeric fields ──

  it('returns null for body-composition fields when evaluation has no BodyComposition', async () => {
    const evaluationId = randomUUID();

    await insertPerson(ds, { id: currentPersonId, firstName: 'Luis', lastName: 'Martínez' });
    await insertEvaluation(ds, {
      id: evaluationId,
      personId: currentPersonId,
      evaluationDate: '2024-04-01',
    });
    // No body_composition and no measurement inserted

    const records = await useCase.execute(currentPersonId);

    expect(records).toHaveLength(1);
    const [record] = records;
    expect(record.weightKg).toBeNull();
    expect(record.bodyFatPercentage).toBeNull();
    expect(record.muscleMassPercentage).toBeNull();
    expect(record.waist).toBeNull();
  });

  // ── Test 4: Evaluation without WAIST measurement → waist is null ──────

  it('returns null for waist when evaluation has body-composition but no WAIST measurement', async () => {
    const evaluationId = randomUUID();

    await insertPerson(ds, { id: currentPersonId, firstName: 'Carlos', lastName: 'López' });
    await insertEvaluation(ds, {
      id: evaluationId,
      personId: currentPersonId,
      evaluationDate: '2024-05-10',
    });
    await insertBodyComposition(ds, {
      id: randomUUID(),
      evaluationId,
      weightKg: 80.0,
      heightM: 1.75,
      bodyFatPercentage: 18.5,
      muscleMassPercentage: 42.0,
    });
    // No WAIST measurement

    const records = await useCase.execute(currentPersonId);

    expect(records).toHaveLength(1);
    const [record] = records;
    expect(record.waist).toBeNull();
    expect(typeof record.weightKg).toBe('number');
  });

  // ── Test 5: Multiple evaluations ordered ASC by evaluationDate ────────

  it('returns multiple evaluations ordered ascending by evaluationDate', async () => {
    const evalId1 = randomUUID(); // later date — inserted first
    const evalId2 = randomUUID(); // earlier date — inserted second

    await insertPerson(ds, { id: currentPersonId, firstName: 'María', lastName: 'Fernández' });

    // Insert in reverse chronological order on purpose to test DB ordering
    await insertEvaluation(ds, {
      id: evalId1,
      personId: currentPersonId,
      evaluationDate: '2024-06-01',
    });
    await insertEvaluation(ds, {
      id: evalId2,
      personId: currentPersonId,
      evaluationDate: '2024-01-01',
    });

    const records = await useCase.execute(currentPersonId);

    expect(records).toHaveLength(2);
    // Ascending order: January comes before June
    expect(records[0].evaluationDate.getTime()).toBeLessThan(records[1].evaluationDate.getTime());
    expect(records[0].evaluationDate.getMonth()).toBe(0); // January (0-indexed)
    expect(records[1].evaluationDate.getMonth()).toBe(5); // June (0-indexed)
  });

  // ── Test 6: Three evaluations — strict ascending order ───────────────

  it('returns three evaluations strictly ordered ascending by date', async () => {
    await insertPerson(ds, { id: currentPersonId, firstName: 'Pedro', lastName: 'Sánchez' });

    const evalIds = [randomUUID(), randomUUID(), randomUUID()];

    // Insert in descending order on purpose
    await insertEvaluation(ds, { id: evalIds[0], personId: currentPersonId, evaluationDate: '2024-12-01' });
    await insertEvaluation(ds, { id: evalIds[1], personId: currentPersonId, evaluationDate: '2024-06-15' });
    await insertEvaluation(ds, { id: evalIds[2], personId: currentPersonId, evaluationDate: '2024-02-10' });

    const records = await useCase.execute(currentPersonId);

    expect(records).toHaveLength(3);
    // Should be in ascending order: Feb < Jun < Dec
    for (let i = 1; i < records.length; i++) {
      expect(records[i - 1].evaluationDate.getTime()).toBeLessThan(
        records[i].evaluationDate.getTime(),
      );
    }
    expect(records[0].evaluationDate.getMonth()).toBe(1); // February
    expect(records[1].evaluationDate.getMonth()).toBe(5); // June
    expect(records[2].evaluationDate.getMonth()).toBe(11); // December
  });
});
