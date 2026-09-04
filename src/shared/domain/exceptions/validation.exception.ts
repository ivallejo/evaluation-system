export class ValidationException extends Error {
  constructor(public readonly messages: string[]) {
    super(messages.join(', '));
    this.name = 'ValidationException';
  }
}
