import { useContext, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { NavigationContext, useIsFocused } from '@react-navigation/native';
import type { Event, ScreenViewEvent } from '@herald-analytics/core';

import { useAnalytics } from './scope';

/**
 * When a screen is tracked by `useTrackOnScreen`:
 *
 * - `shown`: the screen became visible. It appeared, the user came back to it, or the app came back
 *   to view with it on top.
 * - `hidden`: the screen stopped being visible. Another screen opened over it, it closed, or the app
 *   went to the background.
 */
export type ScreenMoment = 'shown' | 'hidden';

/**
 * Tracks `event` each time its screen reaches `on`: by default, each time the screen becomes
 * visible. Re-renders don't count, and the event of the latest render is the one sent.
 *
 * A screen is one of React Navigation's or Expo Router's screens, tabs included. A React Native
 * `Modal` over it doesn't hide it, and neither does iOS briefly taking focus, as for Control Centre
 * or a system alert: only a screen over it or the app going to the background does. On iOS the
 * notification centre sends the app to the background, so it hides the screen.
 *
 * ```tsx
 * useTrackOnScreen(new CheckoutLeft(cart.length), 'hidden');
 * ```
 *
 * It needs a `HeraldScope` above it, and must be inside a screen.
 */
export function useTrackOnScreen(event: Event, on: ScreenMoment = 'shown'): void {
  const analytics = useAnalytics();
  const visible = useScreenVisible();
  const latest = useRef({ analytics, event, on });
  useLayoutEffect(() => {
    latest.current = { analytics, event, on };
  });

  useEffect(() => {
    if (!visible) return;
    reach(latest.current, 'shown');
    return () => reach(latest.current, 'hidden');
  }, [visible]);
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
 * It needs a `HeraldScope` above it, and must be inside a screen.
 */
export function useTrackScreenView(event: ScreenViewEvent): void {
  useTrackOnScreen(event, 'shown');
}

function reach(
  current: { analytics: { track(event: Event): Promise<void> }; event: Event; on: ScreenMoment },
  moment: ScreenMoment,
): void {
  // Herald never rejects. Another tracker's failure shows up as an unhandled rejection.
  if (moment === current.on) void current.analytics.track(current.event);
}

/** Whether the screen is focused and the app isn't in the background. */
function useScreenVisible(): boolean {
  if (useContext(NavigationContext) === undefined) {
    throw new Error(
      'useTrackScreenView and useTrackOnScreen must be inside a screen of React Navigation or ' +
        "Expo Router. A component outside the navigator isn't on a screen; track from the screen.",
    );
  }
  const focused = useIsFocused();
  const appState = useSyncExternalStore(subscribeToAppState, () => AppState.currentState);
  // 'inactive' is iOS briefly taking focus, as for Control Centre: still visible.
  return focused && appState !== 'background';
}

function subscribeToAppState(onChange: () => void): () => void {
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}
