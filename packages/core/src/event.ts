import { AnalyticsValue, type AnalyticsInput } from './analytics-value';
import { messageOf } from './internal';

export type EventParameters = Readonly<Record<string, AnalyticsInput>>;

/**
 * Something that happened in the app. `name` identifies it and `parameters` carries its data.
 *
 * ```ts
 * class CheckoutStarted implements Event {
 *   readonly name = 'checkout_started';
 *
 *   constructor(readonly plan: string, readonly seats: number) {}
 *
 *   get parameters(): EventParameters {
 *     return { plan: this.plan, seats: int(this.seats) };
 *   }
 * }
 * ```
 */
export interface Event {
  readonly name: string;
  readonly parameters?: EventParameters;
}

/**
 * A screen becoming visible. Its `name` is the screen's name.
 *
 * Vendors with a screen-view event of their own send it that way. To show a different name in one
 * vendor's screen reports, put a factory for that event before the vendor's screen-view factory.
 *
 * ```ts
 * class ProductViewed implements ScreenViewEvent {
 *   readonly name = 'product';
 *   readonly isScreenView = true;
 * }
 * ```
 */
export interface ScreenViewEvent extends Event {
  readonly isScreenView: true;
}

export function isScreenView(event: Event): event is ScreenViewEvent {
  return 'isScreenView' in event && event.isScreenView === true;
}

/** The event's parameters as typed values, for vendors. Throws, naming the parameter, for a bad one. */
export function parametersOf(event: Event): Readonly<Record<string, AnalyticsValue>> {
  const parameters: Record<string, AnalyticsValue> = {};
  for (const [key, input] of Object.entries(event.parameters ?? {})) {
    try {
      parameters[key] = AnalyticsValue.from(input);
    } catch (error) {
      throw new TypeError(`Parameter '${key}' of event '${event.name}': ${messageOf(error)}`, {
        cause: error,
      });
    }
  }
  return Object.freeze(parameters);
}
