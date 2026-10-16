import { buildHerald } from './herald';
import type { Services } from './services';
import { TimelineAnalytics } from './timeline';

export const timeline = new TimelineAnalytics();
export const herald = buildHerald(timeline);

/** Each screen gets only the interfaces it needs, all of them this one `Herald`. */
export const services: Services = {
  analytics: herald,
  properties: herald,
  consent: herald,
  identity: herald,
  timeline,
};
