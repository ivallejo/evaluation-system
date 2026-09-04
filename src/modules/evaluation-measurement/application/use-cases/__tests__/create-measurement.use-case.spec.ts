import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  CreateMeasurementUseCase,
  type CreateMeasurementInput,
} from '../create-measurement.use-case.js';
import type { EvaluationRepository } from '../../../../evaluation/domain/repositories/evaluation.repository.js';
import type { MeasurementTypeRepository } from '../../../../measurement-type/domain/repositories/measurement-type.repository.js';
import type { EvaluationMeasurementRepository } from '../../../domain/repositories/evaluation-measurement.repository.js';
import { Evaluation } from '../../../../evaluation/domain/entities/evaluation.entity.js';
import { MeasurementType } from '../../../../measurement-type/domain/entities/measurement-type.entity.js';
import { EvaluationMeasurement } from '../../../domain/entities/evaluation-measurement.entity.js';
import { NotFoundException } from '../../../../../shared/domain/exceptions/not-found.exception.js';
import { ConflictException } from '../../../../../shared/domain/exceptions/conflict.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EVALUATION_ID = 'eval-uuid-1234';
const TYPE_ID_A = 'type-uuid-aaaa';
const TYPE_ID_B = 'type-uuid-bbbb';

function makeEvaluation(id = EVALUATION_ID): Evaluation {
  return new Evaluation(
    id,
    'person-uuid-1',
    new Date('2024-01-15'),
    new Date('2024-01-15'),
    new Date('2024-01-15'),
  );
}

function makeMeasurementType(id: string, code = 'WAIST'): MeasurementType {
  return new MeasurementType(
    id,
    code,
    'Cintura',
    'cm',
    'superior',
    true,
    new Date('2020-01-01'),
    new Date('2020-01-01'),
  );
}

function makeMockEvaluationRepo(
  overrides?: Partial<EvaluationRepository>,
): EvaluationRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeEvaluation()),
    findByPersonId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation(async (e: Evaluation) => e),
    ...overrides,
  };
}

function makeMockMeasurementTypeRepo(
  foundTypes: MeasurementType[] = [],
  overrides?: Partial<MeasurementTypeRepository>,
): MeasurementTypeRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByCode: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    findAllByIds: vi.fn().mockResolvedValue(foundTypes),
    save: vi.fn().mockImplementation(async (mt: MeasurementType) => mt),
    ...overrides,
  };
}

function makeMockMeasurementRepo(
  overrides?: Partial<EvaluationMeasurementRepository>,
): EvaluationMeasurementRepository {
  return {
    findByEvaluationId: vi.fn().mockResolvedValue([]),
    findByEvaluationIdAndMeasurementTypeId: vi.fn().mockResolvedValue(null),
    saveMany: vi.fn().mockImplementation(
      async (ms: EvaluationMeasurement[]) => ms,
    ),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — CreateMeasurementUseCase
// ---------------------------------------------------------------------------

describe('CreateMeasurementUseCase', () => {
  let evaluationRepo: EvaluationRepository;
  let measurementTypeRepo: MeasurementTypeRepository;
  let measurementRepo: EvaluationMeasurementRepository;
  let useCase: CreateMeasurementUseCase;

  beforeEach(() => {
    evaluationRepo = makeMockEvaluationRepo();
    measurementTypeRepo = makeMockMeasurementTypeRepo([
      makeMeasurementType(TYPE_ID_A, 'WAIST'),
      makeMeasurementType(TYPE_ID_B, 'BICEP_RELAXED'),
    ]);
    measurementRepo = makeMockMeasurementRepo();
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );
  });

  // ── Happy path ─────────────────────────────────────────────────────────

  it('creates measurements and returns them for a valid input', async () => {
    const input: CreateMeasurementInput = {
      evaluationId: EVALUATION_ID,
      measurements: [
        { measurementTypeId: TYPE_ID_A, value: 75.5 },
        { measurementTypeId: TYPE_ID_B, value: 32.0 },
      ],
    };

    const result = await useCase.execute(input);

    expect(result).toHaveLength(2);
    expect(result[0].evaluationId).toBe(EVALUATION_ID);
    expect(result[0].measurementTypeId).toBe(TYPE_ID_A);
    expect(result[0].value).toBe(75.5);
    expect(result[1].measurementTypeId).toBe(TYPE_ID_B);
  });

  it('returns an empty array when measurements array is empty', async () => {
    const input: CreateMeasurementInput = {
      evaluationId: EVALUATION_ID,
      measurements: [],
    };

    const result = await useCase.execute(input);

    expect(result).toEqual([]);
    expect(measurementRepo.saveMany).toHaveBeenCalledWith([]);
  });

  it('assigns a unique UUID to each created measurement', async () => {
    const input: CreateMeasurementInput = {
      evaluationId: EVALUATION_ID,
      measurements: [
        { measurementTypeId: TYPE_ID_A, value: 10 },
        { measurementTypeId: TYPE_ID_B, value: 20 },
      ],
    };

    const result = await useCase.execute(input);

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const m of result) {
      expect(m.id).toMatch(uuidPattern);
    }
    expect(result[0].id).not.toBe(result[1].id);
  });

  it('calls saveMany exactly once', async () => {
    // Override typeRepo to match exactly the one type being requested
    measurementTypeRepo = makeMockMeasurementTypeRepo([
      makeMeasurementType(TYPE_ID_A, 'WAIST'),
    ]);
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    await useCase.execute({
      evaluationId: EVALUATION_ID,
      measurements: [{ measurementTypeId: TYPE_ID_A, value: 40 }],
    });

    expect(measurementRepo.saveMany).toHaveBeenCalledTimes(1);
  });

  // ── Error: evaluationId not found ─────────────────────────────────────

  it('throws NotFoundException when evaluationId does not exist', async () => {
    evaluationRepo = makeMockEvaluationRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    await expect(
      useCase.execute({ evaluationId: 'nonexistent-id', measurements: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('NotFoundException for missing evaluation has message "Evaluation not found"', async () => {
    evaluationRepo = makeMockEvaluationRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    const error = await useCase
      .execute({ evaluationId: 'ghost', measurements: [] })
      .catch((e: unknown) => e);

    expect((error as NotFoundException).message).toBe('Evaluation not found');
  });

  it('does not call saveMany when evaluation is not found', async () => {
    evaluationRepo = makeMockEvaluationRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    await useCase.execute({ evaluationId: 'ghost', measurements: [] }).catch(() => undefined);

    expect(measurementRepo.saveMany).not.toHaveBeenCalled();
  });

  // ── Error: measurementTypeId not found ────────────────────────────────

  it('throws NotFoundException when a measurementTypeId does not exist', async () => {
    measurementTypeRepo = makeMockMeasurementTypeRepo(
      [makeMeasurementType(TYPE_ID_A)], // only one found, but two requested
    );
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    await expect(
      useCase.execute({
        evaluationId: EVALUATION_ID,
        measurements: [
          { measurementTypeId: TYPE_ID_A, value: 10 },
          { measurementTypeId: 'nonexistent-type-id', value: 20 },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('NotFoundException for missing measurementType has message "MeasurementType not found"', async () => {
    measurementTypeRepo = makeMockMeasurementTypeRepo([]); // none found
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    const error = await useCase
      .execute({
        evaluationId: EVALUATION_ID,
        measurements: [{ measurementTypeId: 'ghost-type', value: 15 }],
      })
      .catch((e: unknown) => e);

    expect((error as NotFoundException).message).toBe('MeasurementType not found');
  });

  it('does not call saveMany when a measurementTypeId is not found', async () => {
    measurementTypeRepo = makeMockMeasurementTypeRepo([]); // none found
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    await useCase
      .execute({
        evaluationId: EVALUATION_ID,
        measurements: [{ measurementTypeId: 'ghost-type', value: 15 }],
      })
      .catch(() => undefined);

    expect(measurementRepo.saveMany).not.toHaveBeenCalled();
  });

  // ── Error: (evaluationId, measurementTypeId) already exists ──────────

  it('throws ConflictException when (evaluationId, measurementTypeId) already exists in DB', async () => {
    const existingMeasurement = new EvaluationMeasurement(
      'existing-measurement-uuid',
      EVALUATION_ID,
      TYPE_ID_A,
      55.0,
      new Date(),
      new Date(),
    );
    measurementTypeRepo = makeMockMeasurementTypeRepo([
      makeMeasurementType(TYPE_ID_A),
    ]);
    measurementRepo = makeMockMeasurementRepo({
      findByEvaluationIdAndMeasurementTypeId: vi
        .fn()
        .mockResolvedValue(existingMeasurement),
    });
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    await expect(
      useCase.execute({
        evaluationId: EVALUATION_ID,
        measurements: [{ measurementTypeId: TYPE_ID_A, value: 60 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('ConflictException for duplicate (evaluationId, measurementTypeId) mentions the measurementTypeId', async () => {
    const existingMeasurement = new EvaluationMeasurement(
      'existing-uuid',
      EVALUATION_ID,
      TYPE_ID_A,
      55.0,
      new Date(),
      new Date(),
    );
    measurementTypeRepo = makeMockMeasurementTypeRepo([
      makeMeasurementType(TYPE_ID_A),
    ]);
    measurementRepo = makeMockMeasurementRepo({
      findByEvaluationIdAndMeasurementTypeId: vi
        .fn()
        .mockResolvedValue(existingMeasurement),
    });
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    const error = await useCase
      .execute({
        evaluationId: EVALUATION_ID,
        measurements: [{ measurementTypeId: TYPE_ID_A, value: 60 }],
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).message).toContain(TYPE_ID_A);
  });

  // ── Error: duplicate measurementTypeId within the input array (in DB) ─

  it('throws ConflictException when second item in input has same measurementTypeId already in DB', async () => {
    // First call returns null (TYPE_ID_B not yet persisted), second call returns existing (TYPE_ID_A exists)
    const existing = new EvaluationMeasurement(
      'dup-uuid',
      EVALUATION_ID,
      TYPE_ID_A,
      55,
      new Date(),
      new Date(),
    );
    measurementRepo = makeMockMeasurementRepo({
      findByEvaluationIdAndMeasurementTypeId: vi
        .fn()
        .mockResolvedValueOnce(null)     // TYPE_ID_B → ok
        .mockResolvedValueOnce(existing), // TYPE_ID_A → conflict
    });
    useCase = new CreateMeasurementUseCase(
      evaluationRepo,
      measurementTypeRepo,
      measurementRepo,
    );

    await expect(
      useCase.execute({
        evaluationId: EVALUATION_ID,
        measurements: [
          { measurementTypeId: TYPE_ID_B, value: 30 },
          { measurementTypeId: TYPE_ID_A, value: 40 }, // this one conflicts
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // ── Property-based tests ───────────────────────────────────────────────

  /**
   * **Propiedad 8: Unicidad de medición por evaluación**
   * Para cualquier combinación (evaluationId, measurementTypeId) que ya exista en
   * la tabla `evaluation_measurements`, un nuevo intento de insertar esa misma
   * combinación debe resultar en un ConflictException, independientemente del valor
   * numérico de la medición.
   *
   * Validates: Requirements 6.4, 6.7
   */
  it('Propiedad 8: unicidad de medición — any (evaluationId, measurementTypeId) already in DB always throws ConflictException', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.float({ min: Math.fround(0.1), max: Math.fround(999.9), noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(999.9), noNaN: true }),
        async (evaluationId, measurementTypeId, existingValue, newValue) => {
          const existingEval = makeEvaluation(evaluationId);
          const existingType = makeMeasurementType(measurementTypeId);
          const existingMeasurement = new EvaluationMeasurement(
            'some-existing-uuid',
            evaluationId,
            measurementTypeId,
            existingValue,
            new Date(),
            new Date(),
          );

          const evalRepo = makeMockEvaluationRepo({
            findById: vi.fn().mockResolvedValue(existingEval),
          });
          const typeRepo = makeMockMeasurementTypeRepo([existingType]);
          const msRepo = makeMockMeasurementRepo({
            findByEvaluationIdAndMeasurementTypeId: vi
              .fn()
              .mockResolvedValue(existingMeasurement),
          });

          const uc = new CreateMeasurementUseCase(evalRepo, typeRepo, msRepo);

          await expect(
            uc.execute({
              evaluationId,
              measurements: [{ measurementTypeId, value: newValue }],
            }),
          ).rejects.toBeInstanceOf(ConflictException);

          expect(msRepo.saveMany).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 50 },
    );
  });
});
