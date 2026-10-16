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

/** Decides what the log prints for an event. */
export interface LogEventTrackerFactory {
  create(event: Event): Resolution<LogEventTracker>;
}

export interface LogPropertySetterFactory {
  create(property: Property): Resolution<LogPropertySetter>;
}

/** Asks each factory in order and uses the first that answers. Throws if a fallback isn't last. */
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

/** Prints every screen view as a screen record. */
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

/** Fails for any event that reaches it, so the error reporter shows events nobody mapped. */
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
