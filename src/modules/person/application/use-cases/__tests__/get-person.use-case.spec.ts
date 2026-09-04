import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPersonUseCase } from '../get-person.use-case.js';
import type { PersonRepository } from '../../../domain/repositories/person.repository.js';
import { Person } from '../../../domain/entities/person.entity.js';
import { NotFoundException } from '../../../../../shared/domain/exceptions/not-found.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePerson(id = 'person-uuid'): Person {
  return new Person(
    id,
    'John',
    'Doe',
    new Date('2020-01-01'),
    new Date('2020-01-01'),
  );
}

function makeMockRepository(
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

// ---------------------------------------------------------------------------
// Unit tests — GetPersonUseCase
// ---------------------------------------------------------------------------

describe('GetPersonUseCase', () => {
  let repository: PersonRepository;
  let useCase: GetPersonUseCase;

  beforeEach(() => {
    repository = makeMockRepository();
    useCase = new GetPersonUseCase(repository);
  });

  // ── Happy path ────────────────────────────────────────────────────────

  it('returns the person when the ID exists', async () => {
    const result = await useCase.execute('person-uuid');

    expect(result).toBeInstanceOf(Person);
    expect(result.id).toBe('person-uuid');
  });

  it('returns the person with all correct fields', async () => {
    const person = new Person(
      'abc-123',
      'Jane',
      'Smith',
      new Date('2021-03-10'),
      new Date('2021-03-10'),
      'DNI-9999',
      new Date('1990-06-15'),
      'female',
      1,
    );
    repository = makeMockRepository(person);
    useCase = new GetPersonUseCase(repository);

    const result = await useCase.execute('abc-123');

    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Smith');
    expect(result.documentNumber).toBe('DNI-9999');
    expect(result.sex).toBe('female');
    expect(result.childrenCount).toBe(1);
  });

  it('calls findById on the repository with the provided ID', async () => {
    await useCase.execute('person-uuid');

    expect(repository.findById).toHaveBeenCalledWith('person-uuid');
    expect(repository.findById).toHaveBeenCalledTimes(1);
  });

  // ── Error: person not found ───────────────────────────────────────────

  it('throws NotFoundException when the ID does not exist', async () => {
    repository = makeMockRepository(null);
    useCase = new GetPersonUseCase(repository);

    await expect(useCase.execute('nonexistent-uuid')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('NotFoundException message is "Person not found"', async () => {
    repository = makeMockRepository(null);
    useCase = new GetPersonUseCase(repository);

    const error = await useCase.execute('nonexistent-uuid').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toBe('Person not found');
  });

  it('does not call other repository methods when person is not found', async () => {
    repository = makeMockRepository(null);
    useCase = new GetPersonUseCase(repository);

    await expect(useCase.execute('nonexistent-uuid')).rejects.toThrow();

    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.findAll).not.toHaveBeenCalled();
  });
});
