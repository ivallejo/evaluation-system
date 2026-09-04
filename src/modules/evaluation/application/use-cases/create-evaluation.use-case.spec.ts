import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  CreateEvaluationUseCase,
  type CreateEvaluationInput,
  type EvaluationResult,
} from './create-evaluation.use-case.js';
import type { PersonRepository } from '../../../person/domain/repositories/person.repository.js';
import type { TrainerRepository } from '../../../trainer/domain/repositories/trainer.repository.js';
import type { MeasurementTypeRepository } from '../../../measurement-type/domain/repositories/measurement-type.repository.js';
import type { TransactionManager, TransactionContext } from '../../../../shared/domain/transaction-manager.interface.js';
import { Person } from '../../../person/domain/entities/person.entity.js';
import { Trainer } from '../../../trainer/domain/entities/trainer.entity.js';
import { MeasurementType } from '../../../measurement-type/domain/entities/measurement-type.entity.js';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import { BodyComposition } from '../../../body-composition/domain/entities/body-composition.entity.js';
import { EvaluationMeasurement } from '../../../evaluation-measurement/domain/entities/evaluation-measurement.entity.js';
import { DietaryHabits } from '../../../dietary-habits/domain/entities/dietary-habits.entity.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';
import { ConflictException } from '../../../../shared/domain/exceptions/conflict.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePerson(id = 'person-uuid'): Person {
  return new Person(id, 'John', 'Doe', new Date(), new Date());
}

function makeTrainer(id = 'trainer-uuid'): Trainer {
  return new Trainer(id, 'Jane', 'Smith', true, new Date(), new Date());
}

function makeMeasurementType(id: string): MeasurementType {
  return new MeasurementType(id, 'BICEP_RELAXED', 'Bícep Relajado', 'cm', 'superior', true, new Date(), new Date());
}

function makeMockPersonRepository(
  existing: Person | null = makePerson(),
  overrides?: Partial<PersonRepository>,
): PersonRepository {
  return {
    findById: vi.fn().mockResolvedValue(existing),
    findByDocumentNumber: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation(async (p: Person) => p),
    update: vi.fn().mockImplementation(async (p: Person) => p),
    ...overrides,
  };
}

function makeMockTrainerRepository(
  existing: Trainer | null = makeTrainer(),
  overrides?: Partial<TrainerRepository>,
): TrainerRepository {
  return {
    findById: vi.fn().mockResolvedValue(existing),
    findAll: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation(async (t: Trainer) => t),
    ...overrides,
  };
}

function makeMockMeasurementTypeRepository(
  ids: string[] = ['mt-uuid-1'],
  overrides?: Partial<MeasurementTypeRepository>,
): MeasurementTypeRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByCode: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    findAllByIds: vi.fn().mockImplementation(async (requestedIds: string[]) =>
      requestedIds.filter((id) => ids.includes(id)).map(makeMeasurementType),
    ),
    save: vi.fn().mockImplementation(async (mt: MeasurementType) => mt),
    ...overrides,
  };
}

/** Creates a mock TransactionContext where each repo method is a pass-through vi.fn() */
function makeMockTransactionContext(): TransactionContext {
  return {
    evaluationRepository: {
      save: vi.fn().mockImplementation(async (e: Evaluation) => e),
    },
    bodyCompositionRepository: {
      save: vi.fn().mockImplementation(async (bc: BodyComposition) => bc),
    },
    measurementRepository: {
      saveMany: vi.fn().mockImplementation(async (ms: EvaluationMeasurement[]) => ms),
    },
    dietaryHabitsRepository: {
      save: vi.fn().mockImplementation(async (dh: DietaryHabits) => dh),
    },
  };
}

/** Creates a mock TransactionManager that immediately executes the work with the given context */
function makeMockTransactionManager(
  txContext: TransactionContext = makeMockTransactionContext(),
): TransactionManager {
  return {
    execute: vi.fn().mockImplementation(
      async <T>(work: (tx: TransactionContext) => Promise<T>) => work(txContext),
    ),
  };
}

function makeValidInput(overrides?: Partial<CreateEvaluationInput>): CreateEvaluationInput {
  return {
    personId: 'person-uuid',
    evaluationDate: new Date('2024-06-01'),
    bodyComposition: {
      weightKg: 75,
      heightM: 1.78,
      bmi: 23.67,
      bodyFatPercentage: 18,
      muscleMassPercentage: 40,
    },
    measurements: [
      { measurementTypeId: 'mt-uuid-1', value: 35 },
    ],
    dietaryHabits: {
      description: 'Balanced diet with proteins and vegetables',
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — CreateEvaluationUseCase
// ---------------------------------------------------------------------------

describe('CreateEvaluationUseCase', () => {
  let personRepository: PersonRepository;
  let trainerRepository: TrainerRepository;
  let measurementTypeRepository: MeasurementTypeRepository;
  let transactionManager: TransactionManager;
  let useCase: CreateEvaluationUseCase;

  beforeEach(() => {
    personRepository = makeMockPersonRepository();
    trainerRepository = makeMockTrainerRepository();
    measurementTypeRepository = makeMockMeasurementTypeRepository(['mt-uuid-1']);
    transactionManager = makeMockTransactionManager();
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );
  });

  // ── Error: personId not found ───────────────────────────────────────────

  it('throws NotFoundException when personId does not exist', async () => {
    personRepository = makeMockPersonRepository(null);
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    await expect(useCase.execute(makeValidInput())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('NotFoundException message says "Person not found" when personId is missing', async () => {
    personRepository = makeMockPersonRepository(null);
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    const error = await useCase.execute(makeValidInput()).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toBe('Person not found');
  });

  it('does not call transactionManager when person is not found', async () => {
    personRepository = makeMockPersonRepository(null);
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    await expect(useCase.execute(makeValidInput())).rejects.toThrow();

    expect(transactionManager.execute).not.toHaveBeenCalled();
  });

  // ── Error: trainerId not found ──────────────────────────────────────────

  it('throws NotFoundException when trainerId is provided but does not exist', async () => {
    trainerRepository = makeMockTrainerRepository(null);
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    const input = makeValidInput({ trainerId: 'nonexistent-trainer-uuid' });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('NotFoundException message says "Trainer not found" when trainerId is missing', async () => {
    trainerRepository = makeMockTrainerRepository(null);
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    const error = await useCase
      .execute(makeValidInput({ trainerId: 'nonexistent-trainer-uuid' }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toBe('Trainer not found');
  });

  it('does not call transactionManager when trainer is not found', async () => {
    trainerRepository = makeMockTrainerRepository(null);
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    await expect(
      useCase.execute(makeValidInput({ trainerId: 'nonexistent-uuid' })),
    ).rejects.toThrow();

    expect(transactionManager.execute).not.toHaveBeenCalled();
  });

  it('does not check trainer when trainerId is not provided', async () => {
    const input = makeValidInput({ trainerId: undefined });
    trainerRepository = makeMockTrainerRepository(null); // would fail if called
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    // Should NOT throw — trainerId is absent so trainerRepository should not be queried
    const result = await useCase.execute(input);

    expect(result.evaluation).toBeDefined();
    expect(trainerRepository.findById).not.toHaveBeenCalled();
  });

  // ── Error: duplicate measurementTypeId ──────────────────────────────────

  it('throws ConflictException when measurements array contains duplicate measurementTypeId', async () => {
    const input = makeValidInput({
      measurements: [
        { measurementTypeId: 'mt-uuid-1', value: 30 },
        { measurementTypeId: 'mt-uuid-1', value: 35 }, // duplicate
      ],
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ConflictException);
  });

  it('ConflictException message mentions "Duplicate measurementTypeId" for duplicate entries', async () => {
    const input = makeValidInput({
      measurements: [
        { measurementTypeId: 'mt-uuid-1', value: 30 },
        { measurementTypeId: 'mt-uuid-1', value: 35 },
      ],
    });

    const error = await useCase.execute(input).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).message).toBe('Duplicate measurementTypeId in measurements');
  });

  it('does not call transactionManager when there are duplicate measurementTypeIds', async () => {
    const input = makeValidInput({
      measurements: [
        { measurementTypeId: 'mt-uuid-1', value: 30 },
        { measurementTypeId: 'mt-uuid-1', value: 35 },
      ],
    });

    await expect(useCase.execute(input)).rejects.toThrow();

    expect(transactionManager.execute).not.toHaveBeenCalled();
  });

  // ── Error: measurementTypeId not found in DB ────────────────────────────

  it('throws NotFoundException when a measurementTypeId in the array does not exist in DB', async () => {
    // Repository returns fewer items than requested → one ID is unknown
    measurementTypeRepository = makeMockMeasurementTypeRepository([]); // no types exist
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    const input = makeValidInput({
      measurements: [{ measurementTypeId: 'nonexistent-mt-uuid', value: 30 }],
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('NotFoundException message says "MeasurementType not found" when an ID is missing', async () => {
    measurementTypeRepository = makeMockMeasurementTypeRepository([]);
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    const error = await useCase
      .execute(makeValidInput({ measurements: [{ measurementTypeId: 'bad-uuid', value: 20 }] }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toBe('MeasurementType not found');
  });

  it('does not call transactionManager when a measurementTypeId is not found', async () => {
    measurementTypeRepository = makeMockMeasurementTypeRepository([]);
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    await expect(
      useCase.execute(makeValidInput({ measurements: [{ measurementTypeId: 'bad-uuid', value: 20 }] })),
    ).rejects.toThrow();

    expect(transactionManager.execute).not.toHaveBeenCalled();
  });

  // ── Happy path — full evaluation with all sub-objects ───────────────────

  it('returns a result with evaluation, bodyComposition, measurements, and dietaryHabits', async () => {
    const result = await useCase.execute(makeValidInput());

    expect(result).toHaveProperty('evaluation');
    expect(result).toHaveProperty('bodyComposition');
    expect(result).toHaveProperty('measurements');
    expect(result).toHaveProperty('dietaryHabits');
  });

  it('returned evaluation has correct personId and evaluationDate', async () => {
    const input = makeValidInput();
    const result = await useCase.execute(input);

    expect(result.evaluation.personId).toBe('person-uuid');
    expect(result.evaluation.evaluationDate).toEqual(new Date('2024-06-01'));
  });

  it('returned evaluation has a valid UUID v4 id', async () => {
    const result = await useCase.execute(makeValidInput());

    expect(result.evaluation.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('returned bodyComposition has correct weightKg and heightM', async () => {
    const result = await useCase.execute(makeValidInput());

    expect(result.bodyComposition.weightKg).toBe(75);
    expect(result.bodyComposition.heightM).toBe(1.78);
  });

  it('returned measurements array has one item with the correct measurementTypeId', async () => {
    const result = await useCase.execute(makeValidInput());

    expect(Array.isArray(result.measurements)).toBe(true);
    expect(result.measurements).toHaveLength(1);
    expect(result.measurements[0].measurementTypeId).toBe('mt-uuid-1');
    expect(result.measurements[0].value).toBe(35);
  });

  it('returned dietaryHabits has the correct description', async () => {
    const result = await useCase.execute(makeValidInput());

    expect(result.dietaryHabits).not.toBeNull();
    expect(result.dietaryHabits!.description).toBe('Balanced diet with proteins and vegetables');
  });

  it('transactionManager.execute is called exactly once on success', async () => {
    await useCase.execute(makeValidInput());

    expect(transactionManager.execute).toHaveBeenCalledTimes(1);
  });

  // ── Happy path — minimal evaluation (no optional fields) ───────────────

  it('returns dietaryHabits as null when dietaryHabits input is not provided', async () => {
    const input = makeValidInput({ dietaryHabits: undefined });
    const result = await useCase.execute(input);

    expect(result.dietaryHabits).toBeNull();
  });

  it('returns measurements as empty array when no measurements are provided', async () => {
    measurementTypeRepository = makeMockMeasurementTypeRepository([]);
    useCase = new CreateEvaluationUseCase(
      personRepository,
      trainerRepository,
      measurementTypeRepository,
      transactionManager,
    );

    const input = makeValidInput({ measurements: [] });
    const result = await useCase.execute(input);

    expect(Array.isArray(result.measurements)).toBe(true);
    expect(result.measurements).toHaveLength(0);
  });

  it('does not call measurementTypeRepository.findAllByIds when measurements array is empty', async () => {
    const input = makeValidInput({ measurements: [] });
    await useCase.execute(input);

    expect(measurementTypeRepository.findAllByIds).not.toHaveBeenCalled();
  });

  it('returns a result without trainerId when no trainerId is provided', async () => {
    const input = makeValidInput({ trainerId: undefined });
    const result = await useCase.execute(input);

    expect(result.evaluation.trainerId).toBeUndefined();
  });

  // ── Property 6: Transactional atomicity ────────────────────────────────

  /**
   * **Propiedad 6: Atomicidad transaccional de Evaluation**
   * Para cualquier input válido, si el transactionManager lanza un error durante
   * la ejecución (simulando un rollback de base de datos), el use case debe
   * propagar ese error. Si la transacción tiene éxito, el resultado siempre
   * contiene los 4 campos: evaluation, bodyComposition, measurements, dietaryHabits.
   *
   * Validates: Requirements 4.2
   */
  it('Propiedad 6: error inside transactionManager propagates to caller (simulates rollback)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 80 }),
        async (errorMessage) => {
          const failingTxManager: TransactionManager = {
            execute: vi.fn().mockRejectedValue(new Error(errorMessage)),
          };

          const uc = new CreateEvaluationUseCase(
            makeMockPersonRepository(),
            makeMockTrainerRepository(),
            makeMockMeasurementTypeRepository(['mt-uuid-1']),
            failingTxManager,
          );

          await expect(uc.execute(makeValidInput())).rejects.toThrow(errorMessage);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('Propiedad 6: error thrown by evaluationRepository.save inside transaction propagates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 80 }),
        async (errorMessage) => {
          const txContext = makeMockTransactionContext();
          (txContext.evaluationRepository.save as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error(errorMessage),
          );

          const failingTxManager = makeMockTransactionManager(txContext);
          const uc = new CreateEvaluationUseCase(
            makeMockPersonRepository(),
            makeMockTrainerRepository(),
            makeMockMeasurementTypeRepository(['mt-uuid-1']),
            failingTxManager,
          );

          await expect(uc.execute(makeValidInput())).rejects.toThrow(errorMessage);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('Propiedad 6: successful transaction always returns all 4 result fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          weightKg: fc.double({ min: 0.1, max: 300, noNaN: true }),
          heightM: fc.double({ min: 0.5, max: 2.5, noNaN: true }),
        }),
        async ({ weightKg, heightM }) => {
          const uc = new CreateEvaluationUseCase(
            makeMockPersonRepository(),
            makeMockTrainerRepository(),
            makeMockMeasurementTypeRepository(['mt-uuid-1']),
            makeMockTransactionManager(),
          );

          const result: EvaluationResult = await uc.execute(
            makeValidInput({ bodyComposition: { weightKg, heightM } }),
          );

          expect(result).toHaveProperty('evaluation');
          expect(result).toHaveProperty('bodyComposition');
          expect(result).toHaveProperty('measurements');
          expect(result).toHaveProperty('dietaryHabits');
          expect(result.evaluation).toBeInstanceOf(Evaluation);
          expect(result.bodyComposition).toBeInstanceOf(BodyComposition);
          expect(Array.isArray(result.measurements)).toBe(true);
        },
      ),
      { numRuns: 30 },
    );
  });
});
