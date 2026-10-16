import { Identity, type IdentifiableUserService } from '@herald-analytics/core';

export interface Session {
  readonly userId?: string;
}

// --8<-- [start:session]
export class AnalyticsIdentity {
  constructor(private readonly identity: IdentifiableUserService) {}

  onSignedIn(userId: string): Promise<void> {
    return this.identity.identify(new Identity(userId));
  }

  onSignedOut(): Promise<void> {
    return this.identity.reset();
  }

  /** Call it at every app start: some vendors forget the user between launches. */
  async restore(session: Session): Promise<void> {
    if (session.userId !== undefined) await this.identity.identify(new Identity(session.userId));
  }
}
// --8<-- [end:session]
