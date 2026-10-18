import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import { HeraldProvider, Resolution, parametersOf, type Event } from '@herald-analytics/core';
import {
  CompositeMetaEventTrackerFactory,
  MetaAnalyticsService,
  MetaAnalyticsTrackerService,
  MetaPurchaseEvent,
  PurchaseMetaEventTracker,
  toMetaParameters,
  type MetaAppEvents,
  type MetaEventTracker,
  type MetaEventTrackerFactory,
} from '@herald-analytics/meta';

import { CheckoutCompleted } from '../concepts/factory-chain';
import { PlanSelected } from '../concepts/vocabulary';

export function metaProvider(featureFactories: MetaEventTrackerFactory[]): HeraldProvider {
  // --8<-- [start:provider]
  const service = new MetaAnalyticsService({ appEvents: AppEventsLogger, settings: Settings });

  const tracker = new MetaAnalyticsTrackerService({
    // Your conversions. Nothing at the end, so other events aren't sent.
    eventTrackerFactory: new CompositeMetaEventTrackerFactory(featureFactories),
  });

  const provider = new HeraldProvider({
    name: 'meta',
    events: tracker, // no properties: Meta keeps no user attributes
    identity: service,
    lifecycle: service,
    consent: service,
  });
  // --8<-- [end:provider]
  return provider;
}

// --8<-- [start:conversions]
export class CheckoutMetaEventTrackerFactory implements MetaEventTrackerFactory {
  constructor(private readonly appEvents: MetaAppEvents) {}

  create(event: Event): Resolution<MetaEventTracker> {
    // A purchase: Meta's fb_mobile_purchase, which it counts as revenue.
    if (event instanceof CheckoutCompleted) {
      const purchase = new MetaPurchaseEvent({
        name: event.name,
        amount: event.value,
        currency: event.currency,
        parameters: event.parameters,
      });
      return Resolution.claimed([new PurchaseMetaEventTracker(purchase, this.appEvents)]);
    }
    // Any other conversion, under one of Meta's standard names.
    if (event instanceof PlanSelected) {
      return Resolution.claimed([new InitiatedCheckoutTracker(event, this.appEvents)]);
    }
    return Resolution.declined();
  }
}

class InitiatedCheckoutTracker implements MetaEventTracker {
  constructor(
    private readonly event: Event,
    private readonly appEvents: MetaAppEvents,
  ) {}

  async track(): Promise<void> {
    this.appEvents.logEvent(
      AppEventsLogger.AppEvents.InitiatedCheckout,
      toMetaParameters(parametersOf(this.event)),
    );
  }
}
// --8<-- [end:conversions]
