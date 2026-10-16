import { useSyncExternalStore } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Link, useTheme } from 'expo-router';
import { useImpressions, useTrackScreenView } from '@herald-analytics/react/expo-router';

import { HomeViewed, ProductListed } from '../src/analytics/events';
import { useServices } from '../src/analytics/services';

const products = ['day_pass', 'week_pass', 'month_pass'];

/** Products, and below them every call Herald made, newest first. */
export default function Home() {
  // Each time Home becomes visible, also when the user comes back to it.
  useTrackScreenView(new HomeViewed());
  // A product row counts once it is half on screen for half a second.
  const impressions = useImpressions((product: string) => new ProductListed(product), {
    threshold: 0.5,
    minVisibleMs: 500,
  });
  const { timeline } = useServices();
  const lines = useSyncExternalStore(timeline.subscribe, timeline.getLines);
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={products}
        keyExtractor={(product) => product}
        scrollEnabled={false}
        style={{ flexGrow: 0 }}
        renderItem={({ item }) => (
          <Link href={`/product/${item}`} asChild>
            <Pressable style={{ padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text, fontSize: 17 }}>{item}</Text>
            </Pressable>
          </Link>
        )}
        {...impressions}
      />
      <Text style={{ color: colors.text, padding: 16, fontWeight: '600' }}>What Herald sent</Text>
      <FlatList
        testID="timeline"
        data={lines}
        keyExtractor={(_, index) => String(lines.length - index)}
        renderItem={({ item }) => (
          <Text
            style={{
              color: colors.text,
              fontFamily: 'Menlo',
              fontSize: 12,
              paddingHorizontal: 16,
              paddingVertical: 4,
            }}
          >
            {item}
          </Text>
        )}
      />
    </View>
  );
}
