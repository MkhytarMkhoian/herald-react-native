import { createContext, useContext, type ReactNode } from 'react';
import type { EventTrackerService } from '@herald-analytics/core';

const HeraldContext = createContext<EventTrackerService | undefined>(undefined);

export interface HeraldScopeProps {
  /** Usually your `Herald`, or a fake in tests. */
  readonly analytics: EventTrackerService;
  readonly children?: ReactNode;
}

/** Gives the components inside it the app's tracker. Put one around the whole app. */
export function HeraldScope({ analytics, children }: HeraldScopeProps) {
  return <HeraldContext.Provider value={analytics}>{children}</HeraldContext.Provider>;
}

/** The tracker of the nearest `HeraldScope`, for events such as taps. Throws if there is none. */
export function useAnalytics(): EventTrackerService {
  const analytics = useContext(HeraldContext);
  if (analytics === undefined) {
    throw new Error(
      'No HeraldScope found above this component. Wrap the app in <HeraldScope analytics={...}>.',
    );
  }
  return analytics;
}
