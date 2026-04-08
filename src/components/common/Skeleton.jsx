/* Skeleton loading primitives + page-specific skeleton screens */

const pulse = 'animate-pulse bg-slate-200 rounded';

const Box = ({ className = '' }) => <div className={`${pulse} ${className}`} />;

/* ─── Reusable primitives ─────────────────────────────────────────────────── */

export const SkeletonText = ({ className = 'h-4 w-full' }) => <Box className={className} />;

export const SkeletonStatCard = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
    <div className="flex items-center justify-between">
      <Box className="h-4 w-24" />
      <Box className="h-8 w-8 rounded-lg" />
    </div>
    <Box className="h-8 w-32" />
    <Box className="h-3 w-20" />
  </div>
);

export const SkeletonTableRow = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Box className={`h-4 ${i === 0 ? 'w-24' : i === cols - 1 ? 'w-16' : 'w-full'}`} />
      </td>
    ))}
  </tr>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-5 space-y-3 ${className}`}>
    <div className="flex items-start justify-between">
      <Box className="h-5 w-1/2" />
      <Box className="h-6 w-16 rounded-full" />
    </div>
    <Box className="h-4 w-3/4" />
    <Box className="h-4 w-2/3" />
    <div className="flex gap-2 pt-1">
      <Box className="h-8 flex-1 rounded-lg" />
      <Box className="h-8 flex-1 rounded-lg" />
    </div>
  </div>
);

/* ─── Page-level skeletons ────────────────────────────────────────────────── */

export const DashboardSkeleton = () => (
  <div className="space-y-8">
    {/* Header */}
    <div className="space-y-2">
      <Box className="h-8 w-56" />
      <Box className="h-4 w-80" />
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
    </div>

    {/* Secondary cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <Box className="h-4 w-32" />
          <Box className="h-8 w-16" />
        </div>
      ))}
    </div>

    {/* Table */}
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <Box className="h-6 w-40" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Box className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonTableRow key={i} cols={6} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const BookingsSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Box className="h-8 w-36" />
        <Box className="h-4 w-56" />
      </div>
      <Box className="h-10 w-28 rounded-lg" />
    </div>

    {/* Filter cards */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 space-y-2">
          <Box className="h-3 w-20" />
          <Box className="h-7 w-12" />
        </div>
      ))}
    </div>

    {/* Table */}
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {Array.from({ length: 7 }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Box className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonTableRow key={i} cols={7} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const GuestsSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Box className="h-8 w-28" />
        <Box className="h-4 w-56" />
      </div>
      <Box className="h-10 w-64 rounded-lg" />
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 space-y-2">
          <Box className="h-4 w-24" />
          <Box className="h-8 w-16" />
        </div>
      ))}
    </div>

    {/* Guest cards grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Box className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Box className="h-4 w-32" />
              <Box className="h-3 w-20" />
            </div>
          </div>
          <Box className="h-3 w-3/4" />
          <Box className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  </div>
);

export const RoomsSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Box className="h-8 w-36" />
        <Box className="h-4 w-48" />
      </div>
      <Box className="h-10 w-32 rounded-lg" />
    </div>

    {/* Room cards grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Box className="h-48 w-full rounded-none" />
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <Box className="h-5 w-28" />
              <Box className="h-6 w-16 rounded-full" />
            </div>
            <Box className="h-4 w-20" />
            <Box className="h-4 w-3/4" />
            <div className="flex gap-2 pt-1">
              <Box className="h-9 flex-1 rounded-lg" />
              <Box className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const StaffSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Box className="h-8 w-24" />
        <Box className="h-4 w-48" />
      </div>
      <Box className="h-10 w-32 rounded-lg" />
    </div>

    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Box className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Box className="h-9 w-9 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Box className="h-4 w-28" />
                    <Box className="h-3 w-36" />
                  </div>
                </div>
              </td>
              {Array.from({ length: 5 }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <Box className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const ReviewsSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Box className="h-8 w-28" />
      <Box className="h-4 w-56" />
    </div>

    {/* Summary card */}
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-8">
        <div className="space-y-2">
          <Box className="h-14 w-20" />
          <Box className="h-4 w-24" />
        </div>
        <div className="flex-1 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Box className="h-3 w-6" />
              <Box className="h-2 flex-1 rounded-full" />
              <Box className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Review cards */}
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Box className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Box className="h-4 w-32" />
                <Box className="h-3 w-20" />
              </div>
            </div>
            <Box className="h-6 w-12 rounded-full" />
          </div>
          <Box className="h-4 w-full" />
          <Box className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  </div>
);

export const SupportSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Box className="h-8 w-28" />
      <Box className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <Box className="h-8 w-8 rounded-lg" />
          <Box className="h-5 w-32" />
          <Box className="h-4 w-full" />
          <Box className="h-4 w-3/4" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <Box className="h-6 w-40" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
          <Box className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Box className="h-4 w-48" />
            <Box className="h-3 w-64" />
          </div>
          <Box className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);
