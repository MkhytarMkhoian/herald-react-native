import { jest } from '@jest/globals';
import type { ReactNode } from 'react';
import { AppState, View, type AppStateStatus } from 'react-native';
import {
  NavigationContainer,
  StackRouter,
  TabRouter,
  createNavigationContainerRef,
  createNavigatorFactory,
  useNavigationBuilder,
  type ParamListBase,
} from '@react-navigation/native';
import { act } from '@testing-library/react-native';
import type { Event, EventParameters, ScreenViewEvent } from '@herald-analytics/core';

import { HeraldScope } from '../index';
import type { FakeAnalyticsProvider } from '@herald-analytics/testing';

export class TestEvent implements Event {
  constructor(
    readonly name: string,
    readonly parameters: EventParameters = {},
  ) {}
}

export class TestScreenView implements ScreenViewEvent {
  readonly isScreenView = true;

  constructor(
    readonly name: string,
    readonly parameters: EventParameters = {},
  ) {}
}

// Test navigators built from React Navigation's own routers. They render every route, as a real
// stack keeps the screens under the top one mounted, so focus changes are what the hooks see.

interface NavigatorProps {
  children: ReactNode;
  initialRouteName?: string;
}

function StackNavigator(props: NavigatorProps) {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
  return (
    <NavigationContent>
      {state.routes.map((route) => (
        <View key={route.key}>{descriptors[route.key]!.render()}</View>
      ))}
    </NavigationContent>
  );
}

function TabNavigator(props: NavigatorProps) {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(TabRouter, props);
  return (
    <NavigationContent>
      {state.routes.map((route) => (
        <View key={route.key}>{descriptors[route.key]!.render()}</View>
      ))}
    </NavigationContent>
  );
}

export const Stack = createNavigatorFactory(StackNavigator)();
export const Tabs = createNavigatorFactory(TabNavigator)();

export const navigation = createNavigationContainerRef<ParamListBase>();

export function App({
  analytics,
  children,
}: {
  analytics: FakeAnalyticsProvider;
  children: ReactNode;
}) {
  return (
    <HeraldScope analytics={analytics}>
      <NavigationContainer ref={navigation}>{children}</NavigationContainer>
    </HeraldScope>
  );
}

/** Names of the events the fake received, in order. */
export function tracked(analytics: FakeAnalyticsProvider): string[] {
  return analytics.events.map((event) => event.name);
}

/**
 * Replaces React Native's app state, which is a stand-in object in tests, with one the test moves.
 * Call `restore` after the test.
 */
export function fakeAppState(): { set(state: AppStateStatus): Promise<void>; restore(): void } {
  const appState = AppState as { currentState: unknown };
  const original = appState.currentState;
  const listeners = new Set<(state: AppStateStatus) => void>();
  appState.currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    const onChange = listener as (state: AppStateStatus) => void;
    listeners.add(onChange);
    return { remove: () => listeners.delete(onChange) };
  });
  return {
    async set(state) {
      await act(async () => {
        appState.currentState = state;
        for (const listener of listeners) listener(state);
      });
    },
    restore() {
      appState.currentState = original;
    },
  };
}
