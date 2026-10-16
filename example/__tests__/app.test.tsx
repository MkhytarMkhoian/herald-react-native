import { expect, test } from '@jest/globals';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '../app/_layout';
import Home from '../app/index';
import Product from '../app/product/[id]';
import Settings from '../app/settings';
import { timeline } from '../src/analytics/app';

const app = { _layout: RootLayout, index: Home, 'product/[id]': Product, settings: Settings };

/** The screen lines the timeline gained while `run` ran, newest first. */
async function screensDuring(run: () => Promise<void>): Promise<string[]> {
  const before = timeline.getLines().length;
  await run();
  const added = timeline.getLines().slice(0, timeline.getLines().length - before);
  return added.filter((line) => line.startsWith('screen'));
}

test('screen views reach the timeline as the user navigates', async () => {
  const screens = await screensDuring(async () => {
    await renderRouter(app, { initialUrl: '/' });
    await fireEvent.press(screen.getByText('week_pass'));
    await act(async () => router.back());
  });

  expect(screens).toEqual(['screen home', 'screen product  product_id=week_pass', 'screen home']);
});

test('settings tracks its own screen view, without @herald-analytics/react', async () => {
  const screens = await screensDuring(async () => {
    await renderRouter(app, { initialUrl: '/' });
    await fireEvent.press(screen.getByText('Settings'));
  });

  expect(screens).toEqual(['screen settings', 'screen home']);
});
