import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetEvaluationUseCase } from './get-evaluation.use-case.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvaluation(id = 'evaluation-uuid'): Evaluation {
  return new Evaluation(
    id,
    'person-uuid',
    new Date('2024-06-01'),
    new Date('2024-06-01'),
    new Date('2024-06-01'),
  );
}

function makeMockRepository(
  existing: Evaluation | null = makeEvaluation(),
  overrides?: Partial<EvaluationRepository>,
): EvaluationRepository {
  return {
    findById: vi.fn().mockResolvedValue(existing),
    findByPersonId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation(async (e: Evaluation) => e),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — GetEvaluationUseCase
// ---------------------------------------------------------------------------

describe('GetEvaluationUseCase', () => {
  let repository: EvaluationRepository;
  let useCase: GetEvaluationUseCase;

  beforeEach(() => {
    repository = makeMockRepository();
    useCase = new GetEvaluationUseCase(repository);
  });

  // ── Happy path ────────────────────────────────────────────────────────

  it('returns the evaluation when the ID exists', async () => {
    const result = await useCase.execute('evaluation-uuid');

    expect(result).toBeInstanceOf(Evaluation);
    expect(result.id).toBe('evaluation-uuid');
  });

  it('returns the evaluation with all correct fields', async () => {
    const evaluation = new Evaluation(
      'eval-abc',
      'person-xyz',
      new Date('2024-03-15'),
      new Date('2024-03-15'),
      new Date('2024-03-15'),
      'trainer-123',
      'Lose weight',
      'beginner',
    );
    repository = makeMockRepository(evaluation);
    useCase = new GetEvaluationUseCase(repository);

    const result = await useCase.execute('eval-abc');

    expect(result.personId).toBe('person-xyz');
    expect(result.trainerId).toBe('trainer-123');
    expect(result.objective).toBe('Lose weight');
    expect(result.trainingLevel).toBe('beginner');
    expect(result.evaluationDate).toEqual(new Date('2024-03-15'));
  });

  it('calls findById on the repository with the provided ID', async () => {
    await useCase.execute('evaluation-uuid');

    expect(repository.findById).toHaveBeenCalledWith('evaluation-uuid');
    expect(repository.findById).toHaveBeenCalledTimes(1);
  });

  // ── Error: evaluation not found ───────────────────────────────────────

  it('throws NotFoundException when the ID does not exist', async () => {
    repository = makeMockRepository(null);
    useCase = new GetEvaluationUseCase(repository);

    await expect(useCase.execute('nonexistent-uuid')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('NotFoundException message is "Evaluation not found"', async () => {
    repository = makeMockRepository(null);
    useCase = new GetEvaluationUseCase(repository);

    const error = await useCase.execute('nonexistent-uuid').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toBe('Evaluation not found');
  });

  it('does not call other repository methods when evaluation is not found', async () => {
    repository = makeMockRepository(null);
    useCase = new GetEvaluationUseCase(repository);

    await expect(useCase.execute('nonexistent-uuid')).rejects.toThrow();

    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.findByPersonId).not.toHaveBeenCalled();
  });
});
