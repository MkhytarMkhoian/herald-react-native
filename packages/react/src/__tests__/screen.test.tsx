import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { useState } from 'react';
import { Button, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { FakeAnalyticsProvider } from '@herald-analytics/testing';

import { HeraldScope, useTrackOnScreen, useTrackScreenView } from '../index';
import {
  App,
  Stack,
  Tabs,
  TestEvent,
  TestScreenView,
  fakeAppState,
  navigation,
  tracked,
} from './support';

function Home() {
  useTrackScreenView(new TestScreenView('home'));
  return <Text>home</Text>;
}

function Product({ route }: { route: { params?: { id?: string } } }) {
  const id = route.params?.id ?? 'p1';
  useTrackScreenView(new TestScreenView('product', { id }));
  useTrackOnScreen(new TestEvent('product_left', { id }), 'hidden');
  return <Text>product {id}</Text>;
}

let analytics: FakeAnalyticsProvider;

beforeEach(() => {
  analytics = new FakeAnalyticsProvider();
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function renderStack() {
  await render(
    <App analytics={analytics}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Product" component={Product} />
      </Stack.Navigator>
    </App>,
  );
}

describe('screen views', () => {
  test('a screen view is tracked when the screen appears', async () => {
    await renderStack();

    expect(tracked(analytics)).toEqual(['home']);
  });

  test('re-rendering the screen tracks nothing more', async () => {
    const result = await render(
      <App analytics={analytics}>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
      </App>,
    );

    await result.rerender(
      <App analytics={analytics}>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
      </App>,
    );

    expect(tracked(analytics)).toEqual(['home']);
  });

  test('opening a screen over it, then coming back, tracks each screen as it becomes visible', async () => {
    await renderStack();

    await act(async () => navigation.navigate('Product', { id: 'p7' }));
    await act(async () => navigation.goBack());

    expect(tracked(analytics)).toEqual(['home', 'product', 'product_left', 'home']);
    analytics.assertTracked('product', (event) => event.param('id', 'p7'));
  });

  test('switching tabs counts as a screen view', async () => {
    await render(
      <App analytics={analytics}>
        <Tabs.Navigator>
          <Tabs.Screen name="Home" component={Home} />
          <Tabs.Screen name="Product" component={Product} />
        </Tabs.Navigator>
      </App>,
    );

    await act(async () => navigation.navigate('Product'));
    await act(async () => navigation.navigate('Home'));

    expect(tracked(analytics)).toEqual(['home', 'product', 'product_left', 'home']);
  });
});

describe('hidden', () => {
  test('the event of the latest render is the one tracked', async () => {
    function Checkout() {
      const [items, setItems] = useState(1);
      useTrackOnScreen(new TestEvent('checkout_left', { items: String(items) }), 'hidden');
      return <Button title="add" onPress={() => setItems(3)} />;
    }
    await render(
      <App analytics={analytics}>
        <Stack.Navigator>
          <Stack.Screen name="Checkout" component={Checkout} />
          <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
      </App>,
    );

    await fireEvent.press(screen.getByText('add'));
    await act(async () => navigation.navigate('Home'));

    analytics.assertTracked('checkout_left', (event) => event.param('items', '3'));
  });

  test('closing the screen tracks its hidden event', async () => {
    await renderStack();
    await act(async () => navigation.navigate('Product'));

    await act(async () => navigation.goBack());

    analytics.assertTracked('product_left');
  });
});

describe('the app in the background', () => {
  let appState: ReturnType<typeof fakeAppState>;

  beforeEach(() => {
    appState = fakeAppState();
  });

  afterEach(() => {
    appState.restore();
  });

  test('going to the background hides the screen, and coming back shows it again', async () => {
    await renderStack();
    await act(async () => navigation.navigate('Product'));

    await appState.set('background');
    await appState.set('active');

    expect(tracked(analytics)).toEqual(['home', 'product', 'product_left', 'product']);
  });

  test("a brief loss of focus, as under iOS's notification centre, doesn't hide it", async () => {
    await renderStack();

    await appState.set('inactive');
    await appState.set('active');

    expect(tracked(analytics)).toEqual(['home']);
  });

  test('a screen that appears while the app is in the background waits for the app', async () => {
    await appState.set('background');

    await renderStack();
    expect(tracked(analytics)).toEqual([]);

    await appState.set('active');
    expect(tracked(analytics)).toEqual(['home']);
  });
});

describe('setup mistakes', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('outside a screen is refused, with what to do', async () => {
    await expect(
      render(
        <HeraldScope analytics={analytics}>
          <Home />
        </HeraldScope>,
      ),
    ).rejects.toThrow('must be inside a screen of React Navigation or Expo Router');
  });

  test('without a HeraldScope is refused, with what to do', async () => {
    await expect(
      render(
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={Home} />
          </Stack.Navigator>
        </NavigationContainer>,
      ),
    ).rejects.toThrow('No HeraldScope found above this component');
  });
});
