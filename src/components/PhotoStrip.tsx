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
      <div className="absolute inset-0 bg-gradient-to-b from-white/97 via-white/92 to-white/97" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(196,181,253,0.11),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(165,180,252,0.09),transparent_55%)]" />
      {/* Полоса фона на полтона ниже под лентой фотографий */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-[50%] -translate-y-1/2 h-48 md:h-60"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(129,140,248,0.28) 10%, rgba(129,140,248,0.4) 50%, rgba(129,140,248,0.28) 90%, transparent 100%)",
        }}
      />
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
