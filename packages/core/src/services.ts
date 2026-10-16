import type { Event } from './event';
import type { Identity } from './identity';
import type { Property } from './property';

/** Tracks events. A class that only tracks events should ask for this, not for `Herald`. */
export interface EventTrackerService {
  track(event: Event): Promise<void>;
}

/** Sets properties. */
export interface PropertyTrackerService {
  set(property: Property): Promise<void>;
}

/** Signs the user in and out. */
export interface IdentifiableUserService {
  identify(identity: Identity): Promise<void>;

  /** Forgets the current user. Call it on sign-out. */
  reset(): Promise<void>;
}

/** Starts vendors, and sends what they have waiting. */
export interface AnalyticsLifecycleService {
  /** Call it once, when the app starts. */
  start(): Promise<void>;

  /** Asks the vendor to send what it has waiting now. */
  flush(): Promise<void>;
}

/**
 * Turns data collection on or off. Some vendors collect before the first call unless their own
 * setting turns it off; each vendor package says what it needs.
 */
export interface ConsentService {
  setEnabled(enabled: boolean): Promise<void>;
}
