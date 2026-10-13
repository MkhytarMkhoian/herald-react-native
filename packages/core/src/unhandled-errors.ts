import type { Event } from './event';
import { nameOf } from './internal';
import type { Property } from './property';

/**
 * Thrown by a `RequireMapped` factory when no factory claimed an event.
 *
 * The message names the event and its class. In release builds the minifier renames classes, but
 * not the event name.
 */
export class UnhandledEventError extends Error {
  constructor(readonly event: Event) {
    super(
      `No factory claimed event '${event.name}' (${nameOf(event)}). ` +
        'Add a factory for it, or end the chain with a generic factory to send it as-is.',
    );
    this.name = 'UnhandledEventError';
  }
}

/** Like {@link UnhandledEventError}, for properties. */
export class UnhandledPropertyError extends Error {
  constructor(readonly property: Property) {
    super(
      `No factory claimed property '${property.name}' (${nameOf(property)}). ` +
        'Add a factory for it, or end the chain with a generic factory to set it as-is.',
    );
    this.name = 'UnhandledPropertyError';
  }
}
