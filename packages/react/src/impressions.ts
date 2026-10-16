import { useLayoutEffect, useRef, useState } from 'react';
import type { Event } from '@herald-analytics/core';

import { useAnalytics } from './scope';

/** What a list says about one item. Herald has its own, because React Native renamed it. */
interface ListItemToken {
  readonly item: unknown;
  readonly key: string;
  readonly isViewable: boolean;
}

/** The list props `useImpressions` returns. Spread them onto the list. */
export interface ImpressionListProps {
  readonly viewabilityConfigCallbackPairs: {
    viewabilityConfig: { itemVisiblePercentThreshold: number; minimumViewTime?: number };
    onViewableItemsChanged: (info: { changed: ListItemToken[] }) => void;
  }[];
}

export interface ImpressionOptions {
  /** How much of an item must be on screen: from 0, any part, to 1, all of it. 0.5 by default. */
  readonly threshold?: number;
  /** How long it must stay that visible, in milliseconds. 0 by default. */
  readonly minVisibleMs?: number;
}

/**
 * Tracks each list item once it's visible enough, for long enough. Spread the result onto a
 * `FlatList`, `SectionList` or `VirtualizedList`.
 *
 * It counts once per appearance: an item that left the screen completely counts again when it comes
 * back. The options are read once, because a list can't change them later.
 */
export function useImpressions<T>(
  eventFor: (item: T) => Event,
  options: ImpressionOptions = {},
): ImpressionListProps {
  const analytics = useAnalytics();
  const latest = useRef({ analytics, eventFor });
  useLayoutEffect(() => {
    latest.current = { analytics, eventFor };
  });

  // Made once and kept: a list refuses new pairs after its first render.
  const [props] = useState((): ImpressionListProps => {
    const threshold = options.threshold ?? 0.5;
    const minVisibleMs = options.minVisibleMs ?? 0;
    if (!(threshold >= 0 && threshold <= 1)) {
      throw new RangeError(`threshold must be between 0 and 1, not ${threshold}.`);
    }
    if (!(minVisibleMs >= 0)) {
      throw new RangeError(`minVisibleMs must be 0 or more, not ${minVisibleMs}.`);
    }
    const counted = new Set<string>();
    return {
      viewabilityConfigCallbackPairs: [
        {
          // Counts an item once it is visible enough, for long enough.
          viewabilityConfig: {
            itemVisiblePercentThreshold: threshold * 100,
            minimumViewTime: minVisibleMs,
          },
          onViewableItemsChanged: ({ changed }) => {
            for (const token of changed) {
              if (!token.isViewable || counted.has(token.key)) continue;
              counted.add(token.key);
              const { analytics, eventFor } = latest.current;
              // Herald never rejects; another tracker's failure becomes an unhandled rejection.
              void analytics.track(eventFor(token.item as T));
            }
          },
        },
        {
          // Forgets an item once no part of it is on screen, so its next appearance counts again.
          viewabilityConfig: { itemVisiblePercentThreshold: 0 },
          onViewableItemsChanged: ({ changed }) => {
            for (const token of changed) if (!token.isViewable) counted.delete(token.key);
          },
        },
      ],
    };
  });
  return props;
}
