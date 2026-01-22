'use client'

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  CSSProperties,
} from 'react'

export interface VirtualScrollProps<T> {
  /** Items to render */
  items: T[]
  /** Height of each item (or function to get dynamic height) */
  itemHeight: number | ((item: T, index: number) => number)
  /** Render function for each item */
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode
  /** Container height (defaults to 100%) */
  containerHeight?: number | string
  /** Number of items to render above/below visible area */
  overscan?: number
  /** Custom className for container */
  className?: string
  /** Callback when scroll position changes */
  onScroll?: (scrollTop: number) => void
  /** Callback when near the end of the list */
  onEndReached?: () => void
  /** Distance from end to trigger onEndReached */
  endReachedThreshold?: number
  /** Loading state for infinite scroll */
  isLoading?: boolean
  /** Loading component */
  loadingComponent?: ReactNode
  /** Empty state component */
  emptyComponent?: ReactNode
  /** Gap between items */
  gap?: number
  /** Enable momentum scrolling on mobile */
  smoothScroll?: boolean
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = '100%',
  overscan = 3,
  className = '',
  onScroll,
  onEndReached,
  endReachedThreshold = 200,
  isLoading = false,
  loadingComponent,
  emptyComponent,
  gap = 0,
  smoothScroll = true,
}: VirtualScrollProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeightPx, setContainerHeightPx] = useState(0)

  // Calculate item heights
  const getItemHeight = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'function') {
        return itemHeight(items[index], index)
      }
      return itemHeight
    },
    [itemHeight, items]
  )

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions: { top: number; height: number }[] = []
    let currentTop = 0

    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i)
      positions.push({ top: currentTop, height })
      currentTop += height + gap
    }

    return positions
  }, [items.length, getItemHeight, gap])

  // Total height of all items
  const totalHeight = useMemo(() => {
    if (itemPositions.length === 0) return 0
    const last = itemPositions[itemPositions.length - 1]
    return last.top + last.height
  }, [itemPositions])

  // Calculate visible items
  const visibleItems = useMemo(() => {
    if (!containerHeightPx || itemPositions.length === 0) return []

    // Find first visible item
    let startIndex = 0
    for (let i = 0; i < itemPositions.length; i++) {
      if (itemPositions[i].top + itemPositions[i].height > scrollTop) {
        startIndex = Math.max(0, i - overscan)
        break
      }
    }

    // Find last visible item
    let endIndex = items.length - 1
    const bottomEdge = scrollTop + containerHeightPx
    for (let i = startIndex; i < itemPositions.length; i++) {
      if (itemPositions[i].top > bottomEdge) {
        endIndex = Math.min(items.length - 1, i + overscan)
        break
      }
    }

    // Generate visible items
    const visible: { item: T; index: number; style: CSSProperties }[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      visible.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: itemPositions[i].top,
          left: 0,
          right: 0,
          height: itemPositions[i].height,
        },
      })
    }

    return visible
  }, [items, itemPositions, scrollTop, containerHeightPx, overscan])

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      const newScrollTop = target.scrollTop
      setScrollTop(newScrollTop)
      onScroll?.(newScrollTop)

      // Check if near end
      if (onEndReached && !isLoading) {
        const distanceFromEnd = totalHeight - newScrollTop - containerHeightPx
        if (distanceFromEnd < endReachedThreshold) {
          onEndReached()
        }
      }
    },
    [onScroll, onEndReached, isLoading, totalHeight, containerHeightPx, endReachedThreshold]
  )

  // Measure container height
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateHeight = () => {
      setContainerHeightPx(container.clientHeight)
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <p className="text-slate-400 text-sm">No items to display</p>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`
        overflow-y-auto overflow-x-hidden
        ${smoothScroll ? 'smooth-touch-scroll' : ''}
        ${className}
      `.trim()}
      style={{
        height: containerHeight,
        WebkitOverflowScrolling: smoothScroll ? 'touch' : undefined,
        overscrollBehavior: 'contain',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: totalHeight,
          width: '100%',
        }}
      >
        {visibleItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index, style)}
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="py-4 flex justify-center">
          {loadingComponent || (
            <div className="mobile-spinner" />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Simple virtualized list for uniform item heights
 */
export interface SimpleVirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => ReactNode
  containerHeight?: number | string
  className?: string
  gap?: number
}

export function SimpleVirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = '100%',
  className = '',
  gap = 0,
}: SimpleVirtualListProps<T>) {
  return (
    <VirtualScroll
      items={items}
      itemHeight={itemHeight}
      gap={gap}
      containerHeight={containerHeight}
      className={className}
      renderItem={(item, index, style) => (
        <div style={style}>{renderItem(item, index)}</div>
      )}
    />
  )
}

/**
 * Hook for manual virtual scroll control
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  const overscan = 3

  const totalHeight = items.length * itemHeight
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount)

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, i) => ({
      item,
      index: startIndex + i,
      offset: (startIndex + i) * itemHeight,
    }))
  }, [items, startIndex, endIndex, itemHeight])

  const scrollTo = useCallback((index: number) => {
    setScrollTop(index * itemHeight)
  }, [itemHeight])

  const scrollToItem = useCallback((predicate: (item: T) => boolean) => {
    const index = items.findIndex(predicate)
    if (index !== -1) {
      scrollTo(index)
    }
  }, [items, scrollTo])

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    setScrollTop,
    scrollTo,
    scrollToItem,
  }
}

export default VirtualScroll
