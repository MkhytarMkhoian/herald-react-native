import { AnalyticsValue, type AnalyticsInput } from './analytics-value';
import { messageOf } from './internal';

export type EventParameters = Readonly<Record<string, AnalyticsInput>>;

/** Something that happened in the app: a name, and parameters that describe it. */
export interface Event {
  readonly name: string;
  readonly parameters?: EventParameters;
}

/**
 * A screen becoming visible. Its `name` is the screen's name. Vendors that have a screen-view event
 * send it as that.
 */
export interface ScreenViewEvent extends Event {
  readonly isScreenView: true;
}

export function isScreenView(event: Event): event is ScreenViewEvent {
  return 'isScreenView' in event && event.isScreenView === true;
}

/** The event's parameters as typed values. Throws for a bad one, and names it. */
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
