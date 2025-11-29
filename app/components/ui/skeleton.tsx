import { cn } from '../../../lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-xl bg-calm-200/70 dark:bg-ink-300/60', className)} {...props} />
}
