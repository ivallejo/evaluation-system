export class Evaluation {
  constructor(
    public readonly id: string,
    public readonly personId: string,
    public readonly evaluationDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly trainerId?: string,
    public readonly objective?: string,
    public readonly trainingLevel?: string,
    public readonly preExistingInjuries?: string,
    public readonly importantMedicalDiagnosis?: string,
    public readonly otherComments?: string,
  ) {}
}
