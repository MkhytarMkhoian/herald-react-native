import { AppRegistry } from 'react-native';
import type { Analytics } from '@react-native-firebase/analytics';
import {
  Herald,
  HeraldProvider,
  int,
  type Event,
  type EventParameters,
  type EventTrackerService,
} from '@herald-analytics/core';
import {
  CompositeLogEventTrackerFactory,
  CompositeLogPropertySetterFactory,
  GenericLogEventTrackerFactory,
  GenericLogPropertySetterFactory,
  LogAnalyticsService,
  LogAnalyticsTrackerService,
  ScreenViewLogEventTrackerFactory,
  type AnalyticsLogger,
} from '@herald-analytics/log';

import { firebaseProvider } from './composition-root';

// --8<-- [start:event]
export class CheckoutStarted implements Event {
  readonly name = 'checkout_started';

  constructor(
    readonly plan: string,
    readonly seats: number,
  ) {}

  get parameters(): EventParameters {
    return { plan: this.plan, seats: int(this.seats) };
  }
}
// --8<-- [end:event]

export function createHerald(): Herald {
  // --8<-- [start:herald]
  // Where the log lines go: the console fits as-is.
  const logger: AnalyticsLogger = (message) => console.log(message);

  // Handles events and user properties, using Herald's ready-made factories.
  const logTracker = new LogAnalyticsTrackerService({
    eventTrackerFactory: new CompositeLogEventTrackerFactory([
      new ScreenViewLogEventTrackerFactory(logger), // screen views
      new GenericLogEventTrackerFactory(logger), // every other event
    ]),
    propertySetterFactory: new CompositeLogPropertySetterFactory([
      new GenericLogPropertySetterFactory(logger),
    ]),
  });
  // Handles the rest: start-up, sign-in and sign-out, consent.
  const logService = new LogAnalyticsService(logger);

  const herald = new Herald({
    providers: [
      new HeraldProvider({
        name: 'log',
        events: logTracker,
        properties: logTracker,
        identity: logService,
        lifecycle: logService,
        consent: logService,
      }),
    ],
  });
  // --8<-- [end:herald]
  return herald;
}

export function quickStartWithFirebase(firebaseAnalytics: Analytics): Herald {
  const logger: AnalyticsLogger = (message) => console.log(message);
  const logTracker = new LogAnalyticsTrackerService({
    eventTrackerFactory: new CompositeLogEventTrackerFactory([
      new GenericLogEventTrackerFactory(logger),
    ]),
    propertySetterFactory: new CompositeLogPropertySetterFactory([
      new GenericLogPropertySetterFactory(logger),
    ]),
  });
  const logService = new LogAnalyticsService(logger);
  // --8<-- [start:add-firebase]
  const herald = new Herald({
    providers: [
      new HeraldProvider({
        name: 'log',
        events: logTracker,
        properties: logTracker,
        identity: logService,
        lifecycle: logService,
        consent: logService,
      }),
      firebaseProvider(firebaseAnalytics), // the new line
    ],
  });
  // --8<-- [end:add-firebase]
  return herald;
}

// --8<-- [start:track]
export class CheckoutViewModel {
  constructor(private readonly analytics: EventTrackerService) {}

  onCheckout(plan: string, seats: number): Promise<void> {
    return this.analytics.track(new CheckoutStarted(plan, seats));
  }
}
// --8<-- [end:track]

declare function App(props: { analytics: EventTrackerService }): null;

export function registerApp(): void {
  // --8<-- [start:app]
  // In the app's entry file, which runs once each time the app starts.
  const herald = createHerald();
  herald.start(); // Herald reports a vendor that fails, so there's nothing to catch

  AppRegistry.registerComponent('main', () => () => <App analytics={herald} />);
  // --8<-- [end:app]
}
