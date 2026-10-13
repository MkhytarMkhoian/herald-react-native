import type { Event } from './event';
import type { Identity } from './identity';
import type { Property } from './property';

/**
 * Somewhere an {@link Event} can be sent.
 *
 * Vendor adapters, `Herald` and your own decorators implement it. A class that only tracks events
 * should depend on this, not on `Herald`.
 *
 * ```ts
 * // Keeps events with personal data away from `inner`.
 * class ExceptPersonalDataTracker implements EventTrackerService {
 *   constructor(private readonly inner: EventTrackerService) {}
 *
 *   async track(event: Event): Promise<void> {
 *     if (!isPersonalData(event)) await this.inner.track(event);
 *   }
 * }
 * ```
 */
export interface EventTrackerService {
  track(event: Event): Promise<void>;
}

/** Somewhere a {@link Property} can be set. Like {@link EventTrackerService}, for properties. */
export interface PropertyTrackerService {
  set(property: Property): Promise<void>;
}

export interface IdentifiableUserService {
  identify(identity: Identity): Promise<void>;

  /** Forgets the current user. Call it on sign-out. */
  reset(): Promise<void>;
}

/** Starts a vendor and sends what it has buffered. */
export interface AnalyticsLifecycleService {
  /** Starts the vendor SDK. Call it once, when the app starts. */
  start(): Promise<void>;

  /**
   * Asks the vendor to send what it has buffered. Useful when consent is revoked or the app goes to
   * the background.
   */
  flush(): Promise<void>;
}

/**
 * Turns a vendor's data collection on or off.
 *
 * It can't stop what a vendor collects before the first call. Some vendors need their own setting
 * to start with collection off; each vendor package says what it needs.
 */
export interface ConsentService {
  setEnabled(enabled: boolean): Promise<void>;
}
