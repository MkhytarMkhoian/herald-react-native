// Each operation holds names only, never values, so no personal data reaches the error reporter.
// Each writes its own toString, because release builds rename classes.

export class TrackOperation {
  constructor(readonly eventName: string) {}

  toString(): string {
    return `Track(${this.eventName})`;
  }
}

export class SetPropertyOperation {
  constructor(readonly propertyName: string) {}

  toString(): string {
    return `SetProperty(${this.propertyName})`;
  }
}

export class SetEnabledOperation {
  constructor(readonly enabled: boolean) {}

  toString(): string {
    return `SetEnabled(${this.enabled})`;
  }
}

export class IdentifyOperation {
  toString(): string {
    return 'Identify';
  }
}

export class ResetOperation {
  toString(): string {
    return 'Reset';
  }
}

export class StartOperation {
  toString(): string {
    return 'Start';
  }
}

export class FlushOperation {
  toString(): string {
    return 'Flush';
  }
}

/** Which call failed. Check which one with `instanceof`, such as `instanceof TrackOperation`. */
export type AnalyticsOperation =
  | TrackOperation
  | SetPropertyOperation
  | SetEnabledOperation
  | IdentifyOperation
  | ResetOperation
  | StartOperation
  | FlushOperation;
