# Herald for React

Tracks Herald events from React Native screens and lists: screen views each time a screen becomes
visible, impressions when a list item is really on screen, and taps in components that have no
view model.

You don't need it to use Herald. A view model can track its own events, screen views included,
through `EventTrackerService`. Use this package when tracking from components is the simpler fit,
such as counting a screen each time the user comes back to it.

It works with [React Navigation](https://reactnavigation.org) 7 and with
[Expo Router](https://docs.expo.dev/router/introduction/), which is built on it.

## Set it up once

```tsx
<HeraldScope analytics={herald}>
  <NavigationContainer>{/* your screens */}</NavigationContainer>
</HeraldScope>
```

With Expo Router, put `HeraldScope` in the root `_layout.tsx`, around the `<Stack />` or `<Slot />`.

## Screen views, owned by each screen

```tsx
function ProductScreen({ productId }: Props) {
  useTrackScreenView(new ProductViewed(productId));
  return <ProductView id={productId} />;
}
```

It tracks each time the screen becomes visible: when it appears, when the user comes back to it,
and when the app comes back from the background with it on top. Re-renders don't count, and
switching tabs counts like any other screen. A React Native `Modal` over the screen doesn't hide
it, and neither does iOS briefly taking focus, as for Control Centre or a system alert. On iOS the
notification centre sends the app to the background, so it hides the screen.

To track when the user leaves a screen:

```tsx
useTrackOnScreen(new CheckoutLeft(cart.length), 'hidden');
```

The event of the latest render is the one sent.

## Taps

```tsx
const analytics = useAnalytics();

<Button title="See the offer" onPress={() => analytics.track(new PromoTapped(promo.id))} />;
```

Events that come from your app's logic belong in its view model. This is for small components that
have none.

## Impressions in lists

```tsx
const impressions = useImpressions((offer: Offer) => new OfferShown(offer.id), {
  threshold: 0.5, // half of it on screen
  minVisibleMs: 1000, // for a second, not a fast scroll
});

<FlatList data={offers} renderItem={renderOffer} keyExtractor={(offer) => offer.id} {...impressions} />;
```

It counts once per appearance: an item that leaves the screen completely and comes back counts
again. Items are told apart by the list's keys. With `minVisibleMs`, React Native's list checks the
item again when the time is up, so at the slow end of a fling an item can count while it is still
moving out of view. It works with `FlatList`, `SectionList` and
`VirtualizedList`. The options are read once, because a list can't change them later.

## Tests

Wrap the component in a `HeraldScope` with a `FakeAnalyticsProvider` from
`@herald-analytics/testing`:

```tsx
const analytics = new FakeAnalyticsProvider();
await render(
  <HeraldScope analytics={analytics}>
    <NavigationContainer>{/* the screen under test */}</NavigationContainer>
  </HeraldScope>,
);

analytics.assertTracked('product', (event) => event.param('product_id', 'p1'));
```

## Limits

- **Development builds with React's Strict Mode** run effects twice, so a screen view can be tracked
  twice there. Release builds aren't affected.
- **Impressions outside lists** aren't supported yet: React Native's way to tell when any view is on
  screen is still switched off by default. A carousel can be a horizontal `FlatList`, which
  `useImpressions` covers.

## Documentation

It works with [`@herald-analytics/core`](https://www.npmjs.com/package/@herald-analytics/core), the
core. The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
