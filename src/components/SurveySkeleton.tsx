export default function SurveySkeleton() {
  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-full w-full max-w-md flex-col bg-white">
        <div className="flex gap-1 px-5 pt-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-2 flex-1 rounded-full bg-black/10 animate-pulse" />
          ))}
        </div>
        <div className="flex flex-1 flex-col px-5 pt-6">
          <div className="h-6 w-3/4 rounded-lg bg-black/10 animate-pulse" />
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="h-10 w-24 rounded-full bg-black/10 animate-pulse" />
            <span className="h-10 w-32 rounded-full bg-black/10 animate-pulse" />
            <span className="h-10 w-28 rounded-full bg-black/10 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3 px-5 pt-4 pb-6">
          <span className="h-14 flex-1 rounded-2xl bg-black/10 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
