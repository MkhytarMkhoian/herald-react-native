import { AnalyticsFailure, type AnalyticsErrorReporter } from './analytics-failure';
import {
  FlushOperation,
  IdentifyOperation,
  ResetOperation,
  SetEnabledOperation,
  SetPropertyOperation,
  StartOperation,
  TrackOperation,
  type AnalyticsOperation,
} from './analytics-operation';
import type { Event } from './event';
import type { Identity } from './identity';
import type { Property } from './property';
import type {
  AnalyticsLifecycleService,
  ConsentService,
  EventTrackerService,
  IdentifiableUserService,
  PropertyTrackerService,
} from './services';

export interface HeraldProviderOptions {
  readonly name: string;
  readonly events?: EventTrackerService;
  readonly properties?: PropertyTrackerService;
  readonly identity?: IdentifiableUserService;
  readonly lifecycle?: AnalyticsLifecycleService;
  readonly consent?: ConsentService;
}

/**
 * One vendor: a name and the capabilities it has.
 *
 * An adapter with several capabilities is passed under each. `name` shows up in failure reports,
 * so pick one you'll recognise.
 *
 * To skip or sample events for one vendor, wrap its capability in a decorator, like the one shown
 * on {@link EventTrackerService}:
 *
 * ```ts
 * new HeraldProvider({ name: 'attribution', events: new ExceptPersonalDataTracker(attribution) })
 * ```
 */
export class HeraldProvider {
  readonly name: string;
  readonly events?: EventTrackerService;
  readonly properties?: PropertyTrackerService;
  readonly identity?: IdentifiableUserService;
  readonly lifecycle?: AnalyticsLifecycleService;
  readonly consent?: ConsentService;

  /** Throws if `name` is blank or no capability is given. */
  constructor(options: HeraldProviderOptions) {
    const { name, events, properties, identity, lifecycle, consent } = options;
    if (name.trim() === '') {
      throw new Error('A provider needs a name; it is what identifies it in a failure report.');
    }
    if (!events && !properties && !identity && !lifecycle && !consent) {
      throw new Error(
        `Provider '${name}' was registered with no capabilities, so it can never be called.`,
      );
    }
    this.name = name;
    this.events = events;
    this.properties = properties;
    this.identity = identity;
    this.lifecycle = lifecycle;
    this.consent = consent;
  }

  toString(): string {
    return `HeraldProvider(${this.name})`;
  }
}

export interface HeraldOptions {
  readonly providers: Iterable<HeraldProvider>;
  /** Where failures go. Without one, they are ignored. */
  readonly errorReporter?: AnalyticsErrorReporter;
}

/**
 * Sends each call to every vendor.
 *
 * It implements all five capabilities. Give your classes the interface they need, such as
 * {@link EventTrackerService}, not `Herald` itself.
 *
 * ```ts
 * const herald = new Herald({
 *   providers: [
 *     new HeraldProvider({
 *       name: 'analytics',
 *       events: analyticsTracker,
 *       properties: analyticsTracker,
 *       identity: analyticsService,
 *       lifecycle: analyticsService,
 *       consent: analyticsService,
 *     }),
 *     new HeraldProvider({ name: 'attribution', events: attributionTracker }),
 *   ],
 *   errorReporter: (failure) => crashReporter.record(failure.error, `${failure}`),
 * });
 * ```
 *
 * ## Order
 *
 * A call starts right away and reaches every vendor at once. Its promise settles when every vendor
 * has handled it. Calls don't wait for each other, so when order matters, such as turning
 * collection off before tracking, await the earlier call:
 *
 * ```ts
 * await herald.setEnabled(false);
 * await herald.track(event);
 * ```
 *
 * ## Failures
 *
 * If a vendor throws, the others still run. Failures go to the error reporter after all vendors are
 * done, in registration order. A call on `Herald` itself never fails, so it's safe not to await it.
 *
 * Every provider needs its own name; a repeated name throws.
 */
export class Herald
  implements
    EventTrackerService,
    PropertyTrackerService,
    IdentifiableUserService,
    AnalyticsLifecycleService,
    ConsentService
{
  private readonly providers: readonly HeraldProvider[];
  private readonly errorReporter?: AnalyticsErrorReporter;

  constructor(options: HeraldOptions) {
    this.providers = Object.freeze([...options.providers]);
    this.errorReporter = options.errorReporter;
    const seen = new Set<string>();
    for (const provider of this.providers) {
      if (seen.has(provider.name)) {
        throw new Error(
          `Two providers are named '${provider.name}', so a failure report couldn't tell them ` +
            'apart. Give each provider its own name.',
        );
      }
      seen.add(provider.name);
    }
  }

  track(event: Event): Promise<void> {
    return this.send(
      new TrackOperation(event.name),
      (provider) => provider.events,
      (events) => events.track(event),
    );
  }

  set(property: Property): Promise<void> {
    return this.send(
      new SetPropertyOperation(property.name),
      (provider) => provider.properties,
      (properties) => properties.set(property),
    );
  }

  identify(identity: Identity): Promise<void> {
    return this.send(
      new IdentifyOperation(),
      (provider) => provider.identity,
      (service) => service.identify(identity),
    );
  }

  reset(): Promise<void> {
    return this.send(
      new ResetOperation(),
      (provider) => provider.identity,
      (service) => service.reset(),
    );
  }

  start(): Promise<void> {
    return this.send(
      new StartOperation(),
      (provider) => provider.lifecycle,
      (lifecycle) => lifecycle.start(),
    );
  }

  setEnabled(enabled: boolean): Promise<void> {
    return this.send(
      new SetEnabledOperation(enabled),
      (provider) => provider.consent,
      (consent) => consent.setEnabled(enabled),
    );
  }

  flush(): Promise<void> {
    return this.send(
      new FlushOperation(),
      (provider) => provider.lifecycle,
      (lifecycle) => lifecycle.flush(),
    );
  }

  /**
   * Calls every provider that has the capability at once, then reports what failed, in
   * registration order. Providers without it are skipped.
   */
  private async send<S>(
    operation: AnalyticsOperation,
    capability: (provider: HeraldProvider) => S | undefined,
    call: (service: S) => Promise<void>,
  ): Promise<void> {
    const outcomes = await Promise.all(
      this.providers.flatMap((provider) => {
        const service = capability(provider);
        return service === undefined ? [] : [this.run(provider, operation, () => call(service))];
      }),
    );

    const reporter = this.errorReporter;
    if (reporter === undefined) return;
    for (const failure of outcomes) {
      if (failure === undefined) continue;
      // A failing reporter has nowhere to report to, whether it throws or its promise fails.
      try {
        Promise.resolve(reporter(failure)).catch(() => {});
      } catch {
        // ignored, as above
      }
    }
  }

  /** Runs `call` for `provider`, turning anything it throws into a failure. */
  private async run(
    provider: HeraldProvider,
    operation: AnalyticsOperation,
    call: () => Promise<void>,
  ): Promise<AnalyticsFailure | undefined> {
    try {
      await call();
      return undefined;
    } catch (error) {
      return new AnalyticsFailure(provider.name, operation, error);
    }
  }
}
