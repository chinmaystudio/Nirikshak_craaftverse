export function Skeleton({ className = "h-4 w-full" }: { className?: string }): JSX.Element {
  return <div className={`skeleton ${className}`} />;
}

function Bar({ w = "w-full", h = "h-4" }: { w?: string; h?: string }): JSX.Element {
  return <div className={`skeleton ${w} ${h}`} />;
}

export type SkeletonKind = "cards" | "list" | "table" | "detail" | "chat";

export function LoadingSkeleton({ kind }: { kind: SkeletonKind }): JSX.Element {
  if (kind === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg overflow-hidden">
            <div className="skeleton h-44 rounded-none" />
            <div className="p-5 space-y-3">
              <Bar w="w-1/3" />
              <Bar w="w-3/4" h="h-6" />
              <Bar />
              <Bar w="w-5/6" />
              <div className="skeleton h-2 rounded-full" />
              <div className="flex justify-between pt-2">
                <Bar w="w-24" />
                <Bar w="w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/40 flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Bar w="w-1/2" />
              <Bar w="w-3/4" />
            </div>
            <div className="skeleton w-20 h-6 rounded-full" />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "table") {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 overflow-hidden">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }, (_, i) => (
              <tr key={i}>
                <td className="p-3">
                  <Bar w="w-28" />
                </td>
                <td className="p-3">
                  <Bar w="w-40" />
                </td>
                <td className="p-3">
                  <Bar w="w-24" />
                </td>
                <td className="p-3">
                  <Bar w="w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (kind === "chat") {
    return (
      <div className="space-y-4 p-4">
        {[0, 1, 2].map((i) =>
          i % 2 === 0 ? (
            <div key={i} className="flex justify-start">
              <div className="skeleton w-2/3 h-12 rounded-xl" />
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="skeleton w-1/2 h-10 rounded-xl" />
            </div>
          )
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 space-y-4">
        <Bar w="w-40" />
        <Bar w="w-3/4" h="h-8" />
        <Bar />
        <Bar w="w-2/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/60 space-y-2">
            <Bar w="w-1/2" />
            <Bar w="w-3/4" h="h-7" />
          </div>
        ))}
      </div>
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 space-y-3">
        <Bar w="w-1/3" h="h-6" />
        <Bar />
        <Bar w="w-5/6" />
        <Bar w="w-2/3" />
      </div>
    </div>
  );
}
