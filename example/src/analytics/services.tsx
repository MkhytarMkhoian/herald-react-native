import { createContext, useContext, type ReactNode } from 'react';
import type {
  ConsentService,
  EventTrackerService,
  IdentifiableUserService,
  PropertyTrackerService,
} from '@herald-analytics/core';

import type { TimelineAnalytics } from './timeline';

/**
 * What screens get from the app: each analytics interface on its own, so a screen uses only the
 * ones it needs. In this app they are all the same `Herald`.
 */
export interface Services {
  readonly analytics: EventTrackerService;
  readonly properties: PropertyTrackerService;
  readonly consent: ConsentService;
  readonly identity: IdentifiableUserService;
  readonly timeline: TimelineAnalytics;
}

const ServicesContext = createContext<Services | undefined>(undefined);

export function ServicesProvider({
  services,
  children,
}: {
  services: Services;
  children: ReactNode;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (services === undefined) throw new Error('No ServicesProvider above this component.');
  return services;
}
