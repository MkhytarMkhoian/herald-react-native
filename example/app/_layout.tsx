import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { DarkTheme, DefaultTheme, Link, Stack, ThemeProvider } from 'expo-router';
import { HeraldScope } from '@herald-analytics/react/expo-router';

import { herald, services } from '../src/analytics/app';
import { ServicesProvider } from '../src/analytics/services';
import { DarkModeContext } from '../src/ui/dark-mode';

// Start the vendors, then re-apply the stored consent: some vendors forget it between launches.
// This app stores nothing, so it starts without consent.
void herald.start().then(() => herald.setEnabled(false));

export default function RootLayout() {
  const [dark, setDark] = useState(false);
  return (
    <HeraldScope analytics={herald}>
      <ServicesProvider services={services}>
        <DarkModeContext.Provider value={{ dark, setDark }}>
          <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen
                name="index"
                options={{
                  title: 'Herald example',
                  headerRight: () => (
                    <Link href="/settings" asChild>
                      <Pressable accessibilityRole="button">
                        <Text style={{ color: '#3557d4', fontSize: 17 }}>Settings</Text>
                      </Pressable>
                    </Link>
                  ),
                }}
              />
              <Stack.Screen name="product/[id]" />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            </Stack>
          </ThemeProvider>
        </DarkModeContext.Provider>
      </ServicesProvider>
    </HeraldScope>
  );
}
