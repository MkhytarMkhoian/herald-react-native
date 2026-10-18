import { Resolution, type Event, type FallbackFactory } from '@herald-analytics/core';

import type { MetaEventTrackerFactory } from './chain';
import { GenericMetaEventTracker, type MetaEventTracker } from './handlers';
import type { MetaAppEvents } from './values';

/**
 * Logs any event under its own name. It claims everything, so it goes last in a chain. Most apps
 * leave it out and send Meta only their chosen conversions.
 */
export class GenericMetaEventTrackerFactory implements MetaEventTrackerFactory, FallbackFactory {
  readonly isFallback = true;

  constructor(private readonly appEvents: MetaAppEvents) {}

  create(event: Event): Resolution<MetaEventTracker> {
    return Resolution.claimed([new GenericMetaEventTracker(event, this.appEvents)]);
  }

  toString(): string {
    return 'GenericMetaEventTrackerFactory';
  }
}
