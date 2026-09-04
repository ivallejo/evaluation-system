export class Trainer {
  constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public active: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
