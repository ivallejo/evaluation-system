import { DietaryHabits } from '../entities/dietary-habits.entity.js';

export interface DietaryHabitsRepository {
  findByEvaluationId(evaluationId: string): Promise<DietaryHabits | null>;
  save(dietaryHabits: DietaryHabits): Promise<DietaryHabits>;
  update(dietaryHabits: DietaryHabits): Promise<DietaryHabits>;
}
