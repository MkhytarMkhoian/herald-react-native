import { nameOf } from './internal';

/** A factory that answers for everything, such as a generic one, so it must be last in a chain. */
export interface FallbackFactory {
  readonly isFallback: true;
}

export function isFallbackFactory(factory: object): factory is FallbackFactory {
  return 'isFallback' in factory && factory.isFallback === true;
}

/** Throws if a {@link FallbackFactory} isn't last, or there's more than one. */
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
