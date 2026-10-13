import { nameOf } from './internal';

/**
 * A factory that answers for everything, so it must be last in a chain: the generic factories,
 * which send everything, and the `RequireMapped` ones, which throw.
 */
export interface FallbackFactory {
  readonly isFallback: true;
}

export function isFallbackFactory(factory: object): factory is FallbackFactory {
  return 'isFallback' in factory && factory.isFallback === true;
}

/**
 * Throws if `factories` has more than one {@link FallbackFactory}, or one that isn't last.
 *
 * Composite factories call it when they're built, so a wrong chain fails at start-up.
 */
export function requireFallbackLast(factories: readonly object[]): void {
  const fallbacks = factories
    .map((factory, index) => ({ factory, number: index + 1 }))
    .filter(({ factory }) => isFallbackFactory(factory));
  if (fallbacks.length > 1) {
    const list = fallbacks
      .map(({ factory, number }) => `${nameOf(factory)} (factory ${number})`)
      .join(', ');
    throw new Error(
      `A chain can end in one fallback factory; this one has ${fallbacks.length}: ${list}.`,
    );
  }
  const fallback = fallbacks[0];
  if (fallback !== undefined && fallback.number !== factories.length) {
    throw new Error(
      `${nameOf(fallback.factory)} answers for everything, so nothing placed after it is ever ` +
        `asked. It is factory ${fallback.number} of ${factories.length}; move it to the end.`,
    );
  }
}
