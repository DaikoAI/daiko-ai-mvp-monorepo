import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main className="safe-main-container px-4 pt-6">
      <Skeleton className="h-8 w-32 mb-6" />

      <div className="space-y-6">
        {/* User card skeleton */}
        <div className="rounded-lg border p-6 bg-card">
          <div className="flex items-center">
            <div className="relative mr-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="absolute bottom-0 right-0 h-7 w-7 rounded-full" />
            </div>

            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Personal information card skeleton */}
        <div className="rounded-lg border p-6 bg-card">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Connected accounts card skeleton */}
        <div className="rounded-lg border p-6 bg-card">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Investment preferences card skeleton */}
        <div className="rounded-lg border p-6 bg-card">
          <Skeleton className="h-6 w-56 mb-6" />
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mb-2" />
              <div className="flex space-x-4">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>

        {/* Save button skeleton */}
        <Skeleton className="h-10 w-full" />
      </div>
    </main>
  );
}
