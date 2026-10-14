import {
  Resolution,
  UnhandledEventError,
  UnhandledPropertyError,
  isScreenView,
  requireFallbackLast,
  type Event,
  type FallbackFactory,
  type Property,
} from '@herald-analytics/core';

import {
  GenericLogEventTracker,
  GenericLogPropertySetter,
  ScreenViewLogEventTracker,
  type AnalyticsLogger,
  type LogEventTracker,
  type LogPropertySetter,
} from './handlers';

/**
 * Decides what the log gets for an event: claimed with the calls to make, dropped to send nothing,
 * or declined to let the next factory decide.
 */
export interface LogEventTrackerFactory {
  create(event: Event): Resolution<LogEventTracker>;
}

export interface LogPropertySetterFactory {
  create(property: Property): Resolution<LogPropertySetter>;
}

/**
 * Asks each factory in order and uses the first answer that isn't a decline. If all decline,
 * nothing is sent. Throws if a fallback factory isn't last.
 */
export class CompositeLogEventTrackerFactory implements LogEventTrackerFactory {
  private readonly factories: readonly LogEventTrackerFactory[];

  constructor(factories: readonly LogEventTrackerFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(event: Event): Resolution<LogEventTracker> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(event));
  }
}

/** Like {@link CompositeLogEventTrackerFactory}, for properties. */
export class CompositeLogPropertySetterFactory implements LogPropertySetterFactory {
  private readonly factories: readonly LogPropertySetterFactory[];

  constructor(factories: readonly LogPropertySetterFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(property: Property): Resolution<LogPropertySetter> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(property));
  }
}

export class GenericLogEventTrackerFactory implements LogEventTrackerFactory, FallbackFactory {
  readonly isFallback = true;

  constructor(private readonly logger: AnalyticsLogger) {}

  create(event: Event): Resolution<LogEventTracker> {
    return Resolution.claimed([new GenericLogEventTracker(event, this.logger)]);
  }

  toString(): string {
    return 'GenericLogEventTrackerFactory';
  }
}

/** Claims every screen view and prints it as a screen record. Declines everything else. */
export class ScreenViewLogEventTrackerFactory implements LogEventTrackerFactory {
  constructor(private readonly logger: AnalyticsLogger) {}

  create(event: Event): Resolution<LogEventTracker> {
    if (!isScreenView(event)) return Resolution.declined();
    return Resolution.claimed([new ScreenViewLogEventTracker(event, this.logger)]);
  }
}

export class GenericLogPropertySetterFactory implements LogPropertySetterFactory, FallbackFactory {
  readonly isFallback = true;

  constructor(private readonly logger: AnalyticsLogger) {}

  create(property: Property): Resolution<LogPropertySetter> {
    return Resolution.claimed([new GenericLogPropertySetter(property, this.logger)]);
  }

  toString(): string {
    return 'GenericLogPropertySetterFactory';
  }
}

/**
 * Fails for any event that reaches it, so the error reporter shows events nobody mapped. Put it
 * last in a chain.
 */
export class RequireMappedLogEventTrackerFactory
  implements LogEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  create(event: Event): Resolution<LogEventTracker> {
    throw new UnhandledEventError(event);
  }

  toString(): string {
    return 'RequireMappedLogEventTrackerFactory';
  }
}

export class RequireMappedLogPropertySetterFactory
  implements LogPropertySetterFactory, FallbackFactory
{
  readonly isFallback = true;

  create(property: Property): Resolution<LogPropertySetter> {
    throw new UnhandledPropertyError(property);
  }

  toString(): string {
    return 'RequireMappedLogPropertySetterFactory';
  }
}
