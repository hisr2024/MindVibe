/**
 * OptimizedList — Performance-optimized list component
 *
 * Wraps @shopify/flash-list v2 with Kiaanverse defaults:
 * - Efficient item recycling and virtualization
 * - Draw distance for off-screen rendering budget
 * - Proper typing for generic data items
 *
 * Note: FlashList v2 auto-measures items — no estimatedItemSize needed.
 */

import React from 'react';
import { FlashList, type FlashListProps, type FlashListRef, type ListRenderItem } from '@shopify/flash-list';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimizedListProps<T> extends FlashListProps<T> {
  /** Data array to render */
  data: T[];
  /** Render function for each item */
  renderItem: ListRenderItem<T>;
  /** Unique key extractor — MUST NOT use array index */
  keyExtractor: (item: T, index: number) => string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function OptimizedListInner<T>(
  props: OptimizedListProps<T>,
  ref: React.Ref<FlashListRef<T>>,
) {
  const {
    drawDistance = 250,
    ...rest
  } = props;

  return (
    <FlashList<T>
      ref={ref}
      drawDistance={drawDistance}
      {...rest}
    />
  );
}

OptimizedListInner.displayName = 'OptimizedList';

export const OptimizedList = React.forwardRef(OptimizedListInner) as <T>(
  props: OptimizedListProps<T> & { ref?: React.Ref<FlashListRef<T>> },
) => React.ReactElement | null;

export default OptimizedList;
