import { expect, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeraldScope } from '@herald-analytics/react';
import { FakeAnalyticsProvider } from '@herald-analytics/testing';

import { PromoBanner, SettingsScreen } from '../../src/guides/react';

test('a screen without the package tracks its own screen view, once', async () => {
  const analytics = new FakeAnalyticsProvider();

  const result = await render(<SettingsScreen analytics={analytics} />);
  await result.rerender(<SettingsScreen analytics={analytics} />);

  expect(analytics.events.map((event) => event.name)).toEqual(['settings']);
});

test('a tap is tracked through the scope', async () => {
  const analytics = new FakeAnalyticsProvider();
  await render(
    <HeraldScope analytics={analytics}>
      <PromoBanner promoId="spring" />
    </HeraldScope>,
  );

  await fireEvent.press(screen.getByText('See the offer'));

  analytics.assertTracked('promo_banner_tapped', (event) => event.param('promo_id', 'spring'));
});
