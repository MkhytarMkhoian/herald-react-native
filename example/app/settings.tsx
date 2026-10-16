import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useTheme } from 'expo-router';
import { Identity } from '@herald-analytics/core';

import { AppTheme, SettingsViewed } from '../src/analytics/events';
import { useServices } from '../src/analytics/services';
import { useDarkMode } from '../src/ui/dark-mode';

/**
 * Consent, sign-in and a preference: each control needs a different analytics interface, and gets
 * only that one.
 *
 * It tracks its own screen view with plain Herald, no extra package: once each time it opens. Home
 * and Product use `useTrackScreenView` instead, which also counts coming back to them.
 */
export default function Settings() {
  const { analytics, consent, identity, properties } = useServices();
  const { dark, setDark } = useDarkMode();
  const [shareAnalytics, setShareAnalytics] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    void analytics.track(new SettingsViewed()); // Herald never fails a call
  }, [analytics]);

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Row
        label="Share analytics"
        value={shareAnalytics}
        onChange={async (enabled) => {
          setShareAnalytics(enabled);
          await consent.setEnabled(enabled);
        }}
      />
      <Row
        label="Signed in as user-42"
        value={signedIn}
        onChange={async (on) => {
          setSignedIn(on);
          await (on ? identity.identify(new Identity('user-42')) : identity.reset());
        }}
      />
      <Row
        label="Dark theme"
        value={dark}
        onChange={async (on) => {
          setDark(on);
          await properties.set(new AppTheme(on));
        }}
      />
    </View>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange(value: boolean): void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 17 }}>{label}</Text>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} />
    </View>
  );
}
