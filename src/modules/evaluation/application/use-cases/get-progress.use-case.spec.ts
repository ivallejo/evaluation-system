import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { GetProgressUseCase } from './get-progress.use-case.js';
import type { PersonRepository } from '../../../person/domain/repositories/person.repository.js';
import type {
  ProgressRecord,
  ProgressRepository,
} from '../../../../shared/domain/repositories/progress.repository.js';
import { Person } from '../../../person/domain/entities/person.entity.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePerson(id = 'person-uuid'): Person {
  return new Person(id, 'John', 'Doe', new Date(), new Date());
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

function makeMockProgressRepository(
  records: ProgressRecord[] = [],
  overrides?: Partial<ProgressRepository>,
): ProgressRepository {
  return {
    findProgressByPersonId: vi.fn().mockResolvedValue(records),
    ...overrides,
  };
}

function makeProgressRecord(overrides?: Partial<ProgressRecord>): ProgressRecord {
  return {
    evaluationDate: new Date('2024-01-01'),
    weightKg: 75,
    bodyFatPercentage: 18,
    muscleMassPercentage: 40,
    waist: 82,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — GetProgressUseCase
// ---------------------------------------------------------------------------

describe('GetProgressUseCase', () => {
  let personRepository: PersonRepository;
  let progressRepository: ProgressRepository;
  let useCase: GetProgressUseCase;

  beforeEach(() => {
    personRepository = makeMockPersonRepository();
    progressRepository = makeMockProgressRepository([]);
    useCase = new GetProgressUseCase(personRepository, progressRepository);
  });

  // ── Error — personId not found ─────────────────────────────────────────

  it('throws NotFoundException when personId does not exist', async () => {
    personRepository = makeMockPersonRepository(null);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    await expect(useCase.execute('nonexistent-uuid')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('NotFoundException message says "Person not found"', async () => {
    personRepository = makeMockPersonRepository(null);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    const error = await useCase.execute('nonexistent-uuid').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toBe('Person not found');
  });

  it('does not call progressRepository when person does not exist', async () => {
    personRepository = makeMockPersonRepository(null);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    await expect(useCase.execute('nonexistent-uuid')).rejects.toThrow();

    expect(progressRepository.findProgressByPersonId).not.toHaveBeenCalled();
  });

  // ── Happy path — full data ─────────────────────────────────────────────

  it('returns all progress records when person exists and records have full data', async () => {
    const records: ProgressRecord[] = [
      makeProgressRecord({ evaluationDate: new Date('2024-01-01'), weightKg: 70, bodyFatPercentage: 18, muscleMassPercentage: 42, waist: 80 }),
      makeProgressRecord({ evaluationDate: new Date('2024-03-01'), weightKg: 72, bodyFatPercentage: 17, muscleMassPercentage: 43, waist: 79 }),
      makeProgressRecord({ evaluationDate: new Date('2024-06-01'), weightKg: 68, bodyFatPercentage: 16, muscleMassPercentage: 45, waist: 77 }),
    ];
    progressRepository = makeMockProgressRepository(records);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    const result = await useCase.execute('person-uuid');

    expect(result).toHaveLength(3);
    expect(result[0].weightKg).toBe(70);
    expect(result[1].weightKg).toBe(72);
    expect(result[2].weightKg).toBe(68);
  });

  it('returns records with correct non-null values when all data is present', async () => {
    const records: ProgressRecord[] = [
      makeProgressRecord({ weightKg: 75.5, bodyFatPercentage: 20.1, muscleMassPercentage: 38.5, waist: 83.2 }),
    ];
    progressRepository = makeMockProgressRepository(records);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    const result = await useCase.execute('person-uuid');

    expect(result[0].weightKg).toBe(75.5);
    expect(result[0].bodyFatPercentage).toBe(20.1);
    expect(result[0].muscleMassPercentage).toBe(38.5);
    expect(result[0].waist).toBe(83.2);
  });

  it('calls findProgressByPersonId with the correct personId', async () => {
    await useCase.execute('person-uuid');

    expect(progressRepository.findProgressByPersonId).toHaveBeenCalledWith('person-uuid');
    expect(progressRepository.findProgressByPersonId).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when person exists but has no evaluations', async () => {
    progressRepository = makeMockProgressRepository([]);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    const result = await useCase.execute('person-uuid');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  // ── Happy path — evaluation without BodyComposition ───────────────────

  it('passes through null bodyComposition fields when evaluation has no BodyComposition', async () => {
    const records: ProgressRecord[] = [
      makeProgressRecord({ weightKg: null, bodyFatPercentage: null, muscleMassPercentage: null, waist: null }),
    ];
    progressRepository = makeMockProgressRepository(records);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    const result = await useCase.execute('person-uuid');

    expect(result[0].weightKg).toBeNull();
    expect(result[0].bodyFatPercentage).toBeNull();
    expect(result[0].muscleMassPercentage).toBeNull();
  });

  it('preserves evaluationDate even when bodyComposition fields are all null', async () => {
    const evalDate = new Date('2024-05-15');
    const records: ProgressRecord[] = [
      makeProgressRecord({ evaluationDate: evalDate, weightKg: null, bodyFatPercentage: null, muscleMassPercentage: null, waist: null }),
    ];
    progressRepository = makeMockProgressRepository(records);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    const result = await useCase.execute('person-uuid');

    expect(result[0].evaluationDate).toEqual(evalDate);
  });

  // ── Happy path — evaluation without WAIST measurement ─────────────────

  it('passes through null waist when evaluation has no WAIST measurement', async () => {
    const records: ProgressRecord[] = [
      makeProgressRecord({ weightKg: 70, bodyFatPercentage: 18, muscleMassPercentage: 40, waist: null }),
    ];
    progressRepository = makeMockProgressRepository(records);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    const result = await useCase.execute('person-uuid');

    expect(result[0].waist).toBeNull();
    expect(result[0].weightKg).toBe(70);
    expect(result[0].bodyFatPercentage).toBe(18);
    expect(result[0].muscleMassPercentage).toBe(40);
  });

  // ── Ordering — use case returns records in repository order ───────────

  it('returns records in the same order returned by the repository (ASC by evaluationDate)', async () => {
    const records: ProgressRecord[] = [
      makeProgressRecord({ evaluationDate: new Date('2024-01-01'), weightKg: 70 }),
      makeProgressRecord({ evaluationDate: new Date('2024-04-01'), weightKg: 72 }),
      makeProgressRecord({ evaluationDate: new Date('2024-08-01'), weightKg: 74 }),
    ];
    progressRepository = makeMockProgressRepository(records);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    const result = await useCase.execute('person-uuid');

    expect(result[0].evaluationDate).toEqual(new Date('2024-01-01'));
    expect(result[1].evaluationDate).toEqual(new Date('2024-04-01'));
    expect(result[2].evaluationDate).toEqual(new Date('2024-08-01'));
  });

  it('does not sort or reorder the records returned by the repository', async () => {
    // Repo already guarantees ASC order — use case must not alter the order
    const dates = [
      new Date('2023-06-01'),
      new Date('2023-09-15'),
      new Date('2024-02-20'),
    ];
    const records = dates.map((d) => makeProgressRecord({ evaluationDate: d }));
    progressRepository = makeMockProgressRepository(records);
    useCase = new GetProgressUseCase(personRepository, progressRepository);

    const result = await useCase.execute('person-uuid');

    result.forEach((r, idx) => {
      expect(r.evaluationDate).toEqual(dates[idx]);
    });
  });

  // ── Propiedad 10: Progreso ordenado ascendentemente ───────────────────

  /**
   * **Propiedad 10: Progreso ordenado ascendentemente**
   * El repositorio garantiza el orden ASC. El use case debe retornar los
   * registros en exactamente el mismo orden en que el repositorio los entrega,
   * sin modificarlo.
   *
   * Validates: Requirements 9.1
   */
  it('Propiedad 10: use case preserves ASC ordering of records returned by the repository', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }), {
          minLength: 0,
          maxLength: 10,
        }),
        async (rawDates) => {
          // Sort ASC to simulate what the repository guarantees
          const sortedDates = [...rawDates].sort((a, b) => a.getTime() - b.getTime());
          const records = sortedDates.map((d) => makeProgressRecord({ evaluationDate: d }));

          const mockPersonRepo = makeMockPersonRepository();
          const mockProgressRepo = makeMockProgressRepository(records);
          const uc = new GetProgressUseCase(mockPersonRepo, mockProgressRepo);

          const result = await uc.execute('person-uuid');

          // The use case must return records in the same order without modification
          expect(result).toHaveLength(sortedDates.length);
          result.forEach((r, idx) => {
            expect(r.evaluationDate.getTime()).toBe(sortedDates[idx].getTime());
          });
        },
      ),
      { numRuns: 30 },
    );
  });

  // ── Propiedad 11: Campos null cuando faltan datos ─────────────────────

  /**
   * **Propiedad 11: Campos null en progreso cuando faltan datos**
   * Para cualquier combinación de campos nullable en ProgressRecord, el use
   * case debe pasar los valores exactamente como los entrega el repositorio:
   * null permanece null, number permanece number.
   *
   * Validates: Requirements 9.3, 9.4
   */
  it('Propiedad 11: use case passes through nullable fields unchanged (null stays null, number stays number)', async () => {
    const nullableNumber = fc.oneof(
      fc.constant(null),
      fc.double({ min: 0.1, max: 300, noNaN: true }),
    );

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record<ProgressRecord>({
            evaluationDate: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }),
            weightKg: nullableNumber,
            bodyFatPercentage: nullableNumber,
            muscleMassPercentage: nullableNumber,
            waist: nullableNumber,
          }),
          { minLength: 0, maxLength: 10 },
        ),
        async (records) => {
          const mockPersonRepo = makeMockPersonRepository();
          const mockProgressRepo = makeMockProgressRepository(records);
          const uc = new GetProgressUseCase(mockPersonRepo, mockProgressRepo);

          const result = await uc.execute('person-uuid');

          expect(result).toHaveLength(records.length);
          result.forEach((r, idx) => {
            // Each nullable field must be identical to the source record
            expect(r.weightKg).toBe(records[idx].weightKg);
            expect(r.bodyFatPercentage).toBe(records[idx].bodyFatPercentage);
            expect(r.muscleMassPercentage).toBe(records[idx].muscleMassPercentage);
            expect(r.waist).toBe(records[idx].waist);
          });
        },
      ),
      { numRuns: 30 },
    );
  });
});
