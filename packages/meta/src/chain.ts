import {
  Resolution,
  UnhandledEventError,
  requireFallbackLast,
  type Event,
  type EventTrackerService,
  type FallbackFactory,
} from '@herald-analytics/core';

import type { MetaEventTracker } from './handlers';

/** Decides what Meta gets for an event. */
export interface MetaEventTrackerFactory {
  create(event: Event): Resolution<MetaEventTracker>;
}

/** Asks each factory in order and uses the first that answers. Throws if a fallback isn't last. */
export class CompositeMetaEventTrackerFactory implements MetaEventTrackerFactory {
  private readonly factories: readonly MetaEventTrackerFactory[];

  constructor(factories: readonly MetaEventTrackerFactory[]) {
    requireFallbackLast(factories);
    this.factories = Object.freeze([...factories]);
  }

  create(event: Event): Resolution<MetaEventTracker> {
    return Resolution.firstOf(this.factories, (factory) => factory.create(event));
  }
}

/** Fails for any event that reaches it, so the error reporter shows events nobody mapped. */
export class RequireMappedMetaEventTrackerFactory
  implements MetaEventTrackerFactory, FallbackFactory
{
  readonly isFallback = true;

  create(event: Event): Resolution<MetaEventTracker> {
    throw new UnhandledEventError(event);
  }

  toString(): string {
    return 'RequireMappedMetaEventTrackerFactory';
  }
}

export interface MetaAnalyticsTrackerServiceOptions {
  readonly eventTrackerFactory: MetaEventTrackerFactory;
}

/** Sends events to Meta, as its factory chain decides. */
export class MetaAnalyticsTrackerService implements EventTrackerService {
  private readonly eventTrackerFactory: MetaEventTrackerFactory;

  constructor(options: MetaAnalyticsTrackerServiceOptions) {
    this.eventTrackerFactory = options.eventTrackerFactory;
  }

  async track(event: Event): Promise<void> {
    for (const handler of this.eventTrackerFactory.create(event).handlers) {
      await handler.track();
    }
  }
}
