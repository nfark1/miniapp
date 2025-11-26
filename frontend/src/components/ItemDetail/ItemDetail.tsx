// src/components/ItemDetail/ItemDetail.tsx
import React, { useEffect, useState } from "react";
import type { Listing } from "../../types/types";
import type { TelegramUser } from "../../types/telegram";

import { Gallery } from "./Gallery";
import { SellerCard } from "./SellerCard";

type ItemDetailProps = {
  item: Listing;
  isFav: boolean;
  onBack: () => void;
  onToggleFav: (id: number) => void;
  onOpenSellerProfile?: (username: string) => void;
  sellerListingsCount?: number;
};

export const ItemDetail: React.FC<ItemDetailProps> = ({
  item,
  isFav,
  onBack,
  onToggleFav,
  onOpenSellerProfile,
  sellerListingsCount,
}) => {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      setTgUser(window.Telegram.WebApp.initDataUnsafe.user);
    }
  }, []);

  const isMyListing = Boolean(
    tgUser?.username &&
      item.owner &&
      item.owner.toLowerCase() === tgUser.username!.toLowerCase(),
  );

  const photos = item.photos || [];
  const hasPrev = currentPhotoIndex > 0;
  const hasNext = currentPhotoIndex < photos.length - 1;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPrev) setCurrentPhotoIndex((i) => i - 1);
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) setCurrentPhotoIndex((i) => i + 1);
  };

  const renderStatusChip = () => {
    if (item.status === "moderation") {
      return (
        <span
          className="
            inline-flex items-center px-2.5 py-[4px]
            rounded-full bg-amber-500/15 border border-amber-400/70
            text-[11px] text-amber-300 font-semibold
          "
        >
          ⏳ На модерации
        </span>
      );
    }
    if (item.status === "hidden") {
      return (
        <span
          className="
            inline-flex items-center px-2.5 py-[4px]
            rounded-full bg-slate-700/40 border border-slate-500/80
            text-[11px] text-slate-200 font-semibold
          "
        >
          🙈 Скрытое
        </span>
      );
    }
    return (
      <span
        className="
          inline-flex items-center px-2.5 py-[4px]
          rounded-full bg-emerald-500/15 border border-emerald-400/70
          text-[11px] text-emerald-300 font-semibold
        "
      >
        ✅ Активно
      </span>
    );
  };

  const sellerUsername = item.owner || null;

  return (
    <div className="max-w-xl mx-auto px-2 pb-4 space-y-4">
      {/* верхняя панель: назад + избранное */}
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={onBack}
          className="
            px-3 py-1.5 rounded-xl text-xs font-medium
            bg-slate-900/80 border border-slate-600/70
            active:scale-95
          "
        >
          ← Назад
        </button>

        <button
          type="button"
          onClick={() => onToggleFav(item.id)}
          className="
            w-9 h-9 rounded-full
            flex items-center justify-center
            bg-slate-950/80 border border-slate-600/70
            shadow-[0_0_16px_rgba(0,0,0,0.9)]
            active:scale-95
          "
        >
          <svg
            viewBox="0 0 24 24"
            className="w-[18px] h-[18px]"
            style={{
              fill: isFav
                ? "rgba(34,211,238,0.16)"
                : "rgba(125,211,252,0.06)",
              stroke: isFav
                ? "rgba(34,211,238,0.95)"
                : "rgba(148,163,184,0.7)",
              strokeWidth: 1.6,
              filter: isFav
                ? "drop-shadow(0 0 8px rgba(34,211,238,0.7)) drop-shadow(0 0 16px rgba(34,211,238,0.4))"
                : "drop-shadow(0 0 6px rgba(148,163,184,0.45))",
            }}
          >
            <path d="M20.84 6.61a5.5 5.5 0 0 0-7.78 0L12 7.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 22l7.78-6.55 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* ГАЛЕРЕЯ */}
      <Gallery
        photos={photos}
        currentIndex={currentPhotoIndex}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={goPrev}
        onNext={goNext}
        onSelectThumbnail={setCurrentPhotoIndex}
        isTop={item.isTop}
      />

      {/* ОСНОВНАЯ ИНФА */}
      <section
        className="
          rounded-3xl
          border border-slate-800/80
          bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.18),transparent_60%),rgba(2,6,23,0.98)]
          shadow-[0_18px_45px_rgba(0,0,0,0.9)]
          px-4 py-3.5
          space-y-3
        "
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-[17px] font-bold text-slate-50 leading-snug">
              {item.title}
            </h1>

            <div className="mt-1.5 text-[18px] font-black text-accent tracking-wide">
              {item.price.toLocaleString("ru-RU")} ₽
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {renderStatusChip()}
            <div className="text-[10px] text-slate-500">
              ID: {item.id ?? "—"}
            </div>
            
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          {item.year && (
            <span
              className="
                inline-flex items-center px-2.5 py-[5px]
                rounded-full bg-slate-900/90 border border-slate-600/80
                text-[11px] text-slate-100
              "
            >
              🗓 {item.year} год
            </span>
          )}

          {item.mileage != null && (
            <span
              className="
                inline-flex items-center px-2.5 py-[5px]
                rounded-full bg-slate-900/90 border border-slate-600/80
                text-[11px] text-slate-100
              "
            >
              🚗 {item.mileage.toLocaleString("ru-RU")} км
            </span>
          )}

          {item.district && (
            <span
              className="
                inline-flex items-center px-2.5 py-[5px]
                rounded-full bg-slate-900/90 border border-slate-600/80
                text-[11px] text-slate-100
              "
            >
              📍 {item.district}
            </span>
          )}
        </div>
      </section>

      {/* ОПИСАНИЕ */}
      <section
        className="
          rounded-3xl
          border border-slate-800/80
          bg-slate-950/90
          px-4 py-3.5
          shadow-[0_14px_35px_rgba(0,0,0,0.85)]
          space-y-2
        "
      >
        <h2 className="text-sm font-semibold text-slate-100">Описание</h2>
        <p className="text-[13px] leading-relaxed text-slate-300 whitespace-pre-line">
          {item.desc && item.desc.trim()
            ? item.desc
            : "Продавец ещё не добавил подробное описание автомобиля."}
        </p>
      </section>

      {/* ПРОДАВЕЦ */}
      <SellerCard
        item={item}
        isMyListing={isMyListing}
        sellerUsername={sellerUsername}
        sellerListingsCount={sellerListingsCount}
        onOpenSellerProfile={
          sellerUsername && onOpenSellerProfile
            ? () => onOpenSellerProfile(sellerUsername)
            : undefined
        }
      />
    </div>
  );
};

export default ItemDetail;