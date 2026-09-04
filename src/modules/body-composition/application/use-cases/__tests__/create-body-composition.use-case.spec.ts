import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  CreateBodyCompositionUseCase,
  type CreateBodyCompositionInput,
} from '../create-body-composition.use-case.js';
import type { BodyCompositionRepository } from '../../../domain/repositories/body-composition.repository.js';
import type { EvaluationRepository } from '../../../../evaluation/domain/repositories/evaluation.repository.js';
import { BodyComposition } from '../../../domain/entities/body-composition.entity.js';
import { Evaluation } from '../../../../evaluation/domain/entities/evaluation.entity.js';
import { NotFoundException } from '../../../../../shared/domain/exceptions/not-found.exception.js';
import { ValidationException } from '../../../../../shared/domain/exceptions/validation.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvaluation(id = 'eval-uuid'): Evaluation {
  return new Evaluation(id, 'person-uuid', new Date('2024-01-01'), new Date(), new Date());
}

function makeMockBodyCompositionRepository(
  overrides?: Partial<BodyCompositionRepository>,
): BodyCompositionRepository {
  return {
    findByEvaluationId: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockImplementation(async (bc: BodyComposition) => bc),
    ...overrides,
  };
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

function makeBaseInput(
  overrides?: Partial<CreateBodyCompositionInput>,
): CreateBodyCompositionInput {
  return {
    evaluationId: 'eval-uuid',
    weightKg: 70,
    heightM: 1.75,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — CreateBodyCompositionUseCase
// ---------------------------------------------------------------------------

describe('CreateBodyCompositionUseCase', () => {
  let bodyCompositionRepository: BodyCompositionRepository;
  let evaluationRepository: EvaluationRepository;
  let useCase: CreateBodyCompositionUseCase;

  beforeEach(() => {
    bodyCompositionRepository = makeMockBodyCompositionRepository();
    evaluationRepository = makeMockEvaluationRepository();
    useCase = new CreateBodyCompositionUseCase(
      bodyCompositionRepository,
      evaluationRepository,
    );
  });

  // ── Happy path ─────────────────────────────────────────────────────────

  it('creates body composition with valid required fields and returns a valid UUID', async () => {
    const result = await useCase.execute(makeBaseInput());

    expect(result.evaluationId).toBe('eval-uuid');
    expect(result.weightKg).toBe(70);
    expect(result.heightM).toBe(1.75);
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('creates body composition with all optional fields', async () => {
    const input = makeBaseInput({
      bmi: 22.86,
      bodyFatPercentage: 18.5,
      muscleMassPercentage: 42.0,
      idealWeightKg: 68,
      idealBmi: 22,
      idealBodyFatPercentage: 15,
    });

    const result = await useCase.execute(input);

    expect(result.bmi).toBe(22.86);
    expect(result.bodyFatPercentage).toBe(18.5);
    expect(result.muscleMassPercentage).toBe(42.0);
    expect(result.idealWeightKg).toBe(68);
    expect(result.idealBmi).toBe(22);
    expect(result.idealBodyFatPercentage).toBe(15);
  });

  it('calls save on the repository exactly once', async () => {
    await useCase.execute(makeBaseInput());

    expect(bodyCompositionRepository.save).toHaveBeenCalledTimes(1);
  });

  // ── Boundary: minimum valid weightKg ──────────────────────────────────

  it('accepts weightKg = 0.01 (minimum valid positive value)', async () => {
    const result = await useCase.execute(makeBaseInput({ weightKg: 0.01 }));

    expect(result.weightKg).toBe(0.01);
  });

  // ── Boundary: percentage boundary values ──────────────────────────────

  it('accepts bodyFatPercentage = 0 (lower boundary)', async () => {
    const result = await useCase.execute(makeBaseInput({ bodyFatPercentage: 0 }));

    expect(result.bodyFatPercentage).toBe(0);
  });

  it('accepts bodyFatPercentage = 100 (upper boundary)', async () => {
    const result = await useCase.execute(makeBaseInput({ bodyFatPercentage: 100 }));

    expect(result.bodyFatPercentage).toBe(100);
  });

  it('accepts muscleMassPercentage = 0 (lower boundary)', async () => {
    const result = await useCase.execute(
      makeBaseInput({ muscleMassPercentage: 0 }),
    );

    expect(result.muscleMassPercentage).toBe(0);
  });

  it('accepts muscleMassPercentage = 100 (upper boundary)', async () => {
    const result = await useCase.execute(
      makeBaseInput({ muscleMassPercentage: 100 }),
    );

    expect(result.muscleMassPercentage).toBe(100);
  });

  // ── Error: weightKg <= 0 ──────────────────────────────────────────────

  it('throws ValidationException when weightKg = 0', async () => {
    await expect(
      useCase.execute(makeBaseInput({ weightKg: 0 })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('throws ValidationException when weightKg = -1', async () => {
    await expect(
      useCase.execute(makeBaseInput({ weightKg: -1 })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('ValidationException message identifies weightKg field', async () => {
    const error = await useCase
      .execute(makeBaseInput({ weightKg: 0 }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationException);
    expect((error as ValidationException).messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/weightKg/i)]),
    );
  });

  it('does not call evaluationRepository or save when weightKg is invalid', async () => {
    await expect(
      useCase.execute(makeBaseInput({ weightKg: -10 })),
    ).rejects.toThrow();

    expect(evaluationRepository.findById).not.toHaveBeenCalled();
    expect(bodyCompositionRepository.save).not.toHaveBeenCalled();
  });

  // ── Error: heightM <= 0 ───────────────────────────────────────────────

  it('throws ValidationException when heightM = 0', async () => {
    await expect(
      useCase.execute(makeBaseInput({ heightM: 0 })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('throws ValidationException when heightM = -0.5', async () => {
    await expect(
      useCase.execute(makeBaseInput({ heightM: -0.5 })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('ValidationException message identifies heightM field', async () => {
    const error = await useCase
      .execute(makeBaseInput({ heightM: 0 }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationException);
    expect((error as ValidationException).messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/heightM/i)]),
    );
  });

  // ── Error: bodyFatPercentage out of [0, 100] ──────────────────────────

  it('throws ValidationException when bodyFatPercentage = -1', async () => {
    await expect(
      useCase.execute(makeBaseInput({ bodyFatPercentage: -1 })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('throws ValidationException when bodyFatPercentage = 101', async () => {
    await expect(
      useCase.execute(makeBaseInput({ bodyFatPercentage: 101 })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('ValidationException message identifies bodyFatPercentage field', async () => {
    const error = await useCase
      .execute(makeBaseInput({ bodyFatPercentage: -5 }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationException);
    expect((error as ValidationException).messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/bodyFatPercentage/i)]),
    );
  });

  // ── Error: muscleMassPercentage out of [0, 100] ───────────────────────

  it('throws ValidationException when muscleMassPercentage = -1', async () => {
    await expect(
      useCase.execute(makeBaseInput({ muscleMassPercentage: -1 })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('throws ValidationException when muscleMassPercentage = 101', async () => {
    await expect(
      useCase.execute(makeBaseInput({ muscleMassPercentage: 101 })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('ValidationException message identifies muscleMassPercentage field', async () => {
    const error = await useCase
      .execute(makeBaseInput({ muscleMassPercentage: 200 }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationException);
    expect((error as ValidationException).messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/muscleMassPercentage/i)]),
    );
  });

  // ── Multiple validation errors collected together ─────────────────────

  it('collects both weightKg and heightM errors when both are invalid', async () => {
    const error = await useCase
      .execute(makeBaseInput({ weightKg: 0, heightM: 0 }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationException);
    const messages = (error as ValidationException).messages;
    expect(messages.some((m) => /weightKg/i.test(m))).toBe(true);
    expect(messages.some((m) => /heightM/i.test(m))).toBe(true);
  });

  // ── Error: evaluationId not found ─────────────────────────────────────

  it('throws NotFoundException when evaluationId does not exist', async () => {
    evaluationRepository = makeMockEvaluationRepository(null);
    useCase = new CreateBodyCompositionUseCase(
      bodyCompositionRepository,
      evaluationRepository,
    );

    await expect(
      useCase.execute(makeBaseInput()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('NotFoundException message says "Evaluation not found"', async () => {
    evaluationRepository = makeMockEvaluationRepository(null);
    useCase = new CreateBodyCompositionUseCase(
      bodyCompositionRepository,
      evaluationRepository,
    );

    const error = await useCase
      .execute(makeBaseInput())
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toBe('Evaluation not found');
  });

  it('does not call save when evaluation does not exist', async () => {
    evaluationRepository = makeMockEvaluationRepository(null);
    useCase = new CreateBodyCompositionUseCase(
      bodyCompositionRepository,
      evaluationRepository,
    );

    await expect(useCase.execute(makeBaseInput())).rejects.toThrow();

    expect(bodyCompositionRepository.save).not.toHaveBeenCalled();
  });

  // ── Property-based test ────────────────────────────────────────────────

  /**
   * **Propiedad 7: Validación de rangos en BodyComposition**
   * Para cualquier valor de `weightKg` o `heightM` menor o igual a cero, el sistema
   * debe rechazar la creación con un ValidationException. Para cualquier valor de
   * `bodyFatPercentage` o `muscleMassPercentage` fuera del intervalo cerrado [0, 100],
   * el sistema debe igualmente rechazar la creación con ValidationException.
   *
   * Validates: Requirements 5.2, 5.3, 5.4, 5.5
   */
  it('Propiedad 7: invalid range values always throw ValidationException (100 runs)', async () => {
    // Arbitraries for invalid values
    const invalidPositive = fc.oneof(
      fc.double({ max: 0, noNaN: true, maxExcluded: false }),
      fc.constant(0),
    );

    const invalidPercentage = fc.oneof(
      fc.double({ max: -0.001, noNaN: true }),
      fc.double({ min: 100.001, noNaN: true, noDefaultInfinity: true }),
    );

    // Case A: weightKg <= 0 with otherwise valid values
    await fc.assert(
      fc.asyncProperty(
        invalidPositive,
        async (badWeight) => {
          const repo = makeMockEvaluationRepository();
          const bcRepo = makeMockBodyCompositionRepository();
          const uc = new CreateBodyCompositionUseCase(bcRepo, repo);

          await expect(
            uc.execute(makeBaseInput({ weightKg: badWeight })),
          ).rejects.toBeInstanceOf(ValidationException);
        },
      ),
      { numRuns: 33 },
    );

    // Case B: heightM <= 0 with otherwise valid values
    await fc.assert(
      fc.asyncProperty(
        invalidPositive,
        async (badHeight) => {
          const repo = makeMockEvaluationRepository();
          const bcRepo = makeMockBodyCompositionRepository();
          const uc = new CreateBodyCompositionUseCase(bcRepo, repo);

          await expect(
            uc.execute(makeBaseInput({ heightM: badHeight })),
          ).rejects.toBeInstanceOf(ValidationException);
        },
      ),
      { numRuns: 33 },
    );

    // Case C: bodyFatPercentage outside [0, 100]
    await fc.assert(
      fc.asyncProperty(
        invalidPercentage,
        async (badPct) => {
          const repo = makeMockEvaluationRepository();
          const bcRepo = makeMockBodyCompositionRepository();
          const uc = new CreateBodyCompositionUseCase(bcRepo, repo);

          await expect(
            uc.execute(makeBaseInput({ bodyFatPercentage: badPct })),
          ).rejects.toBeInstanceOf(ValidationException);
        },
      ),
      { numRuns: 34 },
    );

    // Case D: muscleMassPercentage outside [0, 100]
    await fc.assert(
      fc.asyncProperty(
        invalidPercentage,
        async (badPct) => {
          const repo = makeMockEvaluationRepository();
          const bcRepo = makeMockBodyCompositionRepository();
          const uc = new CreateBodyCompositionUseCase(bcRepo, repo);

          await expect(
            uc.execute(makeBaseInput({ muscleMassPercentage: badPct })),
          ).rejects.toBeInstanceOf(ValidationException);
        },
      ),
      { numRuns: 34 },
    );
  });
});
