import { useLayoutEffect, useRef, useState } from 'react';
import type { Event } from '@herald-analytics/core';

import { useAnalytics } from './scope';

/** What a list says about one item. React Native names this type differently across versions. */
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
  /**
   * How long it must stay that visible, in milliseconds. 0 by default. The list checks the item
   * again when the time is up, not all along.
   */
  readonly minVisibleMs?: number;
}

/**
 * Tracks an impression of each list item once at least `threshold` of it is on screen. With
 * `minVisibleMs`, it must still be that visible when the time is up, or it doesn't count. Spread the
 * result onto a `FlatList`, `SectionList` or `VirtualizedList`:
 *
 * ```tsx
 * const impressions = useImpressions((offer: Offer) => new OfferShown(offer.id), {
 *   threshold: 0.5,
 *   minVisibleMs: 1000,
 * });
 * <FlatList data={offers} renderItem={renderOffer} {...impressions} />;
 * ```
 *
 * It counts once per appearance: once an item has left the screen completely, coming back counts
 * again. Items are told apart by the list's keys. The options are read once, because a list can't
 * change them later. Throws if `threshold` isn't between 0 and 1, or `minVisibleMs` is negative.
 *
 * It needs a `HeraldScope` above it.
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
              // Herald never rejects. Another tracker's failure shows up as an unhandled rejection.
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
