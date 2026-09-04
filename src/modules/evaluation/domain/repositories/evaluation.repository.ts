import { Evaluation } from '../entities/evaluation.entity.js';

export interface EvaluationRepository {
  findById(id: string): Promise<Evaluation | null>;
  findByPersonId(personId: string): Promise<Evaluation[]>;
  save(evaluation: Evaluation): Promise<Evaluation>;
}
