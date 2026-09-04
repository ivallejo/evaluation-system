import * as fc from 'fast-check';
import { ValidationException } from '../../../../../shared/domain/exceptions/validation.exception.js';
import type { TrainerRepository } from '../../../domain/repositories/trainer.repository.js';
import { CreateTrainerUseCase } from '../create-trainer.use-case.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepository(
  overrides: Partial<TrainerRepository> = {},
): TrainerRepository {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn().mockImplementation((trainer) => Promise.resolve(trainer)),
    ...overrides,
  };
}

function makeUseCase(repo: TrainerRepository = makeRepository()) {
  return new CreateTrainerUseCase(repo);
}

// UUID v4 regex
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('CreateTrainerUseCase', () => {
  describe('happy path', () => {
    it('creates a trainer and returns it with active = true', async () => {
      const useCase = makeUseCase();

      const result = await useCase.execute({
        firstName: 'María',
        lastName: 'González',
      });

      expect(result.active).toBe(true);
    });

    it('assigns a valid UUID v4 as the id', async () => {
      const useCase = makeUseCase();

      const result = await useCase.execute({ firstName: 'Carlos', lastName: 'López' });

      expect(result.id).toMatch(UUID_V4);
    });

    it('sets createdAt and updatedAt to defined Date instances', async () => {
      const useCase = makeUseCase();

      const result = await useCase.execute({ firstName: 'Ana', lastName: 'Martínez' });

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('persists firstName and lastName exactly as provided', async () => {
      const useCase = makeUseCase();

      const result = await useCase.execute({ firstName: 'Pedro', lastName: 'Ramírez' });

      expect(result.firstName).toBe('Pedro');
      expect(result.lastName).toBe('Ramírez');
    });

    it('delegates persistence to the repository save method', async () => {
      const repo = makeRepository();
      const useCase = makeUseCase(repo);

      await useCase.execute({ firstName: 'Luis', lastName: 'Torres' });

      expect(repo.save).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Validation errors
  // -------------------------------------------------------------------------

  describe('validation errors', () => {
    it('throws ValidationException when firstName is missing', async () => {
      const useCase = makeUseCase();

      await expect(
        useCase.execute({ firstName: '', lastName: 'Pérez' }),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('throws ValidationException when lastName is missing', async () => {
      const useCase = makeUseCase();

      await expect(
        useCase.execute({ firstName: 'Juan', lastName: '' }),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('throws ValidationException when both fields are missing', async () => {
      const useCase = makeUseCase();

      await expect(
        useCase.execute({ firstName: '', lastName: '' }),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('includes a descriptive message when firstName is empty', async () => {
      const useCase = makeUseCase();

      const error = await useCase
        .execute({ firstName: '', lastName: 'García' })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ValidationException);
      const messages = (error as ValidationException).messages;
      expect(messages.some((m) => m.toLowerCase().includes('firstname'))).toBe(true);
    });

    it('includes a descriptive message when lastName is empty', async () => {
      const useCase = makeUseCase();

      const error = await useCase
        .execute({ firstName: 'Ana', lastName: '' })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ValidationException);
      const messages = (error as ValidationException).messages;
      expect(messages.some((m) => m.toLowerCase().includes('lastname'))).toBe(true);
    });

    it('throws ValidationException when firstName is only whitespace', async () => {
      const useCase = makeUseCase();

      await expect(
        useCase.execute({ firstName: '   ', lastName: 'Ruiz' }),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('throws ValidationException when lastName is only whitespace', async () => {
      const useCase = makeUseCase();

      await expect(
        useCase.execute({ firstName: 'Elena', lastName: '   ' }),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('does NOT call repository.save when validation fails', async () => {
      const repo = makeRepository();
      const useCase = makeUseCase(repo);

      await useCase.execute({ firstName: '', lastName: '' }).catch(() => {/* expected */});

      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Property 4: Trainer created with active=true by default
  // Validates: Requirements 2.1, 2.6
  // -------------------------------------------------------------------------

  describe('Property 4 — Trainer created has active=true by default', () => {
    /**
     * For ANY valid (firstName, lastName) pair, the Trainer returned by
     * CreateTrainerUseCase must have:
     *   - active === true
     *   - id matching UUID v4 format
     *   - createdAt and updatedAt present as Date instances
     *
     * Validates: Requirements 2.1, 2.6
     */
    it('property: for any valid name pair, active is true, id is UUID v4, timestamps are present', async () => {
      const nonEmptyString = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => s.trim().length > 0);

      await fc.assert(
        fc.asyncProperty(nonEmptyString, nonEmptyString, async (firstName, lastName) => {
          const useCase = makeUseCase();

          const result = await useCase.execute({ firstName, lastName });

          expect(result.active).toBe(true);
          expect(result.id).toMatch(UUID_V4);
          expect(result.createdAt).toBeInstanceOf(Date);
          expect(result.updatedAt).toBeInstanceOf(Date);
        }),
        { numRuns: 100 },
      );
    });
  });
});
