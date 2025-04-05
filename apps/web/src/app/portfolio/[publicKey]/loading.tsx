import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioLoading() {
  return (
    <main className="safe-main-container px-4 pt-6 flex flex-col gap-6">
      <section>
        <Skeleton className="h-8 w-32" />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-6" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {/* Portfolio chart skeleton */}
        <div className="rounded-lg border p-4 bg-card">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-[200px] w-full rounded-md" />
        </div>

        {/* PnL chart skeleton */}
        <div className="rounded-lg border p-4 bg-card">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-[200px] w-full rounded-md" />
        </div>
      </section>

      {/* Asset list skeleton */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center p-3 rounded-lg border">
              <Skeleton className="h-8 w-8 rounded-full mr-3" />
              <div className="flex-1">
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-20 mb-1" />
                <Skeleton className="h-4 w-12 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NFT assets skeleton */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-3">
                <Skeleton className="h-5 w-full mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Perpetual positions skeleton */}
      <section>
        <Skeleton className="h-5 w-48 mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DeFi positions skeleton */}
      <section>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
