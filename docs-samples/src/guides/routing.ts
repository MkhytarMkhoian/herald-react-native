import type { Analytics } from '@react-native-firebase/analytics';
import { Resolution, type Property } from '@herald-analytics/core';
import {
  AdjustToken,
  CompositeAdjustEventTrackerFactory,
  TokenAdjustEventTrackerFactory,
  type AdjustPropertySetter,
  type AdjustPropertySetterFactory,
} from '@herald-analytics/adjust';
import {
  CompositeFirebaseEventTrackerFactory,
  GenericFirebaseEventTrackerFactory,
  ScreenViewFirebaseEventTrackerFactory,
  type FirebaseEventTrackerFactory,
} from '@herald-analytics/firebase';

import { CheckoutCompleted } from '../concepts/factory-chain';
import { AppTheme } from '../concepts/vocabulary';

export function routing(
  firebaseAnalytics: Analytics,
  featureFirebaseFactories: FirebaseEventTrackerFactory[],
): object[] {
  // --8<-- [start:two-kinds]
  // Firebase gets everything: events no factory took are sent under their own name.
  const firebaseEvents = new CompositeFirebaseEventTrackerFactory([
    ...featureFirebaseFactories,
    new ScreenViewFirebaseEventTrackerFactory(firebaseAnalytics),
    new GenericFirebaseEventTrackerFactory(firebaseAnalytics), // everything else
  ]);

  // Adjust gets only events with a dashboard token.
  const adjustEvents = new CompositeAdjustEventTrackerFactory([
    new TokenAdjustEventTrackerFactory([new AdjustToken(CheckoutCompleted, 'abc123')]),
  ]); // nothing at the end: other events aren't sent
  // --8<-- [end:two-kinds]
  return [firebaseEvents, adjustEvents];
}

// --8<-- [start:drop-property]
export class AppAdjustPropertySetterFactory implements AdjustPropertySetterFactory {
  create(property: Property): Resolution<AdjustPropertySetter> {
    if (property instanceof AppTheme) {
      return Resolution.dropped(); // a UI preference, not an attribution signal
    }
    return Resolution.declined();
  }
}
// --8<-- [end:drop-property]
