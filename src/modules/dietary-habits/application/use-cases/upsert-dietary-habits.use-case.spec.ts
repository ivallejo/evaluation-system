import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  UpsertDietaryHabitsUseCase,
  type UpsertDietaryHabitsInput,
} from './upsert-dietary-habits.use-case.js';
import type { DietaryHabitsRepository } from '../../domain/repositories/dietary-habits.repository.js';
import type { EvaluationRepository } from '../../../evaluation/domain/repositories/evaluation.repository.js';
import { DietaryHabits } from '../../domain/entities/dietary-habits.entity.js';
import { Evaluation } from '../../../evaluation/domain/entities/evaluation.entity.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvaluation(id = 'eval-uuid'): Evaluation {
  return new Evaluation(id, 'person-uuid', new Date('2024-01-01'), new Date(), new Date());
}

function makeExistingDietaryHabits(
  overrides?: Partial<DietaryHabits>,
): DietaryHabits {
  return new DietaryHabits(
    'dh-uuid',
    'eval-uuid',
    overrides?.description ?? 'existing description',
    overrides?.createdAt ?? new Date('2024-01-01'),
    overrides?.updatedAt ?? new Date('2024-01-01'),
  );
}

function makeMockEvaluationRepository(
  existingEvaluation: Evaluation | null = makeEvaluation(),
  overrides?: Partial<EvaluationRepository>,
): EvaluationRepository {
  return {
    findById: vi.fn().mockResolvedValue(existingEvaluation),
    findByPersonId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeMockDietaryHabitsRepository(
  existingRecord: DietaryHabits | null = null,
  overrides?: Partial<DietaryHabitsRepository>,
): DietaryHabitsRepository {
  return {
    findByEvaluationId: vi.fn().mockResolvedValue(existingRecord),
    save: vi.fn().mockImplementation(async (dh: DietaryHabits) => dh),
    update: vi.fn().mockImplementation(async (dh: DietaryHabits) => dh),
    ...overrides,
  };
}

function makeInput(
  overrides?: Partial<UpsertDietaryHabitsInput>,
): UpsertDietaryHabitsInput {
  return {
    evaluationId: 'eval-uuid',
    description: 'balanced diet with vegetables and proteins',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — UpsertDietaryHabitsUseCase
// ---------------------------------------------------------------------------

describe('UpsertDietaryHabitsUseCase', () => {
  let evaluationRepository: EvaluationRepository;
  let dietaryHabitsRepository: DietaryHabitsRepository;
  let useCase: UpsertDietaryHabitsUseCase;

  beforeEach(() => {
    evaluationRepository = makeMockEvaluationRepository();
    dietaryHabitsRepository = makeMockDietaryHabitsRepository(null);
    useCase = new UpsertDietaryHabitsUseCase(
      evaluationRepository,
      dietaryHabitsRepository,
    );
  });

  // ── Happy path — create new record ─────────────────────────────────────

  it('creates a new DietaryHabits record when none exists for the evaluation', async () => {
    const result = await useCase.execute(makeInput());

    expect(result.evaluationId).toBe('eval-uuid');
    expect(result.description).toBe('balanced diet with vegetables and proteins');
  });

  it('returns a record with a valid UUID when creating', async () => {
    const result = await useCase.execute(makeInput());

    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('returns a record with createdAt and updatedAt dates when creating', async () => {
    const result = await useCase.execute(makeInput());

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('calls save and not update when no existing record', async () => {
    await useCase.execute(makeInput());

    expect(dietaryHabitsRepository.save).toHaveBeenCalledTimes(1);
    expect(dietaryHabitsRepository.update).not.toHaveBeenCalled();
  });

  // ── Happy path — update existing record ─────────────────────────────────

  it('updates description when DietaryHabits already exists for the evaluation', async () => {
    const existing = makeExistingDietaryHabits({ description: 'old diet' });
    dietaryHabitsRepository = makeMockDietaryHabitsRepository(existing);
    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, dietaryHabitsRepository);

    const result = await useCase.execute(makeInput({ description: 'new diet plan' }));

    expect(result.description).toBe('new diet plan');
  });

  it('calls update and not save when existing record is found', async () => {
    const existing = makeExistingDietaryHabits();
    dietaryHabitsRepository = makeMockDietaryHabitsRepository(existing);
    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, dietaryHabitsRepository);

    await useCase.execute(makeInput({ description: 'updated description' }));

    expect(dietaryHabitsRepository.update).toHaveBeenCalledTimes(1);
    expect(dietaryHabitsRepository.save).not.toHaveBeenCalled();
  });

  it('preserves the original id and evaluationId when updating', async () => {
    const existing = makeExistingDietaryHabits({ description: 'old' });
    dietaryHabitsRepository = makeMockDietaryHabitsRepository(existing);
    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, dietaryHabitsRepository);

    const result = await useCase.execute(makeInput({ description: 'new' }));

    expect(result.id).toBe('dh-uuid');
    expect(result.evaluationId).toBe('eval-uuid');
  });

  it('updatedAt is refreshed on update', async () => {
    const oldDate = new Date('2024-01-01');
    const existing = makeExistingDietaryHabits({ updatedAt: oldDate });
    dietaryHabitsRepository = makeMockDietaryHabitsRepository(existing);
    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, dietaryHabitsRepository);

    const before = Date.now();
    const result = await useCase.execute(makeInput({ description: 'updated' }));
    const after = Date.now();

    // updatedAt should be set to a time >= before the call
    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after);
  });

  // ── Error — evaluationId not found ─────────────────────────────────────

  it('throws NotFoundException when evaluationId does not exist', async () => {
    evaluationRepository = makeMockEvaluationRepository(null);
    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, dietaryHabitsRepository);

    await expect(useCase.execute(makeInput())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('NotFoundException message says "Evaluation not found"', async () => {
    evaluationRepository = makeMockEvaluationRepository(null);
    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, dietaryHabitsRepository);

    const error = await useCase.execute(makeInput()).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toBe('Evaluation not found');
  });

  it('does not call save or update when evaluation does not exist', async () => {
    evaluationRepository = makeMockEvaluationRepository(null);
    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, dietaryHabitsRepository);

    await expect(useCase.execute(makeInput())).rejects.toThrow();

    expect(dietaryHabitsRepository.save).not.toHaveBeenCalled();
    expect(dietaryHabitsRepository.update).not.toHaveBeenCalled();
  });

  // ── Note on missing description ─────────────────────────────────────────
  // Validation of missing/empty `description` is enforced at the DTO layer
  // (class-validator on UpsertDietaryHabitsDto) before the use case is called.
  // Therefore, it is not tested here at the use-case level.

  // ── Multiple successive calls (idempotency simulation) ─────────────────

  it('after multiple successive upserts, the final description matches the last call', async () => {
    // Simulate stateful repository: starts with no record, then tracks the current state
    let storedRecord: DietaryHabits | null = null;

    const statefulRepo: DietaryHabitsRepository = {
      findByEvaluationId: vi.fn().mockImplementation(async () => storedRecord),
      save: vi.fn().mockImplementation(async (dh: DietaryHabits) => {
        storedRecord = dh;
        return dh;
      }),
      update: vi.fn().mockImplementation(async (dh: DietaryHabits) => {
        storedRecord = dh;
        return dh;
      }),
    };

    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, statefulRepo);

    await useCase.execute(makeInput({ description: 'first description' }));
    await useCase.execute(makeInput({ description: 'second description' }));
    const finalResult = await useCase.execute(makeInput({ description: 'third description' }));

    expect(finalResult.description).toBe('third description');
    expect(storedRecord!.description).toBe('third description');
  });

  it('after the first upsert, subsequent calls use update instead of save', async () => {
    let storedRecord: DietaryHabits | null = null;

    const statefulRepo: DietaryHabitsRepository = {
      findByEvaluationId: vi.fn().mockImplementation(async () => storedRecord),
      save: vi.fn().mockImplementation(async (dh: DietaryHabits) => {
        storedRecord = dh;
        return dh;
      }),
      update: vi.fn().mockImplementation(async (dh: DietaryHabits) => {
        storedRecord = dh;
        return dh;
      }),
    };

    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, statefulRepo);

    await useCase.execute(makeInput({ description: 'first' }));  // should save
    await useCase.execute(makeInput({ description: 'second' })); // should update
    await useCase.execute(makeInput({ description: 'third' }));  // should update

    expect(statefulRepo.save).toHaveBeenCalledTimes(1);
    expect(statefulRepo.update).toHaveBeenCalledTimes(2);
  });

  it('only one DietaryHabits record exists after multiple upserts', async () => {
    let storedRecord: DietaryHabits | null = null;
    const allSaved: DietaryHabits[] = [];

    const statefulRepo: DietaryHabitsRepository = {
      findByEvaluationId: vi.fn().mockImplementation(async () => storedRecord),
      save: vi.fn().mockImplementation(async (dh: DietaryHabits) => {
        storedRecord = dh;
        allSaved.push(dh);
        return dh;
      }),
      update: vi.fn().mockImplementation(async (dh: DietaryHabits) => {
        storedRecord = dh;
        return dh;
      }),
    };

    useCase = new UpsertDietaryHabitsUseCase(evaluationRepository, statefulRepo);

    await useCase.execute(makeInput({ description: 'desc 1' }));
    await useCase.execute(makeInput({ description: 'desc 2' }));
    await useCase.execute(makeInput({ description: 'desc 3' }));

    // save should only have been called once (on the very first upsert)
    expect(allSaved).toHaveLength(1);
  });

  // ── Property 9: Idempotence of DietaryHabits upsert ────────────────────

  /**
   * **Propiedad 9: Idempotencia de upsert en DietaryHabits**
   * Para cualquier secuencia de N descripciones válidas, ejecutar el upsert
   * N veces en orden siempre debe resultar en que la descripción almacenada
   * es igual a la última descripción de la secuencia, y que save fue llamado
   * exactamente una vez (en la primera ejecución) independientemente de N.
   *
   * Validates: Requirements 7.1, 7.2
   */
  it('Propiedad 9: upsert N times always results in last description stored, save called once', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
        async (descriptions) => {
          let storedRecord: DietaryHabits | null = null;

          const statefulRepo: DietaryHabitsRepository = {
            findByEvaluationId: vi.fn().mockImplementation(async () => storedRecord),
            save: vi.fn().mockImplementation(async (dh: DietaryHabits) => {
              storedRecord = dh;
              return dh;
            }),
            update: vi.fn().mockImplementation(async (dh: DietaryHabits) => {
              storedRecord = dh;
              return dh;
            }),
          };

          const evalRepo = makeMockEvaluationRepository();
          const uc = new UpsertDietaryHabitsUseCase(evalRepo, statefulRepo);

          let lastResult: DietaryHabits | null = null;
          for (const description of descriptions) {
            lastResult = await uc.execute(makeInput({ description }));
          }

          // Final stored description must equal the last description applied
          expect(lastResult!.description).toBe(descriptions[descriptions.length - 1]);
          expect(storedRecord!.description).toBe(descriptions[descriptions.length - 1]);

          // save is called exactly once (on the first upsert)
          expect(statefulRepo.save).toHaveBeenCalledTimes(1);

          // update is called for all subsequent upserts
          expect(statefulRepo.update).toHaveBeenCalledTimes(descriptions.length - 1);
        },
      ),
      { numRuns: 50 },
    );
  });
});
