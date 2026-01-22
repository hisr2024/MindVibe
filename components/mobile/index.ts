/**
 * Mobile-optimized components for premium mobile UX
 *
 * These components are designed specifically for mobile devices with:
 * - Touch-friendly interactions
 * - Haptic feedback
 * - Smooth spring animations
 * - Proper touch targets (min 44px)
 * - iOS safe area support
 */

// Core mobile components
export { MobileCard, type MobileCardProps } from './MobileCard'
export {
  MobileButton,
  MobileIconButton,
  type MobileButtonProps,
  type MobileIconButtonProps,
} from './MobileButton'
export {
  MobileSkeleton,
  MobileSkeletonCard,
  MobileSkeletonList,
  MobileSkeletonGrid,
  type MobileSkeletonProps,
} from './MobileSkeleton'
export {
  MobileInput,
  MobileTextarea,
  type MobileInputProps,
  type MobileTextareaProps,
} from './MobileInput'
export { PullToRefresh, type PullToRefreshProps } from './PullToRefresh'

// Bottom Sheet
export {
  MobileBottomSheet,
  ConfirmationSheet,
  ActionSheet,
  type MobileBottomSheetProps,
  type ConfirmationSheetProps,
  type ActionSheetProps,
  type ActionSheetOption,
} from './MobileBottomSheet'

// Floating Action Button
export {
  MobileActionButton,
  ExpandableFAB,
  type MobileActionButtonProps,
  type FABAction,
  type ExpandableFABProps,
} from './MobileActionButton'

// Toast Notifications
export {
  MobileToastContainer,
  showToast,
  dismissToast,
  toast,
  type ToastType,
  type ToastPosition,
  type ToastConfig,
  type Toast,
  type MobileToastContainerProps,
} from './MobileToast'

// PWA Install Prompt
export {
  PWAInstallPrompt,
  type PWAInstallPromptProps,
} from './PWAInstallPrompt'

// Virtual Scroll for performance
export {
  VirtualScroll,
  SimpleVirtualList,
  useVirtualScroll,
  type VirtualScrollProps,
  type SimpleVirtualListProps,
} from './VirtualScroll'

// Mobile Header with scroll awareness
export {
  MobileHeader,
  HeaderAction,
  SearchHeader,
  type MobileHeaderProps,
  type HeaderActionProps,
  type SearchHeaderProps,
} from './MobileHeader'

// Mobile Tab Bar
export {
  MobileTabBar,
  SegmentedControl,
  type MobileTabBarProps,
  type TabItem,
  type SegmentedControlProps,
} from './MobileTabBar'

// Enhanced Skeletons
export {
  Skeleton,
  TextSkeleton,
  AvatarSkeleton,
  CardSkeleton,
  ListSkeleton,
  MessageSkeleton,
  ChatSkeleton,
  GridSkeleton,
  ProfileSkeleton,
  FeedSkeleton,
  SkeletonContainer,
  type SkeletonProps,
  type TextSkeletonProps,
  type AvatarSkeletonProps,
  type CardSkeletonProps,
  type ListSkeletonProps,
  type MessageSkeletonProps,
  type ChatSkeletonProps,
  type GridSkeletonProps,
  type SkeletonContainerProps,
} from './MobileSkeletons'
