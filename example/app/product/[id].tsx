import { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useTheme } from 'expo-router';
import { useTrackScreenView } from '@herald-analytics/react/expo-router';

import { AddedToCart, OrderPaid, ProductViewed, PurchaseCount } from '../../src/analytics/events';
import { useServices } from '../../src/analytics/services';

const price = 4.99;

/** A product. The screen tracks its own events and doesn't know which vendors get them. */
export default function Product() {
  const productId = String(useLocalSearchParams<{ id: string }>().id);
  // The screen view comes from @herald-analytics/react, like Home's.
  useTrackScreenView(new ProductViewed(productId));
  const { analytics, properties } = useServices();
  const [inCart, setInCart] = useState(0);
  const [purchases, setPurchases] = useState(0);
  const { colors } = useTheme();

  async function addToCart() {
    setInCart(inCart + 1);
    await analytics.track(new AddedToCart(productId, price));
  }

  async function buy() {
    const items = inCart;
    const count = purchases + 1;
    setInCart(0);
    setPurchases(count);
    await properties.set(new PurchaseCount(count));
    await analytics.track(new OrderPaid(items, Math.round(items * price * 100) / 100));
  }

  return (
    <View style={{ padding: 16, gap: 16 }}>
      <Stack.Screen options={{ title: productId }} />
      <Text style={{ color: colors.text, fontSize: 28 }}>${price}</Text>
      <Button title="Add to cart" onPress={addToCart} />
      <Button title={`Buy ${inCart}`} onPress={buy} disabled={inCart === 0} />
    </View>
  );
}
