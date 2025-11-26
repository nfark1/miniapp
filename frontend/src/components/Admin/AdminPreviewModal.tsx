// src/components/Admin/AdminPreviewModal.tsx
import React, { useState } from "react";
import type { Listing } from "../../types/types";

type PreviewModalProps = {
  item: Listing;
  onClose: () => void;
};

export const PreviewModal: React.FC<PreviewModalProps> = ({
  item,
  onClose,
}) => {
  const photos = (item.photos ?? []).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  const hasPhotos = photos.length > 0;
  const mainPhoto = hasPhotos ? photos[activeIndex] : undefined;

  const statusLabel: Record<string, string> = {
    moderation: "На модерации",
    active: "Активно",
    hidden: "Скрыто",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-3">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl p-3 max-w-md w-full max-h-[90vh] shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col">
        {/* верхушка: картинка + крестик */}
        <div className="relative mb-3">
          {mainPhoto && (
            <img
              src={mainPhoto}
              className="w-full rounded-xl object-cover max-h-[260px]"
              alt={item.title}
            />
          )}

          <button
            type="button"
            onClick={onClose}
            className="
              absolute top-2 right-2
              bg-black/60 w-8 h-8 rounded-full
              flex items-center justify-center
              text-white text-xl
              shadow-[0_0_16px_rgba(0,0,0,0.9)]
            "
          >
            ×
          </button>

          {/* маленькие превью всех фото */}
          {hasPhotos && photos.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {photos.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`
                    flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border
                    ${
                      idx === activeIndex
                        ? "border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                        : "border-slate-700/80 opacity-80"
                    }
                  `}
                >
                  <img
                    src={src}
                    className="w-full h-full object-cover"
                    alt={`photo-${idx + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* скроллящаяся часть с инфой */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* заголовок + цена */}
          <div>
            <div className="text-xl font-bold text-slate-100 mb-1">
              {item.title}
            </div>

            <div className="text-accent text-lg font-bold">
              {item.price.toLocaleString("ru-RU")} ₽
            </div>
          </div>

          {/* базовые поля в таблице */}
          <div
            className="
              rounded-2xl border border-slate-700/70 bg-slate-900/60
              px-3 py-2.5 text-[11px] text-slate-200 space-y-1.5
            "
          >
            <div className="flex justify-between">
              <span className="text-slate-400">ID</span>
              <span className="font-mono">#{item.id}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Статус</span>
              <span>
                {statusLabel[item.status as string] ?? item.status ?? "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Район</span>
              <span>{item.district || "—"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Год выпуска</span>
              <span>{item.year || "—"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Пробег</span>
              <span>
                {item.mileage
                  ? `${item.mileage.toLocaleString("ru-RU")} км`
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Фото</span>
              <span>{photos.length}</span>
            </div>
          </div>

          {/* инфа о продавце */}
          <div
            className="
              rounded-2xl border border-slate-700/70 bg-slate-900/60
              px-3 py-2.5 text-[11px] text-slate-200 space-y-1.5
            "
          >
            <div className="font-semibold text-[12px] text-slate-100">
              Продавец
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Имя</span>
              <span>
                {item.seller_name ||
                  (item.owner ? `@${item.owner}` : "Без имени")}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Username</span>
              <span>{item.owner ? `@${item.owner}` : "—"}</span>
            </div>
          </div>

          {/* описание */}
          <div
            className="
              rounded-2xl border border-slate-700/70 bg-slate-900/60
              px-3 py-2.5 text-[12px] text-slate-200
            "
          >
            <div className="font-semibold mb-1 text-slate-100">
              Описание объявления
            </div>
            <div className="text-[12px] text-slate-200 whitespace-pre-line">
              {item.desc || "Без описания"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};