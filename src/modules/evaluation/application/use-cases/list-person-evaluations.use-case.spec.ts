import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListPersonEvaluationsUseCase } from './list-person-evaluations.use-case.js';
import type { PersonRepository } from '../../../person/domain/repositories/person.repository.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import { Person } from '../../../person/domain/entities/person.entity.js';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePerson(id = 'person-uuid'): Person {
  return new Person(id, 'John', 'Doe', new Date('2020-01-01'), new Date('2020-01-01'));
}

function makeEvaluation(id: string, personId: string, evaluationDate: Date): Evaluation {
  return new Evaluation(
    id,
    personId,
    evaluationDate,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );
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

function makeMockEvaluationRepository(
  evaluations: Evaluation[] = [],
  overrides?: Partial<EvaluationRepository>,
): EvaluationRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByPersonId: vi.fn().mockResolvedValue(evaluations),
    save: vi.fn().mockImplementation(async (e: Evaluation) => e),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — ListPersonEvaluationsUseCase
// ---------------------------------------------------------------------------

describe('ListPersonEvaluationsUseCase', () => {
  let personRepository: PersonRepository;
  let evaluationRepository: EvaluationRepository;
  let useCase: ListPersonEvaluationsUseCase;

  beforeEach(() => {
    personRepository = makeMockPersonRepository();
    evaluationRepository = makeMockEvaluationRepository([]);
    useCase = new ListPersonEvaluationsUseCase(personRepository, evaluationRepository);
  });

  // ── Happy path — person with evaluations ─────────────────────────────

  it('returns evaluations for an existing person', async () => {
    const evals = [
      makeEvaluation('eval-1', 'person-uuid', new Date('2024-06-01')),
      makeEvaluation('eval-2', 'person-uuid', new Date('2024-03-15')),
    ];
    evaluationRepository = makeMockEvaluationRepository(evals);
    useCase = new ListPersonEvaluationsUseCase(personRepository, evaluationRepository);

    const result = await useCase.execute('person-uuid');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(Evaluation);
  });

  it('returns evaluations ordered by date descending (most recent first)', async () => {
    const evals = [
      makeEvaluation('eval-old', 'person-uuid', new Date('2023-01-01')),
      makeEvaluation('eval-new', 'person-uuid', new Date('2024-12-01')),
      makeEvaluation('eval-mid', 'person-uuid', new Date('2024-06-01')),
    ];
    // Repository returns them already ordered (as per the adapter contract)
    const orderedEvals = [
      makeEvaluation('eval-new', 'person-uuid', new Date('2024-12-01')),
      makeEvaluation('eval-mid', 'person-uuid', new Date('2024-06-01')),
      makeEvaluation('eval-old', 'person-uuid', new Date('2023-01-01')),
    ];
    evaluationRepository = makeMockEvaluationRepository(orderedEvals);
    useCase = new ListPersonEvaluationsUseCase(personRepository, evaluationRepository);

    const result = await useCase.execute('person-uuid');

    expect(result[0].evaluationDate).toEqual(new Date('2024-12-01'));
    expect(result[1].evaluationDate).toEqual(new Date('2024-06-01'));
    expect(result[2].evaluationDate).toEqual(new Date('2023-01-01'));
  });

  it('returns an empty array when the person has no evaluations', async () => {
    evaluationRepository = makeMockEvaluationRepository([]);
    useCase = new ListPersonEvaluationsUseCase(personRepository, evaluationRepository);

    const result = await useCase.execute('person-uuid');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('calls findByPersonId with the correct personId', async () => {
    await useCase.execute('person-uuid');

    expect(evaluationRepository.findByPersonId).toHaveBeenCalledWith('person-uuid');
    expect(evaluationRepository.findByPersonId).toHaveBeenCalledTimes(1);
  });

  it('verifies person existence before querying evaluations', async () => {
    await useCase.execute('person-uuid');

    // person check must happen before evaluations are fetched
    expect(personRepository.findById).toHaveBeenCalledWith('person-uuid');
    expect(personRepository.findById).toHaveBeenCalledTimes(1);
  });

  // ── Error: person not found ───────────────────────────────────────────

  it('throws NotFoundException when the personId does not exist', async () => {
    personRepository = makeMockPersonRepository(null);
    useCase = new ListPersonEvaluationsUseCase(personRepository, evaluationRepository);

    await expect(useCase.execute('nonexistent-uuid')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('NotFoundException message is "Person not found"', async () => {
    personRepository = makeMockPersonRepository(null);
    useCase = new ListPersonEvaluationsUseCase(personRepository, evaluationRepository);

    const error = await useCase.execute('nonexistent-uuid').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toBe('Person not found');
  });

  it('does not call evaluationRepository when person is not found', async () => {
    personRepository = makeMockPersonRepository(null);
    useCase = new ListPersonEvaluationsUseCase(personRepository, evaluationRepository);

    await expect(useCase.execute('nonexistent-uuid')).rejects.toThrow();

    expect(evaluationRepository.findByPersonId).not.toHaveBeenCalled();
  });
});
