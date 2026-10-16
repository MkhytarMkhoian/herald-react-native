/** The signed-in user. Printed as text or JSON, it hides `userId`, so logs don't leak it. */
export class Identity {
  constructor(readonly userId: string) {}

  toString(): string {
    return 'Identity(…)';
  }

  toJSON(): string {
    return 'Identity(…)';
  }
}
