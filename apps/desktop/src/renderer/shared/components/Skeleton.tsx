/**
 * Skeleton Components
 *
 * A collection of placeholder components used to display loading states.
 * These improve perceived performance and prevent layout shifts (CLS).
 *
 * @module renderer/shared/components/Skeleton
 */

// ============ Base Skeleton ============

interface SkeletonProps {
  /** Optional additional CSS classes. */
  className?: string;
}

/**
 * Basic skeleton block with pulse animation.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      role="presentation"
      aria-hidden="true"
    />
  );
}

// ============ Dashboard Skeleton ============

/**
 * Skeleton layout for the Dashboard view.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Goal Progress */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <GoalCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Right Column - Today's Schedule & Reminders */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <ScheduleItemSkeleton key={i} />
            ))}
          </div>

          {/* Upcoming Reminders */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <ReminderItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Stat Card Skeleton ============

/**
 * Skeleton for a statistics summary card.
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-12" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// ============ Goal Card Skeleton ============

/**
 * Skeleton for a goal progress card.
 */
export function GoalCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

// ============ Goal List Skeleton ============

/**
 * Skeleton for the full Goal List view.
 */
export function GoalListSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <GoalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ============ Task Card Skeleton ============

/**
 * Skeleton for a task item card.
 */
export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
    </div>
  );
}

// ============ Task List Skeleton ============

/**
 * Skeleton for the Task List view.
 */
export function TaskListSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ============ Schedule Item Skeleton ============

/**
 * Skeleton for a schedule/calendar event item.
 */
export function ScheduleItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md">
      <Skeleton className="h-10 w-10 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-6 w-6 rounded-full" />
    </div>
  );
}

// ============ Reminder Item Skeleton ============

/**
 * Skeleton for a reminder item.
 */
export function ReminderItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// ============ List Item Skeleton ============

/**
 * Generic skeleton for a list item with an avatar/icon.
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

// ============ Table Skeleton ============

interface TableSkeletonProps {
  /** Number of rows to render. Default: 5 */
  rows?: number;
  /** Number of columns to render. Default: 4 */
  columns?: number;
}

/**
 * Skeleton for a table view.
 */
export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="rounded-md border">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 p-4 border-b last:border-b-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
