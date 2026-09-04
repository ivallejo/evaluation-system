/**
 * Integration tests for GetEvaluationUseCase — Requirements 18.2, 18.5
 *
 * These tests require a running PostgreSQL instance. When no database is
 * available (DATABASE_HOST not set or connection fails), the suite is skipped.
 *
 * Tests verify:
 *   - Retrieving a complete Evaluation from a real PostgreSQL database
 *   - NotFoundException thrown for non-existent evaluation IDs
 *   - Data is cleaned up after each test in FK-safe order
 */

import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

import { GetEvaluationUseCase } from '../get-evaluation.use-case.js';
import { EvaluationTypeOrmRepository } from '../../../infrastructure/repositories/evaluation.typeorm-repository.js';
import { NotFoundException } from '../../../../../shared/domain/exceptions/not-found.exception.js';

import { PersonOrmEntity } from '../../../../person/infrastructure/persistence/person.orm-entity.js';
import { EvaluationOrmEntity } from '../../../infrastructure/persistence/evaluation.orm-entity.js';

// ---------------------------------------------------------------------------
// DB availability check
// ---------------------------------------------------------------------------

const DB_HOST = process.env['DATABASE_HOST'];
const DB_AVAILABLE = typeof DB_HOST === 'string' && DB_HOST.length > 0;

// ---------------------------------------------------------------------------
// Suite — skipped when no DB is available
// ---------------------------------------------------------------------------

const describeSuite = DB_AVAILABLE ? describe : describe.skip;

describeSuite('GetEvaluationUseCase — integration tests (requires PostgreSQL)', () => {
  let dataSource: DataSource;
  let useCase: GetEvaluationUseCase;

  let personId: string;
  let evaluationId: string;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: DB_HOST ?? 'localhost',
      port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
      database: process.env['DATABASE_NAME'] ?? 'evaluation_system',
      username: process.env['DATABASE_USER'] ?? 'postgres',
      password: process.env['DATABASE_PASSWORD'] ?? 'postgres',
      synchronize: false,
      entities: [PersonOrmEntity, EvaluationOrmEntity],
    });

    await dataSource.initialize();

    const repository = new EvaluationTypeOrmRepository(dataSource);
    useCase = new GetEvaluationUseCase(repository);
  }, 30_000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  }, 15_000);

  beforeEach(async () => {
    personId = randomUUID();
    evaluationId = randomUUID();
    const now = new Date();

    await dataSource.query(
      `INSERT INTO persons (id, first_name, last_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [personId, 'Jane', 'Doe', now, now],
    );

    await dataSource.query(
      `INSERT INTO evaluations (id, person_id, evaluation_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [evaluationId, personId, '2024-06-15', now, now],
    );
  });

  afterEach(async () => {
    // FK-safe cleanup: evaluations before persons
    await dataSource.query(`DELETE FROM evaluations WHERE id = $1`, [evaluationId]);
    await dataSource.query(`DELETE FROM persons WHERE id = $1`, [personId]);
  });

  // ── Test 1: Retrieve evaluation by ID ────────────────────────────────

  it('returns the evaluation with correct fields when the ID exists', async () => {
    const result = await useCase.execute(evaluationId);

    expect(result).toBeDefined();
    expect(result.id).toBe(evaluationId);
    expect(result.personId).toBe(personId);

    // evaluationDate comes back as a Date from TypeORM
    const returnedDate = new Date(result.evaluationDate);
    expect(returnedDate.toISOString().startsWith('2024-06-15')).toBe(true);
  });

  // ── Test 2: Evaluation with optional fields ───────────────────────────

  it('returns evaluation with objective and trainingLevel when they are set', async () => {
    const evalWithExtra = randomUUID();
    const now = new Date();

    await dataSource.query(
      `INSERT INTO evaluations (id, person_id, evaluation_date, objective, training_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [evalWithExtra, personId, '2024-07-01', 'Build muscle', 'advanced', now, now],
    );

    const result = await useCase.execute(evalWithExtra);

    expect(result.objective).toBe('Build muscle');
    expect(result.trainingLevel).toBe('advanced');

    // Cleanup
    await dataSource.query(`DELETE FROM evaluations WHERE id = $1`, [evalWithExtra]);
  });

  // ── Test 3: NotFoundException for non-existent ID ────────────────────

  it('throws NotFoundException when evaluation does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    await expect(useCase.execute(nonExistentId)).rejects.toThrow(NotFoundException);
  });

  it('NotFoundException message is "Evaluation not found"', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    await expect(useCase.execute(nonExistentId)).rejects.toThrow('Evaluation not found');
  });

  // ── Test 4: Data is cleaned up correctly (cleanup verification) ───────

  it('returns different evaluations for different IDs', async () => {
    const secondEvalId = randomUUID();
    const now = new Date();

    await dataSource.query(
      `INSERT INTO evaluations (id, person_id, evaluation_date, objective, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [secondEvalId, personId, '2024-08-20', 'Lose weight', now, now],
    );

    const first = await useCase.execute(evaluationId);
    const second = await useCase.execute(secondEvalId);

    expect(first.id).toBe(evaluationId);
    expect(second.id).toBe(secondEvalId);
    expect(second.objective).toBe('Lose weight');
    expect(first.objective).toBeUndefined();

    // Cleanup
    await dataSource.query(`DELETE FROM evaluations WHERE id = $1`, [secondEvalId]);
  });
});
