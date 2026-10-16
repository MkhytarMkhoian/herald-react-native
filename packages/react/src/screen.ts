import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import type { Event } from '@herald-analytics/core';

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

// The screen hooks, shared by the React Navigation and Expo Router entries. Each entry finds out
// whether its screen is focused, with its own library, and passes that in.

/** Tracks `event` when the screen reaches `on`. `focused` comes from the app's navigation library. */
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
  // Herald never rejects. Another tracker's failure shows up as an unhandled rejection.
  if (moment === current.on) void current.analytics.track(current.event);
}

/** Whether the app isn't in the background. */
function useAppVisible(): boolean {
  const appState = useSyncExternalStore(subscribeToAppState, () => AppState.currentState);
  // 'inactive' is iOS briefly taking focus, as for Control Centre: still visible.
  return appState !== 'background';
}

function subscribeToAppState(onChange: () => void): () => void {
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}
