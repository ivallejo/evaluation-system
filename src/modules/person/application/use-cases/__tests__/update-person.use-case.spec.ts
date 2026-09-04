import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  UpdatePersonUseCase,
  type UpdatePersonInput,
} from '../update-person.use-case.js';
import type { PersonRepository } from '../../../domain/repositories/person.repository.js';
import { Person } from '../../../domain/entities/person.entity.js';
import { NotFoundException } from '../../../../../shared/domain/exceptions/not-found.exception.js';
import { ConflictException } from '../../../../../shared/domain/exceptions/conflict.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePerson(overrides?: Partial<Person>): Person {
  return Object.assign(
    new Person(
      'person-uuid-1',
      'Juan',
      'Pérez',
      new Date('2020-01-01'),
      new Date('2020-01-01'),
      'DNI-001',
      new Date('1985-03-10'),
      'male',
      1,
    ),
    overrides,
  );
}

function makeMockRepository(
  overrides?: Partial<PersonRepository>,
): PersonRepository {
  const person = makePerson();
  return {
    findById: vi.fn().mockResolvedValue(person),
    findByDocumentNumber: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation(async (p: Person) => p),
    update: vi.fn().mockImplementation(async (p: Person) => p),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — UpdatePersonUseCase
// ---------------------------------------------------------------------------

describe('UpdatePersonUseCase', () => {
  let repository: PersonRepository;
  let useCase: UpdatePersonUseCase;

  beforeEach(() => {
    repository = makeMockRepository();
    useCase = new UpdatePersonUseCase(repository);
  });

  // ── Happy path ─────────────────────────────────────────────────────────

  it('updates firstName and returns the modified person', async () => {
    const result = await useCase.execute('person-uuid-1', {
      firstName: 'Carlos',
    });

    expect(result.firstName).toBe('Carlos');
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('updates lastName and returns the modified person', async () => {
    const result = await useCase.execute('person-uuid-1', {
      lastName: 'González',
    });

    expect(result.lastName).toBe('González');
  });

  it('updates documentNumber when not already in use by another person', async () => {
    const result = await useCase.execute('person-uuid-1', {
      documentNumber: 'DNI-NEW',
    });

    expect(result.documentNumber).toBe('DNI-NEW');
  });

  it('updates multiple fields at once', async () => {
    const result = await useCase.execute('person-uuid-1', {
      firstName: 'Ana',
      lastName: 'López',
      childrenCount: 3,
    });

    expect(result.firstName).toBe('Ana');
    expect(result.lastName).toBe('López');
    expect(result.childrenCount).toBe(3);
  });

  it('sets updatedAt to a more recent date than original', async () => {
    const originalUpdatedAt = new Date('2020-01-01');
    repository = makeMockRepository({
      findById: vi.fn().mockResolvedValue(
        makePerson({ updatedAt: originalUpdatedAt }),
      ),
    });
    useCase = new UpdatePersonUseCase(repository);

    const result = await useCase.execute('person-uuid-1', {
      firstName: 'Updated',
    });

    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
      originalUpdatedAt.getTime(),
    );
  });

  // ── Only provided fields are updated ──────────────────────────────────

  it('does not change lastName when only firstName is provided', async () => {
    const original = makePerson(); // lastName = 'Pérez'
    repository = makeMockRepository({
      findById: vi.fn().mockResolvedValue(original),
    });
    useCase = new UpdatePersonUseCase(repository);

    const result = await useCase.execute('person-uuid-1', {
      firstName: 'NewName',
    });

    expect(result.lastName).toBe('Pérez');
  });

  it('does not change firstName when only lastName is provided', async () => {
    const original = makePerson(); // firstName = 'Juan'
    repository = makeMockRepository({
      findById: vi.fn().mockResolvedValue(original),
    });
    useCase = new UpdatePersonUseCase(repository);

    const result = await useCase.execute('person-uuid-1', {
      lastName: 'NewLastName',
    });

    expect(result.firstName).toBe('Juan');
  });

  it('does not change documentNumber when it is not in the input', async () => {
    const original = makePerson({ documentNumber: 'DNI-ORIGINAL' });
    repository = makeMockRepository({
      findById: vi.fn().mockResolvedValue(original),
    });
    useCase = new UpdatePersonUseCase(repository);

    const result = await useCase.execute('person-uuid-1', {
      firstName: 'NewName',
    });

    expect(result.documentNumber).toBe('DNI-ORIGINAL');
  });

  it('does not check documentNumber uniqueness when documentNumber is not in the input', async () => {
    await useCase.execute('person-uuid-1', { firstName: 'NewName' });

    expect(repository.findByDocumentNumber).not.toHaveBeenCalled();
  });

  it('preserves sex when not included in input', async () => {
    const original = makePerson({ sex: 'female' });
    repository = makeMockRepository({
      findById: vi.fn().mockResolvedValue(original),
    });
    useCase = new UpdatePersonUseCase(repository);

    const result = await useCase.execute('person-uuid-1', {
      childrenCount: 2,
    });

    expect(result.sex).toBe('female');
  });

  it('preserves childrenCount when not included in input', async () => {
    const original = makePerson({ childrenCount: 5 });
    repository = makeMockRepository({
      findById: vi.fn().mockResolvedValue(original),
    });
    useCase = new UpdatePersonUseCase(repository);

    const result = await useCase.execute('person-uuid-1', {
      firstName: 'NewName',
    });

    expect(result.childrenCount).toBe(5);
  });

  // ── Error: person not found ────────────────────────────────────────────

  it('throws NotFoundException when person id does not exist', async () => {
    repository = makeMockRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new UpdatePersonUseCase(repository);

    await expect(
      useCase.execute('non-existent-id', { firstName: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('NotFoundException message says "Person not found"', async () => {
    repository = makeMockRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new UpdatePersonUseCase(repository);

    const error = await useCase
      .execute('missing-id', { firstName: 'X' })
      .catch((e: unknown) => e);

    expect((error as NotFoundException).message).toBe('Person not found');
  });

  it('does not call update when person is not found', async () => {
    repository = makeMockRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    useCase = new UpdatePersonUseCase(repository);

    await expect(
      useCase.execute('missing-id', { firstName: 'X' }),
    ).rejects.toThrow();

    expect(repository.update).not.toHaveBeenCalled();
  });

  // ── Error: documentNumber belongs to another person ────────────────────

  it('throws ConflictException when documentNumber belongs to a different person', async () => {
    const otherPerson = makePerson({ id: 'OTHER-UUID', documentNumber: 'DNI-TAKEN' });
    repository = makeMockRepository({
      findByDocumentNumber: vi.fn().mockResolvedValue(otherPerson),
    });
    useCase = new UpdatePersonUseCase(repository);

    await expect(
      useCase.execute('person-uuid-1', { documentNumber: 'DNI-TAKEN' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not throw when documentNumber belongs to the same person (self-update)', async () => {
    // findByDocumentNumber returns the same person being updated
    const samePerson = makePerson({ id: 'person-uuid-1', documentNumber: 'DNI-001' });
    repository = makeMockRepository({
      findByDocumentNumber: vi.fn().mockResolvedValue(samePerson),
    });
    useCase = new UpdatePersonUseCase(repository);

    await expect(
      useCase.execute('person-uuid-1', { documentNumber: 'DNI-001' }),
    ).resolves.toBeDefined();
  });

  it('does not call update when documentNumber is already taken by another person', async () => {
    const otherPerson = makePerson({ id: 'OTHER-UUID', documentNumber: 'DNI-TAKEN' });
    repository = makeMockRepository({
      findByDocumentNumber: vi.fn().mockResolvedValue(otherPerson),
    });
    useCase = new UpdatePersonUseCase(repository);

    await expect(
      useCase.execute('person-uuid-1', { documentNumber: 'DNI-TAKEN' }),
    ).rejects.toThrow();

    expect(repository.update).not.toHaveBeenCalled();
  });

  // ── Property-based tests ───────────────────────────────────────────────

  /**
   * **Propiedad 3: PATCH actualiza solo los campos enviados**
   * Para cualquier Person existente y cualquier subconjunto no vacío de campos
   * actualizables, ejecutar UpdatePersonUseCase con ese subconjunto debe modificar
   * únicamente esos campos y dejar todos los demás con los mismos valores previos.
   *
   * Validates: Requirements 1.8
   */
  it('Propiedad 3: PATCH — only provided fields are changed, all others remain unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        // original state
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 30 }),
          lastName: fc.string({ minLength: 1, maxLength: 30 }),
          documentNumber: fc.option(
            fc.string({ minLength: 1, maxLength: 20 }),
            { nil: undefined },
          ),
          sex: fc.option(
            fc.constantFrom(
              'male' as const,
              'female' as const,
              'other' as const,
            ),
            { nil: undefined },
          ),
          childrenCount: fc.option(fc.integer({ min: 0, max: 20 }), {
            nil: undefined,
          }),
        }),
        // update payload (at least one field)
        fc.record({
          newFirstName: fc.option(
            fc.string({ minLength: 1, maxLength: 30 }),
            { nil: undefined },
          ),
          newLastName: fc.option(
            fc.string({ minLength: 1, maxLength: 30 }),
            { nil: undefined },
          ),
        }).filter(({ newFirstName, newLastName }) =>
          newFirstName !== undefined || newLastName !== undefined,
        ),
        async (original, patch) => {
          const personId = 'test-person-uuid';
          const originalPerson = new Person(
            personId,
            original.firstName,
            original.lastName,
            new Date('2020-01-01'),
            new Date('2020-01-01'),
            original.documentNumber,
            undefined,
            original.sex,
            original.childrenCount,
          );

          const repo = makeMockRepository({
            findById: vi.fn().mockResolvedValue(originalPerson),
            findByDocumentNumber: vi.fn().mockResolvedValue(null),
            update: vi.fn().mockImplementation(async (p: Person) => p),
          });
          const uc = new UpdatePersonUseCase(repo);

          const input: UpdatePersonInput = {};
          if (patch.newFirstName !== undefined) input.firstName = patch.newFirstName;
          if (patch.newLastName !== undefined) input.lastName = patch.newLastName;

          const result = await uc.execute(personId, input);

          // Updated fields must reflect new values
          if (input.firstName !== undefined) {
            expect(result.firstName).toBe(input.firstName);
          }
          if (input.lastName !== undefined) {
            expect(result.lastName).toBe(input.lastName);
          }

          // Untouched fields must retain original values
          if (input.firstName === undefined) {
            expect(result.firstName).toBe(original.firstName);
          }
          if (input.lastName === undefined) {
            expect(result.lastName).toBe(original.lastName);
          }

          // Fields never in the patch must remain unchanged
          expect(result.documentNumber).toBe(original.documentNumber);
          expect(result.sex).toBe(original.sex);
          expect(result.childrenCount).toBe(original.childrenCount);
        },
      ),
      { numRuns: 50 },
    );
  });
});
