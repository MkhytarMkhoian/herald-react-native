import { expect, test } from '@jest/globals';
import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Herald, HeraldProvider, double, int } from '@herald-analytics/core';
import { HeraldScope } from '@herald-analytics/react/expo-router';
import { FakeAnalyticsProvider } from '@herald-analytics/testing';

import Product from '../app/product/[id]';
import { ServicesProvider } from '../src/analytics/services';
import { TimelineAnalytics } from '../src/analytics/timeline';

test('buying reports the purchase count, then the order with its total', async () => {
  const analytics = new FakeAnalyticsProvider();
  const herald = new Herald({
    providers: [new HeraldProvider({ name: 'test', events: analytics, properties: analytics })],
  });
  function Layout() {
    return (
      <HeraldScope analytics={herald}>
        <ServicesProvider
          services={{
            analytics: herald,
            properties: herald,
            consent: herald,
            identity: herald,
            timeline: new TimelineAnalytics(),
          }}
        >
          <Slot />
        </ServicesProvider>
      </HeraldScope>
    );
  }
  await renderRouter(
    { _layout: Layout, 'product/[id]': Product },
    { initialUrl: '/product/day_pass' },
  );

  await fireEvent.press(screen.getByText('Add to cart'));
  await fireEvent.press(screen.getByText('Add to cart'));
  await fireEvent.press(screen.getByText('Buy 2'));

  analytics
    .assertTracked('product', (event) => event.param('product_id', 'day_pass'))
    .assertTrackedTimes('added_to_cart', 2)
    .assertTracked('order_paid', (event) =>
      event.param('items', int(2)).param('total', double(9.98)),
    )
    .assertNothingElseTracked()
    .assertPropertySet('total_purchases', int(1));
  expect(analytics.records.map((record) => record.kind).slice(-2)).toEqual(['property', 'tracked']);
});
