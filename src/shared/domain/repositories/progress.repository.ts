export interface ProgressRecord {
  evaluationDate: Date;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  muscleMassPercentage: number | null;
  waist: number | null;
}

export interface ProgressRepository {
  findProgressByPersonId(personId: string): Promise<ProgressRecord[]>;
}
