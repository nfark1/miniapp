// src/components/ItemDetail/Gallery.tsx
import React from "react";

export type GalleryProps = {
  photos: string[];
  currentIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onSelectThumbnail: (index: number) => void;
  isTop?: boolean;
};

export const Gallery: React.FC<GalleryProps> = ({
  photos,
  currentIndex,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onSelectThumbnail,
  isTop,
}) => {
  const mainPhoto = photos[currentIndex] || photos[0] || "";

  return (
    <section
      className="
        rounded-3xl overflow-hidden
        border border-slate-800/80
        bg-slate-900/90
        shadow-[0_20px_60px_rgba(0,0,0,0.9)]
      "
    >
      <div className="relative w-full aspect-[4/3] bg-slate-950">
        {mainPhoto ? (
          <>
            <img
              src={mainPhoto}
              alt="photo"
              className="w-full h-full object-cover"
            />

            {/* ТОП бейдж */}
            {isTop && (
              <div
                className="
                  absolute top-2 left-2
                  px-2.5 py-1 text-[11px] font-extrabold
                  rounded-lg bg-accent text-slate-900
                  shadow-[0_8px_20px_rgба(0,0,0,0.9)]
                "
              >
                ТОП-объявление
              </div>
            )}

            {/* стрелки */}
            {photos.length > 1 && (
              <>
                {hasPrev && (
                  <button
                    type="button"
                    onClick={onPrev}
                    className="
                      absolute left-2 top-1/2 -translate-y-1/2
                      w-9 h-9 rounded-full
                      bg-black/55 text-slate-100
                      flex items-center justify-center
                      border border-slate-500/70
                      active:scale-95
                    "
                  >
                    ◀
                  </button>
                )}
                {hasNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className="
                      absolute right-2 top-1/2 -translate-y-1/2
                      w-9 h-9 rounded-full
                      bg-black/55 text-slate-100
                      flex items-center justify-center
                      border border-slate-500/70
                      active:scale-95
                    "
                  >
                    ▶
                  </button>
                )}
              </>
            )}

            {/* счётчик */}
            {photos.length > 0 && (
              <div
                className="
                  absolute right-2 bottom-2
                  px-2.5 py-[3px] text-[11px]
                  rounded-full bg-black/60 text-slate-100
                  backdrop-blur
                "
              >
                {currentIndex + 1} / {photos.length}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            Без фото
          </div>
        )}
      </div>

      {/* превьюшки */}
      {photos.length > 1 && (
        <div className="flex gap-2 p-2.5 overflow-x-auto">
          {photos.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectThumbnail(i)}
              className={`
                relative flex-shrink-0
                w-16 h-16 rounded-xl overflow-hidden
                border
                ${
                  i === currentIndex
                    ? "border-cyan-400 shadow-[0_0_0_1px_rgba(8,145,178,0.9)]"
                    : "border-slate-700"
                }
              `}
            >
              <img
                src={url}
                alt={`photo-${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};