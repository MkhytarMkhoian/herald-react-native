/**
 * A factory's answer for one event or property:
 *
 * - claimed: mine, send it with these handlers;
 * - dropped: mine, send nothing;
 * - declined: not mine, ask the next factory.
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

  /** Asks each factory in turn, and returns the first answer that isn't declined. */
  firstOf<F, T>(factories: Iterable<F>, ask: (factory: F) => Resolution<T>): Resolution<T> {
    for (const factory of factories) {
      const resolution = ask(factory);
      if (resolution.kind !== 'declined') return resolution;
    }
    return declined;
  },
};
