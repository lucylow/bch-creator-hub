import { Skeleton } from '@/components/ui/skeleton';

const AnalyticsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-8 w-28 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="glass-card rounded-xl p-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex flex-wrap gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full max-w-[200px] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AnalyticsSkeleton;
