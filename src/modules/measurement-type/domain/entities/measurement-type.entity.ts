export type MeasurementCategory = 'superior' | 'inferior';

export class MeasurementType {
  constructor(
    public readonly id: string, // UUID
    public code: string, // unique
    public name: string,
    public unit: string,
    public category: MeasurementCategory,
    public active: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
