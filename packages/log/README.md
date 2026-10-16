# Herald log

A Herald vendor that prints every call, for debug builds:

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

It prints the user id as-is, so use it in debug builds only, when `__DEV__` is true.

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
