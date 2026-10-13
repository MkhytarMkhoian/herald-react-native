/**
 * The current user.
 *
 * Printed as text or as JSON, it hides `userId`, so an identity in a message or crash report
 * doesn't leak it. Use `userId` when you really need it.
 */
export class Identity {
  constructor(readonly userId: string) {}

  toString(): string {
    return 'Identity(…)';
  }

  toJSON(): string {
    return 'Identity(…)';
  }
}
