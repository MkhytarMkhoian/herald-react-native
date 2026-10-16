/**
 * `@herald-analytics/react` for Expo Router, which has its own copy of React Navigation inside: the
 * same hooks and components, with the screen hooks following Expo Router's screens.
 *
 * @packageDocumentation
 */

import { useIsFocused } from 'expo-router';
import type { Event, ScreenViewEvent } from '@herald-analytics/core';

import { useTrackWhenVisible, type ScreenMoment } from './screen';

export type { ImpressionListProps, ImpressionOptions } from './impressions';
export { useImpressions } from './impressions';
export type { HeraldScopeProps } from './scope';
export { HeraldScope, useAnalytics } from './scope';
export type { ScreenMoment } from './screen';

/**
 * Tracks `event` each time its screen reaches `on`: by default, each time the screen becomes
 * visible. Re-renders don't count, and the event of the latest render is the one sent.
 *
 * A screen is one of Expo Router's screens, tabs included. A React Native `Modal` over it doesn't
 * hide it, and neither does iOS briefly taking focus, as for Control Centre or a system alert: only
 * a screen over it or the app going to the background does. On iOS the notification centre sends the
 * app to the background, so it hides the screen.
 *
 * ```tsx
 * useTrackOnScreen(new CheckoutLeft(cart.length), 'hidden');
 * ```
 *
 * It needs a `HeraldScope` above it, and must be inside a screen.
 */
export function useTrackOnScreen(event: Event, on: ScreenMoment = 'shown'): void {
  useTrackWhenVisible(useIsFocused(), event, on);
}

/**
 * Tracks `event` each time its screen becomes visible: when it appears, when the user comes back to
 * it, and when the app comes back to view with it on top. That is what Firebase's automatic screen
 * tracking counts.
 *
 * ```tsx
 * export default function ProductScreen() {
 *   const { id } = useLocalSearchParams<{ id: string }>();
 *   useTrackScreenView(new ProductViewed(id));
 *   ...
 * }
 * ```
 *
 * It needs a `HeraldScope` above it, and must be inside a screen.
 */
export function useTrackScreenView(event: ScreenViewEvent): void {
  useTrackOnScreen(event, 'shown');
}
