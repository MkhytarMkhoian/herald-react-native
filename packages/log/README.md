# Herald log

A Herald vendor that prints every call as a readable record, for debug builds:

```
[herald] event   checkout_started
    ├─ plan  = pro
    └─ seats = 3
[herald] prop    total_purchases = 2
[herald] reset
```

```ts
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

const herald = new Herald({
  providers: [
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
  ],
});
```

The user id is printed as-is, so register this provider in debug builds only. `__DEV__` is React
Native's flag for them.

## Documentation

It works with [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), the
core. The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
