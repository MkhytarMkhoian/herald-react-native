import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { useSyncExternalStore as mockUseSyncExternalStore } from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { FakeAnalyticsProvider } from '@herald-analytics/testing';

import * as reactNavigationEntry from '../index';
import * as expoRouterEntry from '../expo-router';
import { HeraldScope, useTrackOnScreen, useTrackScreenView } from '../expo-router';
import { TestEvent, TestScreenView, fakeAppState, tracked } from './support';

// Expo Router's focus, as a switch the test turns. The example app tests the real Expo Router.
const mockFocus = { focused: true, listeners: new Set<() => void>() };
jest.mock('expo-router', () => ({
  useIsFocused: () =>
    mockUseSyncExternalStore(
      (listener) => {
        mockFocus.listeners.add(listener);
        return () => mockFocus.listeners.delete(listener);
      },
      () => mockFocus.focused,
    ),
}));

async function setFocused(focused: boolean) {
  await act(async () => {
    mockFocus.focused = focused;
    for (const listener of mockFocus.listeners) listener();
  });
}

function Product() {
  useTrackScreenView(new TestScreenView('product'));
  useTrackOnScreen(new TestEvent('product_left'), 'hidden');
  return <Text>product</Text>;
}

let analytics: FakeAnalyticsProvider;

beforeEach(() => {
  analytics = new FakeAnalyticsProvider();
  mockFocus.focused = true;
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("screen views follow Expo Router's focus", async () => {
  await render(
    <HeraldScope analytics={analytics}>
      <Product />
    </HeraldScope>,
  );

  await setFocused(false);
  await setFocused(true);

  expect(tracked(analytics)).toEqual(['product', 'product_left', 'product']);
});

test('going to the background hides the screen, as with React Navigation', async () => {
  const appState = fakeAppState();
  await render(
    <HeraldScope analytics={analytics}>
      <Product />
    </HeraldScope>,
  );

  await appState.set('background');
  await appState.set('active');
  appState.restore();

  expect(tracked(analytics)).toEqual(['product', 'product_left', 'product']);
});

test('the scope, tracker and list impressions are the same in both entries', () => {
  expect(expoRouterEntry.HeraldScope).toBe(reactNavigationEntry.HeraldScope);
  expect(expoRouterEntry.useAnalytics).toBe(reactNavigationEntry.useAnalytics);
  expect(expoRouterEntry.useImpressions).toBe(reactNavigationEntry.useImpressions);
});
