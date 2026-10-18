import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import {
  HeraldProvider,
  Resolution,
  parametersOf,
  type ConsentService,
  type Event,
  type EventTrackerService,
} from '@herald-analytics/core';
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

export function gatedMetaProvider(featureFactories: MetaEventTrackerFactory[]): HeraldProvider {
  const tracker = new MetaAnalyticsTrackerService({
    eventTrackerFactory: new CompositeMetaEventTrackerFactory(featureFactories),
  });
  const service = new MetaAnalyticsService({ appEvents: AppEventsLogger, settings: Settings });
  // --8<-- [start:gate]
  const gate = new ConsentGate(tracker, service);

  const provider = new HeraldProvider({
    name: 'meta',
    events: gate, // dropped while consent is off
    identity: service,
    lifecycle: service,
    consent: gate, // keeps the answer, then turns Meta's own switch
  });
  // --8<-- [end:gate]
  return provider;
}

// --8<-- [start:gate-class]
/**
 * Meta's own switch doesn't stop the events your app logs, so this drops them while consent is off.
 */
export class ConsentGate implements EventTrackerService, ConsentService {
  private enabled = false;

  constructor(
    private readonly events: EventTrackerService,
    private readonly consent: ConsentService,
  ) {}

  async track(event: Event): Promise<void> {
    if (this.enabled) await this.events.track(event);
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    await this.consent.setEnabled(enabled);
  }
}
// --8<-- [end:gate-class]

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
