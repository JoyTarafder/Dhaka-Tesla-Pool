"use client";

interface SkeletonProps {
  className?: string;
}

export function SkeletonShimmer({ className = "h-4 w-full" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-zinc-800/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function RideCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <SkeletonShimmer className="h-5 w-40" />
        <SkeletonShimmer className="h-6 w-24" />
      </div>
      <SkeletonShimmer className="h-2 w-full rounded-full" />
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonShimmer key={i} className="h-8 w-8 mx-auto rounded-full" />
        ))}
      </div>
    </div>
  );
}
