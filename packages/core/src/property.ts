import { AnalyticsValue, type AnalyticsInput } from './analytics-value';
import { messageOf } from './internal';

/** A value that lasts, such as the app's theme, which vendors attach to later events. */
export interface Property {
  readonly name: string;
  readonly value: AnalyticsInput;
}

/** A property about the person. Vendors with a user profile store it there. */
export interface UserProperty extends Property {
  readonly isUserProperty: true;
}

export function isUserProperty(property: Property): property is UserProperty {
  return 'isUserProperty' in property && property.isUserProperty === true;
}

/** The property's value as a typed value. Throws for a bad one, and names the property. */
export function propertyValueOf(property: Property): AnalyticsValue {
  try {
    return AnalyticsValue.from(property.value);
  } catch (error) {
    throw new TypeError(`Property '${property.name}': ${messageOf(error)}`, { cause: error });
  }
}
