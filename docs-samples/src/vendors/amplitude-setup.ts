import * as amplitude from '@amplitude/analytics-react-native';
import { HeraldProvider } from '@herald-analytics/core';
import {
  AmplitudeAnalyticsService,
  AmplitudeAnalyticsTrackerService,
  CompositeAmplitudeEventTrackerFactory,
  CompositeAmplitudePropertySetterFactory,
  GenericAmplitudeEventTrackerFactory,
  GenericAmplitudePropertySetterFactory,
  ScreenViewAmplitudeEventTrackerFactory,
} from '@herald-analytics/amplitude';

export function amplitudeProvider(apiKey: string): HeraldProvider {
  // --8<-- [start:provider]
  amplitude.init(apiKey, undefined, { optOut: true }); // silent until consent

  const tracker = new AmplitudeAnalyticsTrackerService({
    eventTrackerFactory: new CompositeAmplitudeEventTrackerFactory([
      new ScreenViewAmplitudeEventTrackerFactory(amplitude),
      new GenericAmplitudeEventTrackerFactory(amplitude),
    ]),
    propertySetterFactory: new CompositeAmplitudePropertySetterFactory([
      new GenericAmplitudePropertySetterFactory(amplitude),
    ]),
  });
  const service = new AmplitudeAnalyticsService(amplitude);

  const provider = new HeraldProvider({
    name: 'amplitude',
    events: tracker,
    properties: tracker,
    identity: service,
    lifecycle: service,
    consent: service,
  });
  // --8<-- [end:provider]
  return provider;
}
