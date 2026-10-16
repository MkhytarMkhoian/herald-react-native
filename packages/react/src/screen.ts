import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import type { Event } from '@herald-analytics/core';

import { useAnalytics } from './scope';

/**
 * When `useTrackOnScreen` tracks: `shown`, each time the screen becomes visible, or `hidden`, each
 * time it stops being visible.
 */
export type ScreenMoment = 'shown' | 'hidden';

// Shared by the React Navigation and Expo Router entries, which each pass in whether the screen is
// focused.

/** Tracks `event` when the screen reaches `on`. */
export function useTrackWhenVisible(focused: boolean, event: Event, on: ScreenMoment): void {
  const analytics = useAnalytics();
  const appVisible = useAppVisible();
  const visible = focused && appVisible;
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

function reach(
  current: { analytics: { track(event: Event): Promise<void> }; event: Event; on: ScreenMoment },
  moment: ScreenMoment,
): void {
  // Herald never rejects; another tracker's failure becomes an unhandled rejection.
  if (moment === current.on) void current.analytics.track(current.event);
}

/** Whether the app isn't in the background. */
function useAppVisible(): boolean {
  const appState = useSyncExternalStore(subscribeToAppState, () => AppState.currentState);
  // 'inactive' is iOS briefly taking focus, as for Control Centre: the screen is still visible.
  return appState !== 'background';
}

function subscribeToAppState(onChange: () => void): () => void {
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}
