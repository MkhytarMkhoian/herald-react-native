import { createContext, useContext, type ReactNode } from 'react';
import type { EventTrackerService } from '@herald-analytics/core';

const HeraldContext = createContext<EventTrackerService | undefined>(undefined);

export interface HeraldScopeProps {
  /** Usually your `Herald`, or any `EventTrackerService`, such as a fake in tests. */
  readonly analytics: EventTrackerService;
  readonly children?: ReactNode;
}

/**
 * Gives the components below it the app's tracker. Put one around the app, outside the
 * `NavigationContainer` or Expo Router's root layout.
 *
 * ```tsx
 * <HeraldScope analytics={herald}>
 *   <NavigationContainer>{screens}</NavigationContainer>
 * </HeraldScope>
 * ```
 */
export function HeraldScope({ analytics, children }: HeraldScopeProps) {
  return <HeraldContext.Provider value={analytics}>{children}</HeraldContext.Provider>;
}

/**
 * The tracker of the nearest `HeraldScope`, for events that come from a component, such as taps.
 * Throws if there is none.
 *
 * ```tsx
 * const analytics = useAnalytics();
 * <Button title="See the offer" onPress={() => analytics.track(new PromoTapped(promo.id))} />
 * ```
 */
export function useAnalytics(): EventTrackerService {
  const analytics = useContext(HeraldContext);
  if (analytics === undefined) {
    throw new Error(
      'No HeraldScope found above this component. Wrap the app in <HeraldScope analytics={...}>.',
    );
  }
  return analytics;
}
