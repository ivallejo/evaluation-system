export class Person {
  constructor(
    public readonly id: string, // UUID
    public firstName: string,
    public lastName: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public documentNumber?: string,
    public birthDate?: Date,
    public sex?: 'male' | 'female' | 'other',
    public childrenCount?: number, // entero >= 0
  ) {}
}
