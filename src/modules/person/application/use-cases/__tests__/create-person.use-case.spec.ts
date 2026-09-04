import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  CreatePersonUseCase,
  type CreatePersonInput,
} from '../create-person.use-case.js';
import type { PersonRepository } from '../../../domain/repositories/person.repository.js';
import { Person } from '../../../domain/entities/person.entity.js';
import { ConflictException } from '../../../../../shared/domain/exceptions/conflict.exception.js';
import { ValidationException } from '../../../../../shared/domain/exceptions/validation.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockRepository(
  overrides?: Partial<PersonRepository>,
): PersonRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByDocumentNumber: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation(async (p: Person) => p),
    update: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeExistingPerson(overrides?: Partial<Person>): Person {
  return new Person(
    'existing-uuid',
    'Existing',
    'Person',
    new Date('2020-01-01'),
    new Date('2020-01-01'),
    'DNI-EXISTING',
    undefined,
    undefined,
    undefined,
    ...Object.values(overrides ?? {}),
  );
}

// ---------------------------------------------------------------------------
// Unit tests — CreatePersonUseCase
// ---------------------------------------------------------------------------

describe('CreatePersonUseCase', () => {
  let repository: PersonRepository;
  let useCase: CreatePersonUseCase;

  beforeEach(() => {
    repository = makeMockRepository();
    useCase = new CreatePersonUseCase(repository);
  });

  // ── Happy path ─────────────────────────────────────────────────────────

  it('creates a person with minimal required fields and returns a valid UUID', async () => {
    const input: CreatePersonInput = { firstName: 'Juan', lastName: 'Pérez' };

    const result = await useCase.execute(input);

    expect(result.firstName).toBe('Juan');
    expect(result.lastName).toBe('Pérez');
    // UUID v4 pattern
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('creates a person with all optional fields', async () => {
    const birthDate = new Date('1990-05-15');
    const input: CreatePersonInput = {
      firstName: 'Ana',
      lastName: 'García',
      documentNumber: 'DNI-12345',
      birthDate,
      sex: 'female',
      childrenCount: 2,
    };

    const result = await useCase.execute(input);

    expect(result.documentNumber).toBe('DNI-12345');
    expect(result.birthDate).toEqual(birthDate);
    expect(result.sex).toBe('female');
    expect(result.childrenCount).toBe(2);
  });

  it('calls save on the repository exactly once', async () => {
    await useCase.execute({ firstName: 'Luis', lastName: 'Torres' });

    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('creates person without documentNumber without checking uniqueness', async () => {
    await useCase.execute({ firstName: 'Pedro', lastName: 'López' });

    expect(repository.findByDocumentNumber).not.toHaveBeenCalled();
  });

  it('accepts childrenCount = 0', async () => {
    const result = await useCase.execute({
      firstName: 'Carlos',
      lastName: 'Ruiz',
      childrenCount: 0,
    });

    expect(result.childrenCount).toBe(0);
  });

  // ── Error: duplicate documentNumber ───────────────────────────────────

  it('throws ConflictException when documentNumber already exists', async () => {
    repository = makeMockRepository({
      findByDocumentNumber: vi.fn().mockResolvedValue(makeExistingPerson()),
    });
    useCase = new CreatePersonUseCase(repository);

    await expect(
      useCase.execute({
        firstName: 'Ana',
        lastName: 'García',
        documentNumber: 'DNI-EXISTING',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not call save when documentNumber is duplicate', async () => {
    repository = makeMockRepository({
      findByDocumentNumber: vi.fn().mockResolvedValue(makeExistingPerson()),
    });
    useCase = new CreatePersonUseCase(repository);

    await expect(
      useCase.execute({
        firstName: 'Ana',
        lastName: 'García',
        documentNumber: 'DNI-EXISTING',
      }),
    ).rejects.toThrow();

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('ConflictException message identifies the field in conflict', async () => {
    repository = makeMockRepository({
      findByDocumentNumber: vi.fn().mockResolvedValue(makeExistingPerson()),
    });
    useCase = new CreatePersonUseCase(repository);

    const error = await useCase
      .execute({ firstName: 'X', lastName: 'Y', documentNumber: 'DNI-X' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).message).toMatch(/documentNumber/i);
  });

  // ── Error: childrenCount < 0 ───────────────────────────────────────────

  it('throws ValidationException when childrenCount is negative', async () => {
    await expect(
      useCase.execute({
        firstName: 'María',
        lastName: 'Díaz',
        childrenCount: -1,
      }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('throws ValidationException with descriptive message for negative childrenCount', async () => {
    const error = await useCase
      .execute({ firstName: 'X', lastName: 'Y', childrenCount: -5 })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationException);
    expect((error as ValidationException).messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/childrenCount/i)]),
    );
  });

  it('does not call save when childrenCount is invalid', async () => {
    await expect(
      useCase.execute({ firstName: 'X', lastName: 'Y', childrenCount: -1 }),
    ).rejects.toThrow();

    expect(repository.save).not.toHaveBeenCalled();
  });

  // ── Property-based tests ───────────────────────────────────────────────

  /**
   * **Propiedad 1: Round-trip de creación de Persona**
   * Para cualquier conjunto válido de datos de Person (firstName y lastName no vacíos,
   * childrenCount >= 0), al crear la Person vía CreatePersonUseCase el objeto retornado
   * debe tener exactamente los mismos campos que los datos de entrada, más un UUID v4
   * como `id`, y fechas `createdAt`/`updatedAt` definidas.
   *
   * Validates: Requirements 1.1, 1.6, 1.10
   */
  it('Propiedad 1: round-trip — created person preserves all input fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          documentNumber: fc.option(
            fc.string({ minLength: 1, maxLength: 20 }),
            { nil: undefined },
          ),
          childrenCount: fc.option(fc.integer({ min: 0, max: 20 }), {
            nil: undefined,
          }),
          sex: fc.option(
            fc.constantFrom(
              'male' as const,
              'female' as const,
              'other' as const,
            ),
            { nil: undefined },
          ),
        }),
        async (input) => {
          // Fresh repository for each run — no existing documentNumber
          const repo = makeMockRepository({
            findByDocumentNumber: vi.fn().mockResolvedValue(null),
          });
          const uc = new CreatePersonUseCase(repo);

          const result = await uc.execute(input);

          // UUID v4
          expect(result.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          );
          // Required fields preserved
          expect(result.firstName).toBe(input.firstName);
          expect(result.lastName).toBe(input.lastName);
          // Optional fields preserved when provided
          if (input.documentNumber !== undefined) {
            expect(result.documentNumber).toBe(input.documentNumber);
          }
          if (input.childrenCount !== undefined) {
            expect(result.childrenCount).toBe(input.childrenCount);
          }
          if (input.sex !== undefined) {
            expect(result.sex).toBe(input.sex);
          }
          // Timestamps
          expect(result.createdAt).toBeInstanceOf(Date);
          expect(result.updatedAt).toBeInstanceOf(Date);
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * **Propiedad 2: Unicidad de documentNumber en creación**
   * Para cualquier documentNumber string válido que ya exista en el sistema,
   * un nuevo intento de crear una Person con ese mismo documentNumber debe
   * resultar en un ConflictException, y el repositorio no debe llamar a save.
   *
   * Validates: Requirements 1.2
   */
  it('Propiedad 2: uniqueness — creating with existing documentNumber always throws ConflictException', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        async (existingDocNum, firstName, lastName) => {
          const existingPerson = new Person(
            'some-other-uuid',
            'Other',
            'Person',
            new Date(),
            new Date(),
            existingDocNum,
          );

          const repo = makeMockRepository({
            findByDocumentNumber: vi
              .fn()
              .mockResolvedValue(existingPerson),
          });
          const uc = new CreatePersonUseCase(repo);

          await expect(
            uc.execute({ firstName, lastName, documentNumber: existingDocNum }),
          ).rejects.toBeInstanceOf(ConflictException);

          expect(repo.save).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 50 },
    );
  });
});
