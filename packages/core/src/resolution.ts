/**
 * A factory's answer for one event or property:
 *
 * - claimed: mine, send it with these handlers.
 * - dropped: mine, send nothing. Later factories aren't asked.
 * - declined: not mine, ask the next factory.
 *
 * ```ts
 * create(event: Event): Resolution<VendorEventTracker> {
 *   if (event instanceof CheckoutStarted) return Resolution.claimed([new CheckoutTracker(event)]);
 *   if (event instanceof DebugPing) return Resolution.dropped();
 *   return Resolution.declined();
 * }
 * ```
 */
export type Resolution<T> = Claimed<T> | Dropped | Declined;

export interface Claimed<T> {
  readonly kind: 'claimed';
  readonly handlers: readonly T[];
}

export interface Dropped {
  readonly kind: 'dropped';
  readonly handlers: readonly never[];
}

export interface Declined {
  readonly kind: 'declined';
  readonly handlers: readonly never[];
}

const dropped: Dropped = Object.freeze({ kind: 'dropped', handlers: Object.freeze([]) });
const declined: Declined = Object.freeze({ kind: 'declined', handlers: Object.freeze([]) });

export const Resolution = {
  /** Throws if `handlers` is empty. Use {@link Resolution.dropped} to send nothing. */
  claimed<T>(handlers: readonly T[]): Claimed<T> {
    if (handlers.length === 0) {
      throw new RangeError(
        'Claimed needs at least one handler. Use dropped() to claim something and send nothing.',
      );
    }
    return Object.freeze({ kind: 'claimed', handlers: Object.freeze([...handlers]) });
  },

  dropped(): Dropped {
    return dropped;
  },

  declined(): Declined {
    return declined;
  },

  /**
   * Asks each factory in turn and returns the first answer that isn't declined, or declined if all
   * decline. The factories after the one that answers aren't asked. Composite factories use it to
   * run their chain:
   *
   * ```ts
   * Resolution.firstOf(this.factories, (factory) => factory.create(event))
   * ```
   */
  firstOf<F, T>(factories: Iterable<F>, ask: (factory: F) => Resolution<T>): Resolution<T> {
    for (const factory of factories) {
      const resolution = ask(factory);
      if (resolution.kind !== 'declined') return resolution;
    }
    return declined;
  },
};
