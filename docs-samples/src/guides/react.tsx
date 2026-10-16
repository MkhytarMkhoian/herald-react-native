import { useEffect } from 'react';
import { Button, FlatList, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  Event,
  EventParameters,
  EventTrackerService,
  Herald,
  ScreenViewEvent,
} from '@herald-analytics/core';
import {
  HeraldScope,
  useAnalytics,
  useImpressions,
  useTrackOnScreen,
  useTrackScreenView,
} from '@herald-analytics/react';

import { ProductScreenViewed } from '../concepts/vocabulary';

export class SettingsScreenViewed implements ScreenViewEvent {
  readonly name = 'settings';
  readonly isScreenView = true;
}

export class CheckoutLeft implements Event {
  readonly name = 'checkout_left';

  constructor(readonly itemsInCart: number) {}
}

export class PromoBannerTapped implements Event {
  readonly name = 'promo_banner_tapped';

  constructor(readonly promoId: string) {}

  get parameters(): EventParameters {
    return { promo_id: this.promoId };
  }
}

export class OfferShown implements Event {
  readonly name = 'offer_shown';

  constructor(readonly offerId: string) {}

  get parameters(): EventParameters {
    return { offer_id: this.offerId };
  }
}

// --8<-- [start:plain]
// Plain Herald, no extra package: the screen tracks its own screen view, once each time it opens.
export function SettingsScreen({ analytics }: { analytics: EventTrackerService }) {
  useEffect(() => {
    analytics.track(new SettingsScreenViewed()); // Herald never fails a call
  }, [analytics]);
  return <View />;
}
// --8<-- [end:plain]

const Stack = createNativeStackNavigator();

// --8<-- [start:setup]
export function ShopApp({ herald }: { herald: Herald }) {
  return (
    <HeraldScope analytics={herald}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Product" component={ProductScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </HeraldScope>
  );
}
// --8<-- [end:setup]

// --8<-- [start:screen-view]
export function ProductScreen({ route }: { route: { params?: { productId?: string } } }) {
  const productId = route.params?.productId ?? 'day_pass';
  useTrackScreenView(new ProductScreenViewed(productId));
  return <Text>{productId}</Text>;
}
// --8<-- [end:screen-view]

export function CheckoutScreen({ itemsInCart }: { itemsInCart: number }) {
  // --8<-- [start:on-screen]
  // Pushed over, closed, or the app went to the background.
  useTrackOnScreen(new CheckoutLeft(itemsInCart), 'hidden');
  // --8<-- [end:on-screen]
  return <View />;
}

// --8<-- [start:tap]
export function PromoBanner({ promoId }: { promoId: string }) {
  const analytics = useAnalytics();
  return (
    <Button title="See the offer" onPress={() => analytics.track(new PromoBannerTapped(promoId))} />
  );
}
// --8<-- [end:tap]

// --8<-- [start:impression]
export function OfferList({ offerIds }: { offerIds: string[] }) {
  const impressions = useImpressions((offerId: string) => new OfferShown(offerId), {
    threshold: 0.5, // half of it on screen
    minVisibleMs: 1000, // for a second, not a fast scroll
  });
  return (
    <FlatList
      data={offerIds}
      keyExtractor={(offerId) => offerId}
      renderItem={({ item }) => <Text>{item}</Text>}
      {...impressions}
    />
  );
}
// --8<-- [end:impression]
