import {
  AnalyticsValue,
  parametersOf,
  propertyValueOf,
  type Event,
  type Identity,
  type Property,
} from '@herald-analytics/core';

import { describeParameters } from './describe';

// One call the fake received. All calls go into one list, in order, so a test can check the order
// across kinds, such as a property set before the event that should carry it. Each record has a
// `kind`, so `toEqual` tells them apart, and prints as the line a failure shows.

export class TrackedRecord {
  readonly kind = 'tracked';
  /** The event's parameters as typed values. */
  readonly parameters: Readonly<Record<string, AnalyticsValue>>;

  /** Throws for a parameter that isn't an analytics value, as a real vendor would. */
  constructor(readonly event: Event) {
    this.parameters = parametersOf(event);
  }

  toString(): string {
    return `event    ${this.event.name}${describeParameters(this.parameters)}`;
  }
}

export class PropertySetRecord {
  readonly kind = 'property';
  /** The property's value as a typed value. */
  readonly value: AnalyticsValue;

  /** Throws for a value that isn't an analytics value, as a real vendor would. */
  constructor(readonly property: Property) {
    this.value = propertyValueOf(property);
  }

  toString(): string {
    return `property ${this.property.name} = ${AnalyticsValue.asString(this.value)}`;
  }
}

export class IdentifiedRecord {
  readonly kind = 'identify';

  constructor(readonly identity: Identity) {}

  toString(): string {
    return `identify ${this.identity.userId}`;
  }
}

export class EnabledSetRecord {
  readonly kind = 'enabled';

  constructor(readonly enabled: boolean) {}

  toString(): string {
    return `enabled  ${this.enabled}`;
  }
}

export class ResetRecord {
  readonly kind = 'reset';

  toString(): string {
    return 'reset';
  }
}

export class StartedRecord {
  readonly kind = 'start';

  toString(): string {
    return 'start';
  }
}

export class FlushedRecord {
  readonly kind = 'flush';

  toString(): string {
    return 'flush';
  }
}

export type AnalyticsRecord =
  | TrackedRecord
  | PropertySetRecord
  | IdentifiedRecord
  | EnabledSetRecord
  | ResetRecord
  | StartedRecord
  | FlushedRecord;
