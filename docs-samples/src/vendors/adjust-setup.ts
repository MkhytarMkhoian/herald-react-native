import { AdjustConfig } from 'react-native-adjust';
import { HeraldProvider } from '@herald-analytics/core';
import {
  AdjustAnalyticsService,
  AdjustAnalyticsTrackerService,
  AdjustToken,
  CompositeAdjustEventTrackerFactory,
  CompositeAdjustPropertySetterFactory,
  GenericAdjustPropertySetterFactory,
  TokenAdjustEventTrackerFactory,
  type AdjustEventTrackerFactory,
} from '@herald-analytics/adjust';

import { CheckoutCompleted } from '../concepts/factory-chain';

export function adjustProvider(featureFactories: AdjustEventTrackerFactory[]): HeraldProvider {
  // --8<-- [start:provider]
  const config = new AdjustConfig('YOUR_APP_TOKEN', AdjustConfig.EnvironmentProduction);

  const tracker = new AdjustAnalyticsTrackerService({
    eventTrackerFactory: new CompositeAdjustEventTrackerFactory([
      ...featureFactories, // revenue and custom mappings first
      new TokenAdjustEventTrackerFactory([new AdjustToken(CheckoutCompleted, 'abc123')]),
    ]), // nothing at the end: only tokened events are sent
    propertySetterFactory: new CompositeAdjustPropertySetterFactory([
      new GenericAdjustPropertySetterFactory(),
    ]),
  });
  // Initialises Adjust itself, silent until consent. Don't call Adjust.initSdk yourself.
  const service = new AdjustAnalyticsService(config);

  const provider = new HeraldProvider({
    name: 'adjust',
    events: tracker,
    properties: tracker,
    identity: service,
    lifecycle: service,
    consent: service,
  });
  // --8<-- [end:provider]
  return provider;
}
