import { Skeleton } from "@/components/ui/skeleton";

export default function ProposalsLoading() {
  return (
    <main className="safe-main-container px-4 pt-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72 mt-1" />
      </div>

      <div className="space-y-4">
        {/* Proposal card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border glass p-4 md:p-6">
            <div className="flex flex-col gap-3 md:gap-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-64 md:w-96" />
                  <Skeleton className="h-4 w-full md:w-[500px]" />
                </div>

                <Skeleton className="h-8 w-8 rounded-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Skeleton className="h-8 w-full rounded-full" />
                  <Skeleton className="h-8 w-full rounded-full" />
                  <Skeleton className="h-8 w-full rounded-full" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
