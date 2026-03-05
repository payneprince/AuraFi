'use client';

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-800",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Card Display Skeleton */}
      <div className="relative bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-8 shadow-2xl h-56">
        {/* Brand Logo Skeleton */}
        <div className="flex items-center justify-between mb-12">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex space-x-2">
            <Skeleton className="w-16 h-6 rounded-full" />
            <Skeleton className="w-14 h-6 rounded-full" />
          </div>
        </div>

        {/* Card Number Skeleton */}
        <div className="mb-6">
          <Skeleton className="w-48 h-8" />
        </div>

        {/* Card Details Skeleton */}
        <div className="flex items-end justify-between">
          <div>
            <Skeleton className="w-20 h-3 mb-1" />
            <Skeleton className="w-24 h-5" />
          </div>
          <div>
            <Skeleton className="w-12 h-3 mb-1" />
            <Skeleton className="w-10 h-5" />
          </div>
          <div>
            <Skeleton className="w-8 h-3 mb-1" />
            <div className="flex items-center space-x-2">
              <Skeleton className="w-8 h-5" />
              <Skeleton className="w-4 h-4 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Card Controls Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <Skeleton className="w-32 h-6 mb-4" />

        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <Skeleton className="w-40 h-4 mb-1" />
          <Skeleton className="w-32 h-8" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-12 rounded-lg" />
          ))}
        </div>

        <div>
          <Skeleton className="w-40 h-5 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="w-32 h-4 mb-1" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                </div>
                <Skeleton className="w-16 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
