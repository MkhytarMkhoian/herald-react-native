import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { ReactNode } from 'react';
import { Button, FlatList, Text } from 'react-native';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { FakeAnalyticsProvider } from '@herald-analytics/testing';

import {
  HeraldScope,
  useAnalytics,
  useImpressions,
  type ImpressionListProps,
  type ImpressionOptions,
} from '../index';
import { TestEvent, tracked } from './support';

interface Offer {
  id: string;
}

let analytics: FakeAnalyticsProvider;

beforeEach(() => {
  analytics = new FakeAnalyticsProvider();
});

function wrapper({ children }: { children: ReactNode }) {
  return <HeraldScope analytics={analytics}>{children}</HeraldScope>;
}

async function renderImpressions(options?: ImpressionOptions) {
  const { result } = await renderHook(
    () => useImpressions((offer: Offer) => new TestEvent('offer_shown', { id: offer.id }), options),
    { wrapper },
  );
  return result;
}

/** What a list tells each pair when items change: [key, isViewable] for each changed item. */
async function listReports(
  props: ImpressionListProps,
  pair: 'counting' | 'leaving',
  changes: [string, boolean][],
) {
  const { onViewableItemsChanged } =
    props.viewabilityConfigCallbackPairs[pair === 'counting' ? 0 : 1]!;
  await act(async () => {
    onViewableItemsChanged({
      changed: changes.map(([key, isViewable]) => ({ key, isViewable, item: { id: key } })),
    });
  });
}

describe('useImpressions', () => {
  test('the list is told the threshold and the minimum time, as it understands them', async () => {
    const result = await renderImpressions({ threshold: 0.6, minVisibleMs: 1000 });

    expect(
      result.current.viewabilityConfigCallbackPairs.map((pair) => pair.viewabilityConfig),
    ).toEqual([
      { itemVisiblePercentThreshold: 60, minimumViewTime: 1000 },
      { itemVisiblePercentThreshold: 0 },
    ]);
  });

  test('by default, half of an item must be on screen, with no minimum time', async () => {
    const result = await renderImpressions();

    expect(result.current.viewabilityConfigCallbackPairs[0]!.viewabilityConfig).toEqual({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 0,
    });
  });

  test('an item visible enough is tracked once, with its own event', async () => {
    const result = await renderImpressions();

    await listReports(result.current, 'counting', [
      ['a', true],
      ['b', true],
    ]);

    analytics.assertTrackedTimes('offer_shown', 2);
    expect(analytics.events.map((event) => event.parameters)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  test('dipping below the threshold and back, while still on screen, counts once', async () => {
    const result = await renderImpressions();

    await listReports(result.current, 'counting', [['a', true]]);
    await listReports(result.current, 'counting', [['a', false]]);
    await listReports(result.current, 'counting', [['a', true]]);

    expect(tracked(analytics)).toEqual(['offer_shown']);
  });

  test('leaving the screen completely, then coming back, counts again', async () => {
    const result = await renderImpressions();

    await listReports(result.current, 'counting', [['a', true]]);
    await listReports(result.current, 'counting', [['a', false]]);
    await listReports(result.current, 'leaving', [['a', false]]);
    await listReports(result.current, 'counting', [['a', true]]);

    expect(tracked(analytics)).toEqual(['offer_shown', 'offer_shown']);
  });

  test('the list props stay the same object, because a list refuses new ones', async () => {
    const { result, rerender } = await renderHook(
      ({ threshold }: { threshold: number }) =>
        useImpressions(() => new TestEvent('offer_shown'), { threshold }),
      { wrapper, initialProps: { threshold: 0.5 } },
    );
    const first = result.current;

    await rerender({ threshold: 0.9 });

    expect(result.current).toBe(first);
  });

  test('the event builder of the latest render is the one used', async () => {
    const { result, rerender } = await renderHook(
      ({ name }: { name: string }) => useImpressions(() => new TestEvent(name)),
      { wrapper, initialProps: { name: 'first' } },
    );

    await rerender({ name: 'second' });
    await listReports(result.current, 'counting', [['a', true]]);

    expect(tracked(analytics)).toEqual(['second']);
  });

  test('a threshold outside 0 to 1, or a negative time, is refused', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(renderImpressions({ threshold: 1.5 })).rejects.toThrow(
      'threshold must be between 0 and 1, not 1.5.',
    );
    await expect(renderImpressions({ threshold: Number.NaN })).rejects.toThrow('threshold');
    await expect(renderImpressions({ minVisibleMs: -1 })).rejects.toThrow(
      'minVisibleMs must be 0 or more, not -1.',
    );
    jest.restoreAllMocks();
  });

  test('a FlatList takes the props, and keeps them across renders', async () => {
    function Offers({ title }: { title: string }) {
      const impressions = useImpressions(
        (offer: Offer) => new TestEvent('offer_shown', { id: offer.id }),
      );
      return (
        <FlatList
          data={[{ id: 'a' }, { id: 'b' }]}
          keyExtractor={(offer) => offer.id}
          renderItem={({ item }) => <Text>{`${title} ${item.id}`}</Text>}
          {...impressions}
        />
      );
    }

    const result = await render(<Offers title="first" />, { wrapper });
    await result.rerender(<Offers title="second" />);

    expect(screen.getByText('second a')).toBeTruthy();
  });
});

describe('useAnalytics', () => {
  test('a tap tracks through the scope', async () => {
    function Banner() {
      const analytics = useAnalytics();
      return (
        <Button
          title="See the offer"
          onPress={() => analytics.track(new TestEvent('promo_tapped'))}
        />
      );
    }
    await render(<Banner />, { wrapper });

    await fireEvent.press(screen.getByText('See the offer'));

    analytics.assertTracked('promo_tapped');
  });

  test('without a HeraldScope it is refused, with what to do', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    function Banner() {
      useAnalytics();
      return null;
    }

    await expect(render(<Banner />)).rejects.toThrow(
      'No HeraldScope found above this component. Wrap the app in <HeraldScope analytics={...}>.',
    );
    jest.restoreAllMocks();
  });
});
