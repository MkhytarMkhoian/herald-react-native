# Herald for React

Tracks Herald events from React Native screens and lists: screen views each time a screen becomes
visible, list items once they are really on screen, and taps in small components.

You don't need it to use Herald: a view model can track its own events. Use it when tracking from
components is simpler, such as counting a screen each time the user comes back to it.

## React Navigation or Expo Router

Import from the path that matches your app's navigation. Everything has the same name in both.

| Your app uses | Import from |
| --- | --- |
| [React Navigation](https://reactnavigation.org) 7 | `@herald-analytics/react` |
| [Expo Router](https://docs.expo.dev/router/introduction/) 57 or newer | `@herald-analytics/react/expo-router` |

Expo Router has its own copy of React Navigation inside, so a hook from the wrong path can't see its
screen.

## Set it up once

With React Navigation:

```tsx
<HeraldScope analytics={herald}>
  <NavigationContainer>{/* your screens */}</NavigationContainer>
</HeraldScope>
```

With Expo Router, in the root `app/_layout.tsx`:

```tsx
import { HeraldScope } from '@herald-analytics/react/expo-router';

export default function RootLayout() {
  return (
    <HeraldScope analytics={herald}>
      <Stack />
    </HeraldScope>
  );
}
```

## Screen views, owned by each screen

```tsx
function ProductScreen({ productId }: Props) {
  useTrackScreenView(new ProductViewed(productId));
  return <ProductView id={productId} />;
}
```

It tracks each time the screen becomes visible: when it appears, when the user comes back to it,
and when the app comes back from the background. Re-renders don't count; switching tabs does. A
`Modal` over the screen doesn't hide it, and neither does iOS briefly taking focus, as for Control
Centre.

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

This is for small components. Events from your app's logic belong in its view model.

## Impressions in lists

```tsx
const impressions = useImpressions((offer: Offer) => new OfferShown(offer.id), {
  threshold: 0.5, // half of it on screen
  minVisibleMs: 1000, // for a second, not a fast scroll
});

<FlatList data={offers} renderItem={renderOffer} keyExtractor={(offer) => offer.id} {...impressions} />;
```

It counts once per appearance: an item that leaves the screen completely counts again when it comes
back. It works with `FlatList`, `SectionList` and `VirtualizedList`. The options are read once,
because a list can't change them later.

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

- **React's Strict Mode** runs effects twice in development, so a screen view can be tracked twice
  there. Release builds aren't affected.
- **Impressions outside lists** aren't supported yet. A carousel can be a horizontal `FlatList`.

## Documentation

The [Herald website](https://mkhytarmkhoian.github.io/herald-docs/) has the guides, and the
[repository](https://github.com/MkhytarMkhoian/herald-react-native) has the other packages.
