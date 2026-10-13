import { AnalyticsValue, type AnalyticsInput } from './analytics-value';
import { messageOf } from './internal';

/**
 * A lasting attribute, such as the user's plan, that vendors attach to later events.
 *
 * ```ts
 * class PurchaseCount implements Property {
 *   readonly name = 'total_purchases';
 *
 *   constructor(readonly count: number) {}
 *
 *   get value() {
 *     return int(this.count);
 *   }
 * }
 * ```
 */
export interface Property {
  readonly name: string;
  readonly value: AnalyticsInput;
}

/** A property about the person, not the session. Vendors with a user profile store it there. */
export interface UserProperty extends Property {
  readonly isUserProperty: true;
}

export function isUserProperty(property: Property): property is UserProperty {
  return 'isUserProperty' in property && property.isUserProperty === true;
}

/** The property's value as a typed value, for vendors. Throws, naming the property, for a bad one. */
export function propertyValueOf(property: Property): AnalyticsValue {
  try {
    return AnalyticsValue.from(property.value);
  } catch (error) {
    throw new TypeError(`Property '${property.name}': ${messageOf(error)}`, { cause: error });
  }
}
