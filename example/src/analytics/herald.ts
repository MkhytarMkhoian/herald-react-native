import { Herald, HeraldProvider } from '@herald-analytics/core';
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

import type { TimelineAnalytics } from './timeline';

/**
 * The composition root: the one place that knows which vendors the app uses.
 *
 * A real app adds its vendors here, such as `@herald-analytics/firebase`, each as one more
 * `HeraldProvider`. Nothing else in the app changes.
 */
export function buildHerald(timeline: TimelineAnalytics): Herald {
  const logger: AnalyticsLogger = (message) => console.log(message);
  const logTracker = new LogAnalyticsTrackerService({
    eventTrackerFactory: new CompositeLogEventTrackerFactory([
      new ScreenViewLogEventTrackerFactory(logger),
      new GenericLogEventTrackerFactory(logger),
    ]),
    propertySetterFactory: new CompositeLogPropertySetterFactory([
      new GenericLogPropertySetterFactory(logger),
    ]),
  });
  const logService = new LogAnalyticsService(logger);

  return new Herald({
    providers: [
      // Debug builds only: the log prints the user id as-is.
      ...(__DEV__
        ? [
            new HeraldProvider({
              name: 'log',
              events: logTracker,
              properties: logTracker,
              identity: logService,
              lifecycle: logService,
              consent: logService,
            }),
          ]
        : []),
      new HeraldProvider({
        name: 'timeline',
        events: timeline,
        properties: timeline,
        identity: timeline,
        lifecycle: timeline,
        consent: timeline,
      }),
    ],
    errorReporter: (failure) => console.warn(`analytics: ${failure}`),
  });
}
