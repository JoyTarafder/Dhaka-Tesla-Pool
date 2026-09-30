"use client";

interface SkeletonProps {
  className?: string;
}

/**
 * Low-level shimmering placeholder block with glass aesthetic
 */
export function SkeletonShimmer({ className = "h-4 w-full" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#d4d8ee]/70 border border-white/50 ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Passenger Console: Active ride tracking card skeleton
 */
export function RideCardSkeleton() {
  return (
    <div className="p-5 sm:p-7 rounded-3xl glass border border-white/80 space-y-6 animate-pulse shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-[#d4d8ee]/60">
        <div className="space-y-2 w-full sm:w-auto">
          <SkeletonShimmer className="h-4 w-28 rounded-full" />
          <SkeletonShimmer className="h-6 w-48 rounded-lg" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <SkeletonShimmer className="h-6 w-20 rounded-md" />
          <SkeletonShimmer className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <SkeletonShimmer className="h-14 w-full rounded-2xl" />
    </div>
  );
}

/**
 * Driver Console: Telemetry and active pool manifest skeleton
 */
export function DriverConsoleSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-7 animate-pulse" aria-label="Loading driver console...">
      {/* Vehicle Card Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 sm:p-6 rounded-2xl glass border border-white/80 md:col-span-2 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <SkeletonShimmer className="h-12 w-12 rounded-2xl" />
              <div className="space-y-2">
                <SkeletonShimmer className="h-5 w-36 rounded-md" />
                <SkeletonShimmer className="h-3 w-52 rounded-md" />
              </div>
            </div>
            <SkeletonShimmer className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#d4d8ee]/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <SkeletonShimmer className="h-3 w-16 rounded" />
                <SkeletonShimmer className="h-5 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl glass border border-white/80 space-y-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-2">
            <SkeletonShimmer className="h-4 w-24 rounded" />
            <SkeletonShimmer className="h-3 w-40 rounded" />
          </div>
          <SkeletonShimmer className="h-11 w-full rounded-full" />
        </div>
      </div>

      {/* Pool Manifest Skeleton */}
      <div className="p-5 sm:p-7 rounded-3xl glass border border-white/80 space-y-5 shadow-xl">
        <div className="flex justify-between items-center pb-4 border-b border-[#d4d8ee]/60">
          <SkeletonShimmer className="h-6 w-44 rounded-md" />
          <SkeletonShimmer className="h-6 w-24 rounded-full" />
        </div>
        <div className="space-y-3">
          <SkeletonShimmer className="h-16 w-full rounded-2xl" />
          <SkeletonShimmer className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Driver Payment History: Overview metrics & trip list skeleton
 */
export function PaymentHistorySkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse" aria-label="Loading payment telemetry...">
      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl glass border border-white/80 shadow-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <SkeletonShimmer className="h-3.5 w-24 rounded-md" />
              <SkeletonShimmer className="h-8 w-8 rounded-xl" />
            </div>
            <SkeletonShimmer className="h-8 w-28 rounded-lg" />
            <SkeletonShimmer className="h-3 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Trip History Section Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2">
          <div className="space-y-1.5">
            <SkeletonShimmer className="h-5 w-44 rounded-md" />
            <SkeletonShimmer className="h-3 w-56 rounded-md" />
          </div>
          <SkeletonShimmer className="h-6 w-24 rounded-full" />
        </div>

        {/* Trip Cards */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-2xl glass border border-white/80 shadow-md space-y-3"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <SkeletonShimmer className="h-5 w-36 rounded-md" />
                    <SkeletonShimmer className="h-5 w-20 rounded-full" />
                  </div>
                  <SkeletonShimmer className="h-3 w-48 rounded-md" />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <SkeletonShimmer className="h-7 w-20 rounded-md" />
                  <SkeletonShimmer className="h-8 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Passenger Console: Fare breakdown placeholder skeleton
 */
export function FareBreakdownSkeleton() {
  return (
    <div className="space-y-4 pt-1 animate-pulse" aria-label="Calculating fare...">
      {/* Route Corridor Info Chip Skeleton */}
      <div className="p-3 rounded-xl bg-white/60 border border-[#d4d8ee] flex items-center justify-between">
        <SkeletonShimmer className="h-4 w-36 rounded" />
        <SkeletonShimmer className="h-5 w-16 rounded-md" />
      </div>

      {/* Rows */}
      <div className="space-y-2.5 py-1">
        <div className="flex justify-between items-center">
          <SkeletonShimmer className="h-3.5 w-20 rounded" />
          <SkeletonShimmer className="h-4 w-14 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <SkeletonShimmer className="h-3.5 w-24 rounded" />
          <SkeletonShimmer className="h-4 w-14 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <SkeletonShimmer className="h-3.5 w-28 rounded" />
          <SkeletonShimmer className="h-4 w-14 rounded" />
        </div>
      </div>

      {/* Total Box */}
      <div className="p-4 rounded-xl bg-accent-soft/50 border border-accent/20 flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonShimmer className="h-3.5 w-24 rounded" />
          <SkeletonShimmer className="h-2.5 w-32 rounded" />
        </div>
        <SkeletonShimmer className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}
