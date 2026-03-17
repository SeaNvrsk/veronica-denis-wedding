"use client";

const PHOTOS = Array.from({ length: 15 }, (_, i) => `/photos/${i + 1}.jpg`).map(
  (src, i) => ({
    src,
    fallback: "/photos/placeholder.svg",
    alt: `Фото ${i + 1}`,
  })
);

export function PhotoStrip() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/88 to-white/96" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(196,181,253,0.22),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(165,180,252,0.18),transparent_55%)]" />
      <div className="absolute inset-0">
        <div className="photo-strip-track flex gap-4 animate-scroll">
          {[...PHOTOS, ...PHOTOS].map((photo, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 h-32 md:w-64 md:h-40 rounded-lg overflow-hidden shadow-lg border-2 border-white/50 bg-indigo-100"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = photo.fallback;
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
