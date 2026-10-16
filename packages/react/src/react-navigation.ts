import { useContext } from 'react';
import { NavigationContext, useIsFocused } from '@react-navigation/native';
import type { Event, ScreenViewEvent } from '@herald-analytics/core';

import { useTrackWhenVisible, type ScreenMoment } from './screen';

/**
 * Tracks `event` each time its screen is shown, or hidden with `'hidden'`. Re-renders don't count,
 * and the event of the latest render is the one sent.
 *
 * A `Modal` over the screen doesn't hide it, and neither does iOS briefly taking focus, as for
 * Control Centre. Another screen over it, or the app going to the background, does.
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
 * it, and when the app comes back from the background.
 */
export function useTrackScreenView(event: ScreenViewEvent): void {
  useTrackOnScreen(event, 'shown');
}
