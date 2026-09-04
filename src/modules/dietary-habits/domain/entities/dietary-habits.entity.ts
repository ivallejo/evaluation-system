export class DietaryHabits {
  constructor(
    public readonly id: string,
    public readonly evaluationId: string,
    public description: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
