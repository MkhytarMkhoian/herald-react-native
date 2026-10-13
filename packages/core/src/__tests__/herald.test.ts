import { beforeEach, describe, expect, test } from '@jest/globals';

import {
  AnalyticsFailure,
  Herald,
  HeraldProvider,
  Identity,
  SetPropertyOperation,
  TrackOperation,
} from '../index';
import { RecordingService, TestEventTracker, TestProperty, TestEvent, settle } from './support';

const event = new TestEvent('an_event');
const property = new TestProperty('a_property', 'pro');
const identity = new Identity('user-1');

let analytics: RecordingService;
let attribution: RecordingService;
let failures: AnalyticsFailure[];
let herald: Herald;

// A provider with every capability, and one that only takes events.
beforeEach(() => {
  analytics = new RecordingService();
  attribution = new RecordingService();
  failures = [];
  herald = new Herald({
    providers: [
      new HeraldProvider({
        name: 'analytics',
        events: analytics,
        properties: analytics,
        identity: analytics,
        lifecycle: analytics,
        consent: analytics,
      }),
      new HeraldProvider({ name: 'attribution', events: attribution }),
    ],
    errorReporter: (failure) => {
      failures.push(failure);
    },
  });
});

describe('calls', () => {
  test('track reaches every provider that takes events', async () => {
    await herald.track(event);

    expect(analytics.received).toEqual(['track an_event']);
    expect(attribution.received).toEqual(['track an_event']);
  });

  test('set skips a provider without properties', async () => {
    await herald.set(property);

    expect(analytics.received).toEqual(['set a_property']);
    expect(attribution.received).toEqual([]);
  });

  test('identify and reset reach only providers with identity', async () => {
    await herald.identify(identity);
    await herald.reset();

    expect(analytics.received).toEqual(['identify user-1', 'reset']);
    expect(attribution.received).toEqual([]);
  });

  test('start and flush reach only providers with a lifecycle', async () => {
    await herald.start();
    await herald.flush();

    expect(analytics.received).toEqual(['start', 'flush']);
    expect(attribution.received).toEqual([]);
  });

  test('setEnabled reaches only providers with consent', async () => {
    await herald.setEnabled(true);

    expect(analytics.received).toEqual(['enabled true']);
    expect(attribution.received).toEqual([]);
  });

  test('a provider with only consent is called', async () => {
    const herald = new Herald({
      providers: [new HeraldProvider({ name: 'analytics', consent: analytics })],
    });

    await herald.setEnabled(false);

    expect(analytics.received).toEqual(['enabled false']);
  });

  test('a decorator keeps an event from one provider only', async () => {
    const herald = new Herald({
      providers: [
        new HeraldProvider({ name: 'analytics', events: analytics }),
        new HeraldProvider({
          name: 'attribution',
          events: new TestEventTracker(async (event) => {
            if (event.name !== 'an_event') await attribution.track(event);
          }),
        }),
      ],
    });

    await herald.track(event);

    expect(analytics.received).toEqual(['track an_event']);
    expect(attribution.received).toEqual([]);
  });

  // 'slow' waits for 'attribution', so calling providers one by one would hang.
  test('providers run at the same time, not one after another', async () => {
    const attributionCalled = Promise.withResolvers<void>();
    const herald = new Herald({
      providers: [
        new HeraldProvider({
          name: 'slow',
          events: new TestEventTracker(() => attributionCalled.promise),
        }),
        new HeraldProvider({
          name: 'attribution',
          events: new TestEventTracker(async () => attributionCalled.resolve()),
        }),
      ],
    });

    await herald.track(event);
  });

  test("calls don't wait for each other, and a slow vendor doesn't hold up others", async () => {
    const slow: string[] = [];
    const fast: string[] = [];
    const gate = Promise.withResolvers<void>();
    const herald = new Herald({
      providers: [
        new HeraldProvider({
          name: 'slow',
          events: new TestEventTracker(async (event) => {
            await gate.promise;
            slow.push(event.name);
          }),
        }),
        new HeraldProvider({
          name: 'fast',
          events: new TestEventTracker(async (event) => {
            fast.push(event.name);
          }),
          identity: new RecordingService(fast),
        }),
      ],
    });

    const calls = [
      herald.track(new TestEvent('a')),
      herald.track(new TestEvent('b')),
      herald.identify(identity),
    ];
    await settle();

    expect(fast).toEqual(['a', 'b', 'identify user-1']);
    expect(slow).toEqual([]);

    gate.resolve();
    await Promise.all(calls);
    expect(slow).toEqual(['a', 'b']);
  });
});

describe('failures', () => {
  test("a failing vendor doesn't stop the others, and is reported", async () => {
    const error = new Error('analytics is down');
    analytics.failure = error;

    await herald.track(event);

    expect(attribution.received).toEqual(['track an_event']);
    expect(failures).toHaveLength(1);
    const [failure] = failures;
    expect(failure?.provider).toBe('analytics');
    expect(failure?.operation).toStrictEqual(new TrackOperation('an_event'));
    expect(failure?.error).toBe(error);
  });

  test('a failure after a vendor that succeeded is reported too', async () => {
    attribution.failure = new Error('attribution is down');

    await herald.track(event);

    expect(failures.map((failure) => failure.provider)).toEqual(['attribution']);
  });

  test('a vendor that throws before returning a promise is caught too', async () => {
    const herald = new Herald({
      providers: [
        new HeraldProvider({
          name: 'sync',
          events: new TestEventTracker(() => {
            throw new TypeError('thrown before any promise');
          }),
        }),
        new HeraldProvider({ name: 'attribution', events: attribution }),
      ],
      errorReporter: (failure) => {
        failures.push(failure);
      },
    });

    await herald.track(event);

    expect(attribution.received).toEqual(['track an_event']);
    expect(failures.map((failure) => failure.error)).toEqual([expect.any(TypeError)]);
  });

  test('the report names the event that failed', async () => {
    await herald.track(event);
    analytics.failure = new Error('bad name');
    await herald.track(new TestEvent('other_event'));

    expect(failures.map((failure) => failure.operation)).toStrictEqual([
      new TrackOperation('other_event'),
    ]);
  });

  test('the report names the property that failed', async () => {
    analytics.failure = new Error('nope');

    await herald.set(property);

    expect(failures.map((failure) => failure.operation)).toStrictEqual([
      new SetPropertyOperation('a_property'),
    ]);
  });

  test('failures are reported in registration order, whatever order they happen in', async () => {
    const releaseFirst = Promise.withResolvers<void>();
    const herald = new Herald({
      providers: [
        new HeraldProvider({
          name: 'first',
          events: new TestEventTracker(async () => {
            await releaseFirst.promise;
            throw new Error('first is down');
          }),
        }),
        new HeraldProvider({
          name: 'second',
          events: new TestEventTracker(async () => {
            throw new Error('second is down');
          }),
        }),
      ],
      errorReporter: (failure) => {
        failures.push(failure);
      },
    });

    const call = herald.track(event);
    await settle(); // 'second' has failed by now
    releaseFirst.resolve();
    await call;

    expect(failures.map((failure) => failure.provider)).toEqual(['first', 'second']);
  });

  test('without a reporter, failures are dropped and the call still settles', async () => {
    analytics.failure = new Error('analytics is down');
    const herald = new Herald({
      providers: [new HeraldProvider({ name: 'analytics', events: analytics })],
    });

    await expect(herald.track(event)).resolves.toBeUndefined();
  });

  test("a reporter that throws doesn't reach the caller", async () => {
    analytics.failure = new Error('analytics is down');
    const herald = new Herald({
      providers: [
        new HeraldProvider({ name: 'analytics', events: analytics }),
        new HeraldProvider({ name: 'attribution', events: attribution }),
      ],
      errorReporter: () => {
        throw new Error('the crash reporter is down');
      },
    });

    await herald.track(event);

    expect(attribution.received).toEqual(['track an_event']);
  });

  test('a reporter that throws for one failure still gets the next', async () => {
    analytics.failure = new Error('analytics is down');
    attribution.failure = new Error('attribution is down');
    const seen: string[] = [];
    const herald = new Herald({
      providers: [
        new HeraldProvider({ name: 'analytics', events: analytics }),
        new HeraldProvider({ name: 'attribution', events: attribution }),
      ],
      errorReporter: (failure) => {
        seen.push(failure.provider);
        if (failure.provider === 'analytics') throw new Error('the crash reporter is down');
      },
    });

    await herald.track(event);

    expect(seen).toEqual(['analytics', 'attribution']);
  });

  test('a reporter whose promise fails is caught too', async () => {
    analytics.failure = new Error('analytics is down');
    const reported: string[] = [];
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    const herald = new Herald({
      providers: [new HeraldProvider({ name: 'analytics', events: analytics })],
      errorReporter: async (failure) => {
        reported.push(failure.provider);
        throw new Error('the crash reporter is down');
      },
    });

    await herald.track(event);
    await settle();
    process.off('unhandledRejection', onUnhandled);

    expect(reported).toEqual(['analytics']);
    expect(unhandled).toEqual([]);
  });

  test("a call doesn't wait for the reporter", async () => {
    analytics.failure = new Error('analytics is down');
    const herald = new Herald({
      providers: [new HeraldProvider({ name: 'analytics', events: analytics })],
      errorReporter: () => new Promise<void>(() => {}),
    });

    await herald.track(event);
  });
});

describe('setup', () => {
  test('a provider without capabilities is refused', () => {
    expect(() => new HeraldProvider({ name: 'empty' })).toThrow('no capabilities');
  });

  test('a provider with a blank name is refused', () => {
    expect(() => new HeraldProvider({ name: ' ', events: analytics })).toThrow('needs a name');
  });

  test('two providers with the same name are refused', () => {
    expect(
      () =>
        new Herald({
          providers: [
            new HeraldProvider({ name: 'analytics', events: analytics }),
            new HeraldProvider({ name: 'analytics', events: attribution }),
          ],
        }),
    ).toThrow("named 'analytics'");
  });
});
