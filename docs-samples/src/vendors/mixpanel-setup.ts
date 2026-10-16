import { Mixpanel } from 'mixpanel-react-native';
import { HeraldProvider } from '@herald-analytics/core';
import {
  CompositeMixpanelEventTrackerFactory,
  CompositeMixpanelPropertySetterFactory,
  GenericMixpanelEventTrackerFactory,
  GenericMixpanelPropertySetterFactory,
  MixpanelAnalyticsService,
  MixpanelAnalyticsTrackerService,
  ScreenViewMixpanelEventTrackerFactory,
  UserPropertyMixpanelPropertySetterFactory,
} from '@herald-analytics/mixpanel';

export async function mixpanelProvider(projectToken: string): Promise<HeraldProvider> {
  // --8<-- [start:provider]
  const mixpanel = await Mixpanel.init(
    projectToken,
    false, // no automatic events
    true, // opted out by default: silent until consent
  );

  const tracker = new MixpanelAnalyticsTrackerService({
    eventTrackerFactory: new CompositeMixpanelEventTrackerFactory([
      new ScreenViewMixpanelEventTrackerFactory(mixpanel),
      new GenericMixpanelEventTrackerFactory(mixpanel),
    ]),
    propertySetterFactory: new CompositeMixpanelPropertySetterFactory([
      new UserPropertyMixpanelPropertySetterFactory(mixpanel), // people profile: must come first
      new GenericMixpanelPropertySetterFactory(mixpanel), // super properties
    ]),
  });
  const service = new MixpanelAnalyticsService(mixpanel);

  const provider = new HeraldProvider({
    name: 'mixpanel',
    events: tracker,
    properties: tracker,
    identity: service,
    lifecycle: service,
    consent: service,
  });
  // --8<-- [end:provider]
  return provider;
}
