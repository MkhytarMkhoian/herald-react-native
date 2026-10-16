import { useContext } from 'react';
import { NavigationContext, useIsFocused } from '@react-navigation/native';
import type { Event, ScreenViewEvent } from '@herald-analytics/core';

import { useTrackWhenVisible, type ScreenMoment } from './screen';

/**
 * Tracks `event` each time its screen reaches `on`: by default, each time the screen becomes
 * visible. Re-renders don't count, and the event of the latest render is the one sent.
 *
 * A screen is one of React Navigation's screens, tabs included. A React Native `Modal` over it
 * doesn't hide it, and neither does iOS briefly taking focus, as for Control Centre or a system
 * alert: only a screen over it or the app going to the background does. On iOS the notification
 * centre sends the app to the background, so it hides the screen.
 *
 * ```tsx
 * useTrackOnScreen(new CheckoutLeft(cart.length), 'hidden');
 * ```
 *
 * It needs a `HeraldScope` above it, and must be inside a screen. With Expo Router, import it from
 * `@herald-analytics/react/expo-router`.
 */
export function useTrackOnScreen(event: Event, on: ScreenMoment = 'shown'): void {
  if (useContext(NavigationContext) === undefined) {
    throw new Error(
      'useTrackScreenView and useTrackOnScreen must be inside a screen of React Navigation. With ' +
        'Expo Router, import them from @herald-analytics/react/expo-router.',
    );
  }
  useTrackWhenVisible(useIsFocused(), event, on);
}

/**
 * Tracks `event` each time its screen becomes visible: when it appears, when the user comes back to
 * it, and when the app comes back to view with it on top. That is what Firebase's automatic screen
 * tracking counts.
 *
 * ```tsx
 * function ProductScreen({ productId }: Props) {
 *   useTrackScreenView(new ProductViewed(productId));
 *   ...
 * }
 * ```
 *
 * It needs a `HeraldScope` above it, and must be inside a screen. With Expo Router, import it from
 * `@herald-analytics/react/expo-router`.
 */
export function useTrackScreenView(event: ScreenViewEvent): void {
  useTrackOnScreen(event, 'shown');
}
