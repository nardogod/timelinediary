'use client';

export default function TimelineSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center px-4 sm:px-8 py-8">
      <div className="w-full max-w-7xl">
        {/* Linha skeleton */}
        <div className="relative h-1 bg-slate-700/50 rounded-full mb-8">
          {/* Pontos skeleton */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 animate-pulse"
              style={{ left: `${20 + i * 20}%` }}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-700/50"></div>
            </div>
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-slate-800/50 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
