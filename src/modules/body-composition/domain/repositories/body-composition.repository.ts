import { BodyComposition } from '../entities/body-composition.entity.js';

export interface BodyCompositionRepository {
  findByEvaluationId(evaluationId: string): Promise<BodyComposition | null>;
  save(bodyComposition: BodyComposition): Promise<BodyComposition>;
}
