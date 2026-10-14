import {
  AnalyticsValue,
  type AnalyticsInput,
  type AnalyticsLifecycleService,
  type ConsentService,
  type Event,
  type EventTrackerService,
  type IdentifiableUserService,
  type Identity,
  type Property,
  type PropertyTrackerService,
} from '@herald-analytics/core';

import {
  EnabledSetRecord,
  FlushedRecord,
  IdentifiedRecord,
  PropertySetRecord,
  ResetRecord,
  StartedRecord,
  TrackedRecord,
  type AnalyticsRecord,
} from './analytics-record';
import { describeParameters, describeValue, sameValue } from './describe';

/**
 * What a failed assertion throws. Its message says what was expected and lists everything the fake
 * recorded. Any test runner shows it as a failure.
 */
export class AnalyticsAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsAssertionError';
  }
}

type Fail = (message: string) => never;

/**
 * A vendor that records calls instead of sending them, for tests.
 *
 * It has all five capabilities. Register it with a real `Herald`, so the test also runs your setup,
 * or pass it straight to the class under test:
 *
 * ```ts
 * const analytics = new FakeAnalyticsProvider();
 * const herald = new Herald({
 *   providers: [new HeraldProvider({ name: 'test', events: analytics, properties: analytics })],
 * });
 *
 * await viewModel.onPayTapped();
 *
 * analytics
 *   .assertTracked('checkout_pay_tapped', (event) => event.param('plan', 'pro'))
 *   .assertNothingElseTracked();
 * ```
 */
export class FakeAnalyticsProvider
  implements
    AnalyticsLifecycleService,
    EventTrackerService,
    PropertyTrackerService,
    IdentifiableUserService,
    ConsentService
{
  private readonly recorded: AnalyticsRecord[] = [];
  private readonly accountedFor = new Set<number>();

  /** Everything received, oldest first. Later calls don't change this list. */
  get records(): readonly AnalyticsRecord[] {
    return Object.freeze([...this.recorded]);
  }

  get events(): readonly Event[] {
    return this.tracked().map(({ record }) => record.event);
  }

  get properties(): readonly Property[] {
    return this.recorded
      .filter((record) => record instanceof PropertySetRecord)
      .map((record) => record.property);
  }

  async track(event: Event): Promise<void> {
    this.recorded.push(new TrackedRecord(event));
  }

  async set(property: Property): Promise<void> {
    this.recorded.push(new PropertySetRecord(property));
  }

  async identify(identity: Identity): Promise<void> {
    this.recorded.push(new IdentifiedRecord(identity));
  }

  async reset(): Promise<void> {
    this.recorded.push(new ResetRecord());
  }

  async start(): Promise<void> {
    this.recorded.push(new StartedRecord());
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.recorded.push(new EnabledSetRecord(enabled));
  }

  async flush(): Promise<void> {
    this.recorded.push(new FlushedRecord());
  }

  /** Forgets everything, including which events were already asserted on. */
  clear(): void {
    this.recorded.length = 0;
    this.accountedFor.clear();
  }

  /**
   * Asserts that exactly one event called `name` was tracked, then runs `assertions` on it.
   *
   * Exactly one, so a duplicated event fails instead of passing. Use
   * {@link FakeAnalyticsProvider.assertTrackedTimes} when repeats are expected.
   *
   * ```ts
   * analytics.assertTracked('checkout_started', (event) =>
   *   event.param('plan', 'pro').param('seats', int(3)),
   * );
   * ```
   */
  assertTracked(name: string, assertions?: (event: TrackedEventAssert) => void): this {
    const matches = this.trackedNamed(name);
    const [match] = matches;
    if (match === undefined) {
      this.fail(`Expected an event named '${name}', but it was never tracked.`);
    }
    if (matches.length > 1) {
      this.fail(
        `Expected one event named '${name}', but ${matches.length} were tracked. ` +
          `Use assertTrackedTimes('${name}', ${matches.length}) if that is intended.`,
      );
    }
    this.accountedFor.add(match.index);
    assertions?.(new TrackedEventAssert(name, match.record, (message) => this.fail(message)));
    return this;
  }

  assertTrackedTimes(name: string, times: number): this {
    const matches = this.trackedNamed(name);
    if (matches.length !== times) {
      this.fail(
        `Expected '${name}' to be tracked ${times} times, ` +
          `but it was tracked ${matches.length} times.`,
      );
    }
    for (const { index } of matches) this.accountedFor.add(index);
    return this;
  }

  assertNotTracked(name: string): this {
    if (this.trackedNamed(name).length > 0) this.fail(`Expected '${name}' never to be tracked.`);
    return this;
  }

  assertNothingTracked(): this {
    const count = this.tracked().length;
    if (count > 0) this.fail(`Expected no events, but ${count} were tracked.`);
    return this;
  }

  /**
   * Asserts that every tracked event was already checked by an earlier assertion, so an unexpected
   * event, such as a duplicate, doesn't go unnoticed.
   */
  assertNothingElseTracked(): this {
    const unexpected = this.tracked()
      .filter(({ index }) => !this.accountedFor.has(index))
      .map(({ record }) => record.event.name);
    if (unexpected.length > 0) this.fail(`Unexpected events tracked: ${unexpected.join(', ')}.`);
    return this;
  }

  /**
   * Asserts that the property `name` currently has `value`, meaning the last value it was set to.
   * If it had the right value and was then overwritten, this fails and shows every value.
   *
   * `value` is written as in the property, and compared by type too, so `int(3)` fails against the
   * text `'3'`.
   */
  assertPropertySet(name: string, value: AnalyticsInput): this {
    const expected = AnalyticsValue.from(value);
    const history = this.recorded
      .filter((record) => record instanceof PropertySetRecord)
      .filter((record) => record.property.name === name)
      .map((record) => record.value);
    const last = history.at(-1);
    if (last === undefined) this.fail(`Expected property '${name}' to be set, but it never was.`);
    if (!sameValue(last, expected)) {
      this.fail(
        `Expected property '${name}' to be ${describeValue(expected)}, ` +
          `but it was set to ${history.map(describeValue).join(' then ')}.`,
      );
    }
    return this;
  }

  /**
   * Asserts that the user was identified as `userId` at some point, even if `reset` came later. Use
   * `records` to check the order.
   */
  assertIdentified(userId: string): this {
    const identified = this.recorded.filter((record) => record instanceof IdentifiedRecord);
    if (!identified.some((record) => record.identity.userId === userId)) {
      this.fail(`Expected the user to be identified as '${userId}'.`);
    }
    return this;
  }

  private tracked(): { record: TrackedRecord; index: number }[] {
    return this.recorded.flatMap((record, index) =>
      record instanceof TrackedRecord ? [{ record, index }] : [],
    );
  }

  private trackedNamed(name: string): { record: TrackedRecord; index: number }[] {
    return this.tracked().filter(({ record }) => record.event.name === name);
  }

  private fail(message: string): never {
    const timeline =
      this.recorded.length === 0
        ? '  (nothing was recorded)'
        : this.recorded.map((record, index) => `  ${index + 1}. ${record}`).join('\n');
    throw new AnalyticsAssertionError(`${message}\n\nRecorded:\n${timeline}`);
  }
}

/** Checks on one tracked event, given to the callback of `assertTracked`. */
export class TrackedEventAssert {
  /** @internal */
  constructor(
    private readonly name: string,
    private readonly record: TrackedRecord,
    private readonly fail: Fail,
  ) {}

  /** The event, for checks the methods here don't cover. */
  get event(): Event {
    return this.record.event;
  }

  /**
   * Asserts that the event has the parameter `key` with `value`.
   *
   * `value` is written as in the event, and compared by type too, so `int(3)` fails against the
   * text `'3'`.
   */
  param(key: string, value: AnalyticsInput): this {
    const expected = AnalyticsValue.from(value);
    const parameters = this.record.parameters;
    const actual = parameters[key];
    if (actual === undefined) {
      this.fail(`Event '${this.name}' has no parameter '${key}'${describeParameters(parameters)}.`);
    }
    if (!sameValue(actual, expected)) {
      this.fail(
        `Event '${this.name}' parameter '${key}' was ${describeValue(actual)}, ` +
          `expected ${describeValue(expected)}.`,
      );
    }
    return this;
  }

  noParameters(): this {
    const described = describeParameters(this.record.parameters);
    if (described !== '') {
      this.fail(`Expected '${this.name}' to carry no parameters, but it carried${described}.`);
    }
    return this;
  }
}
