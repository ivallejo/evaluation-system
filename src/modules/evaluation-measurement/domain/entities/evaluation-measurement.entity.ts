export class EvaluationMeasurement {
  constructor(
    public readonly id: string, // UUID
    public readonly evaluationId: string,
    public readonly measurementTypeId: string,
    public readonly value: number, // decimal
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
