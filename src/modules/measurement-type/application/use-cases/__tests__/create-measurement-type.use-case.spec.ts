import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  CreateMeasurementTypeUseCase,
  type CreateMeasurementTypeInput,
} from '../create-measurement-type.use-case.js';
import type { MeasurementTypeRepository } from '../../../domain/repositories/measurement-type.repository.js';
import { MeasurementType } from '../../../domain/entities/measurement-type.entity.js';
import { ConflictException } from '../../../../../shared/domain/exceptions/conflict.exception.js';
import { ValidationException } from '../../../../../shared/domain/exceptions/validation.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockRepository(
  overrides?: Partial<MeasurementTypeRepository>,
): MeasurementTypeRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByCode: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    findAllByIds: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation(async (mt: MeasurementType) => mt),
    ...overrides,
  };
}

function makeExistingMeasurementType(
  code = 'EXISTING_CODE',
): MeasurementType {
  return new MeasurementType(
    'existing-uuid',
    code,
    'Existing Name',
    'cm',
    'superior',
    true,
    new Date('2020-01-01'),
    new Date('2020-01-01'),
  );
}

// ---------------------------------------------------------------------------
// Unit tests — CreateMeasurementTypeUseCase
// ---------------------------------------------------------------------------

describe('CreateMeasurementTypeUseCase', () => {
  let repository: MeasurementTypeRepository;
  let useCase: CreateMeasurementTypeUseCase;

  beforeEach(() => {
    repository = makeMockRepository();
    useCase = new CreateMeasurementTypeUseCase(repository);
  });

  // ── Happy path ─────────────────────────────────────────────────────────

  it('creates a MeasurementType with valid inputs and active=true', async () => {
    const input: CreateMeasurementTypeInput = {
      code: 'BICEP_RELAXED',
      name: 'Bícep Relajado',
      unit: 'cm',
      category: 'superior',
    };

    const result = await useCase.execute(input);

    expect(result.code).toBe('BICEP_RELAXED');
    expect(result.name).toBe('Bícep Relajado');
    expect(result.unit).toBe('cm');
    expect(result.category).toBe('superior');
    expect(result.active).toBe(true);
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('creates a MeasurementType with category inferior', async () => {
    const input: CreateMeasurementTypeInput = {
      code: 'HIPS',
      name: 'Caderas',
      unit: 'cm',
      category: 'inferior',
    };

    const result = await useCase.execute(input);

    expect(result.category).toBe('inferior');
    expect(result.active).toBe(true);
  });

  it('calls repository.save exactly once on success', async () => {
    await useCase.execute({ code: 'WAIST', name: 'Cintura', unit: 'cm', category: 'superior' });

    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('checks for code uniqueness before saving', async () => {
    await useCase.execute({ code: 'NECK', name: 'Cuello', unit: 'cm', category: 'superior' });

    expect(repository.findByCode).toHaveBeenCalledWith('NECK');
  });

  // ── Error: duplicate code ──────────────────────────────────────────────

  it('throws ConflictException when code already exists', async () => {
    repository = makeMockRepository({
      findByCode: vi.fn().mockResolvedValue(makeExistingMeasurementType()),
    });
    useCase = new CreateMeasurementTypeUseCase(repository);

    await expect(
      useCase.execute({ code: 'EXISTING_CODE', name: 'X', unit: 'cm', category: 'superior' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not call save when code is duplicate', async () => {
    repository = makeMockRepository({
      findByCode: vi.fn().mockResolvedValue(makeExistingMeasurementType()),
    });
    useCase = new CreateMeasurementTypeUseCase(repository);

    await expect(
      useCase.execute({ code: 'EXISTING_CODE', name: 'X', unit: 'cm', category: 'superior' }),
    ).rejects.toThrow();

    expect(repository.save).not.toHaveBeenCalled();
  });

  // ── Error: invalid category ────────────────────────────────────────────

  it('throws ValidationException for an invalid category', async () => {
    await expect(
      useCase.execute({ code: 'NEW_CODE', name: 'X', unit: 'cm', category: 'invalid' }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('throws ValidationException before checking code uniqueness when category is invalid', async () => {
    await expect(
      useCase.execute({ code: 'NEW_CODE', name: 'X', unit: 'cm', category: 'SUPERIOR' }),
    ).rejects.toBeInstanceOf(ValidationException);

    // Category validation fires before repository access
    expect(repository.findByCode).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('ValidationException messages mention allowed categories', async () => {
    const error = await useCase
      .execute({ code: 'X', name: 'X', unit: 'cm', category: 'bad' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationException);
    const messages = (error as ValidationException).messages;
    expect(messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/superior|inferior/i)]),
    );
  });

  it('rejects empty string as category', async () => {
    await expect(
      useCase.execute({ code: 'X', name: 'X', unit: 'cm', category: '' }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  // ── Property-based tests ───────────────────────────────────────────────

  /**
   * **Propiedad 5: Unicidad de code en MeasurementType**
   * Para cualquier code string válido que ya exista en el catálogo de MeasurementTypes,
   * un nuevo intento de crear un MeasurementType con ese mismo code debe resultar en un
   * ConflictException, y el total de MeasurementTypes no debe haber aumentado (save no
   * es llamado).
   *
   * Validates: Requirements 3.2
   */
  it('Propiedad 5: unicidad de code — creating with existing code always throws ConflictException and never calls save', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('cm', 'kg', 'mm', 'in'),
        fc.constantFrom('superior' as const, 'inferior' as const),
        async (existingCode, name, unit, unitValue, category) => {
          const existing = makeExistingMeasurementType(existingCode);
          const repo = makeMockRepository({
            findByCode: vi.fn().mockResolvedValue(existing),
          });
          const uc = new CreateMeasurementTypeUseCase(repo);

          await expect(
            uc.execute({ code: existingCode, name, unit: unitValue, category }),
          ).rejects.toBeInstanceOf(ConflictException);

          expect(repo.save).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * For any valid (code, name, unit, category) combo where code is unique,
   * creation always succeeds and the resulting object has active=true,
   * a valid UUID, and the exact inputs preserved.
   *
   * Validates: Requirements 3.1, 3.8
   */
  it('Propiedad 5 (complementaria): valid unique inputs always produce active=true MeasurementType preserving all fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('superior' as const, 'inferior' as const),
        async (code, name, unit, category) => {
          const repo = makeMockRepository({
            findByCode: vi.fn().mockResolvedValue(null),
          });
          const uc = new CreateMeasurementTypeUseCase(repo);

          const result = await uc.execute({ code, name, unit, category });

          expect(result.active).toBe(true);
          expect(result.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          );
          expect(result.code).toBe(code);
          expect(result.name).toBe(name);
          expect(result.unit).toBe(unit);
          expect(result.category).toBe(category);
          expect(result.createdAt).toBeInstanceOf(Date);
          expect(result.updatedAt).toBeInstanceOf(Date);
        },
      ),
      { numRuns: 50 },
    );
  });
});
