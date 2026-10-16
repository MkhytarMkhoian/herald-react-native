import { Stack } from 'expo-router';
import { HeraldScope } from '@herald-analytics/react/expo-router';

import { createHerald } from '../quick-start';

const herald = createHerald();

// --8<-- [start:setup]
// app/_layout.tsx
export default function RootLayout() {
  return (
    <HeraldScope analytics={herald}>
      <Stack />
    </HeraldScope>
  );
}
// --8<-- [end:setup]
