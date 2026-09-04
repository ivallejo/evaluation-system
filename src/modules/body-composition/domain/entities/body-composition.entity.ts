export class BodyComposition {
  constructor(
    public readonly id: string,
    public readonly evaluationId: string,
    public readonly weightKg: number, // decimal > 0
    public readonly heightM: number, // decimal > 0
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly bmi?: number,
    public readonly bodyFatPercentage?: number, // 0-100
    public readonly muscleMassPercentage?: number, // 0-100
    public readonly idealWeightKg?: number,
    public readonly idealBmi?: number,
    public readonly idealBodyFatPercentage?: number,
  ) {}
}
