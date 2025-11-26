// src/components/admin/AdminListingCard.tsx
import React from "react";
import type { Listing } from "../../types/types";

type AdminListingCardProps = {
  item: Listing;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onHide: (id: number) => void;
  onDelete?: (id: number) => void;
  onEditListing?: (item: Listing) => void;
  onPreview: () => void;
  onSetBadge?: (id: number, badge: "top" | "premium" | null) => void; // 👈
};

export const AdminListingCard: React.FC<AdminListingCardProps> = ({
  item,
  onApprove,
  onReject,
  onHide,
  onDelete,
  onEditListing,
  onPreview,
  onSetBadge,
}) => {
  const handleDelete = () => {
    if (window.confirm("Удалить это объявление?")) {
      onDelete?.(item.id);
    }
  };

  return (
    <div
      className="
        rounded-2xl bg-slate-950/90 border border-slate-700/80
        shadow-[0_10px_26px_rgba(0,0,0,0.7)]
        overflow-hidden
      "
    >
      {/* Верхняя часть с фото */}
      <div
        className="h-[150px] bg-cover bg-center relative cursor-pointer"
        style={{
          backgroundImage: item.photos[0]
            ? `url(${item.photos[0]})`
            : "linear-gradient(135deg,#020617,#0f172a)",
        }}
        onClick={onPreview}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* бейдж ID */}
        <div
          className="
            absolute top-2 left-2
            px-2 py-0.5 text-[10px]
            rounded-full bg-black/60 text-slate-200
            border border-slate-600/80
          "
        >
          ID: {item.id}
        </div>

        {/* статус + маленький бейдж */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <div>
            {item.status === "moderation" && (
              <span className="inline-flex items-center px-2 py-[3px] rounded-full text-[10px] bg-amber-500/15 border border-amber-400/60 text-amber-200">
                ⏳ Модерация
              </span>
            )}
            {item.status === "active" && (
              <span className="inline-flex items-center px-2 py-[3px] rounded-full text-[10px] bg-emerald-500/15 border border-emerald-400/60 text-emerald-200">
                ✅ Активно
              </span>
            )}
            {item.status === "hidden" && (
              <span className="inline-flex items-center px-2 py-[3px] rounded-full text-[10px] bg-red-500/15 border border-red-400/60 text-red-200">
                🚫 Скрыто
              </span>
            )}
          </div>

          {/* мини-индикатор ТОП/ПРЕМИУМ */}
          {item.badge === "top" && (
            <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] bg-amber-400 text-slate-900 font-semibold shadow-[0_0_10px_rgba(251,191,36,0.7)]">
              🔥 ТОП
            </span>
          )}
          {item.badge === "premium" && (
            <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] bg-violet-400 text-slate-900 font-semibold shadow-[0_0_10px_rgba(167,139,250,0.7)]">
              ⭐ ПРЕМИУМ
            </span>
          )}
        </div>

        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
          <div className="text-[15px] font-semibold text-slate-50 line-clamp-2 drop-shadow">
            {item.title}
          </div>
          <div className="text-[13px] font-bold text-accent drop-shadow">
            {item.price.toLocaleString("ru-RU")} ₽
          </div>
        </div>
      </div>

      {/* Инфо блок */}
      <div className="p-3 space-y-2">
        <div className="text-[12px] text-slate-400">
          {item.year && `${item.year} • `}
          {item.mileage && `${item.mileage.toLocaleString("ru-RU")} км • `}
          {item.district}
        </div>

        {/* продавец */}
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <div className="font-semibold">
              {item.seller_name ||
                (item.owner ? `@${item.owner}` : "Без имени")}
            </div>
            {item.owner && (
              <span className="px-2 py-[2px] rounded-full bg-slate-900/80 border border-slate-700/80 text-[10px] text-slate-400">
                @{item.owner}
              </span>
            )}
          </div>

          <div className="text-[10px] text-slate-500">
            Фото: {item.photos.length}
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="px-2 py-2 mt-1 border-t border-slate-800/80 flex flex-wrap gap-2">
        {/* если на модерации */}
        {item.status === "moderation" && (
          <>
            <button
              type="button"
              onClick={() => onApprove(item.id)}
              className="
                flex-1 px-3 py-1.5 rounded-xl
                text-[11px] font-semibold
                bg-slate-900/90
                border border-cyan-400/70
                text-cyan-200
                shadow-[0_0_18px_rgba(34,211,238,0.35)]
                hover:bg-slate-900
                active:scale-95
                transition
              "
            >
              Одобрить
            </button>

            <button
              type="button"
              onClick={() => onReject(item.id)}
              className="
                flex-1 px-3 py-1.5 rounded-xl
                text-[11px] font-semibold
                bg-slate-900/90
                border border-slate-600/80
                text-slate-200
                hover:bg-slate-800
                active:scale-95
                transition
              "
            >
              Отклонить
            </button>
          </>
        )}

        {/* если активно — можно скрыть */}
        {item.status === "active" && (
          <button
            type="button"
            onClick={() => onHide(item.id)}
            className="
              flex-1 px-3 py-1.5 rounded-xl
              text-[11px] font-semibold
              bg-slate-900/90
              border border-slate-600/80
              text-slate-200
              hover:bg-slate-800
              active:scale-95
              transition
            "
          >
            Скрыть
          </button>
        )}

        {/* если скрыто — можно снова активировать */}
        {item.status === "hidden" && (
          <button
            type="button"
            onClick={() => onApprove(item.id)}
            className="
              flex-1 px-3 py-1.5 rounded-xl
              text-[11px] font-semibold
              bg-slate-900/90
              border border-cyan-400/70
              text-cyan-200
              shadow-[0_0_18px_rgba(34,211,238,0.35)]
              hover:bg-slate-900
              active:scale-95
              transition
            "
          >
            Активировать
          </button>
        )}

        {/* Редактировать — всегда доступно */}
        <button
          type="button"
          onClick={() => onEditListing?.(item)}
          className="
            flex-1 px-3 py-1.5 rounded-xl
            text-[11px] font-semibold
            bg-slate-900/90
            border border-cyan-500/60
            text-cyan-100
            hover:bg-slate-900
            active:scale-95
            transition
          "
        >
          Редактировать
        </button>

        {/* Удалить — всегда доступно */}
        <button
          type="button"
          onClick={handleDelete}
          className="
            flex-1 px-3 py-1.5 rounded-xl
            text-[11px] font-semibold
            bg-slate-950
            border border-red-500/70
            text-red-200
            hover:bg-slate-900
            active:scale-95
            transition
          "
        >
          Удалить
        </button>

        {/* Кнопки ТОП / ПРЕМИУМ */}
        {onSetBadge && (
          <div className="w-full flex gap-2 pt-1">
            <button
              type="button"
              onClick={() =>
                onSetBadge(
                  item.id,
                  item.badge === "top" ? null : "top",
                )
              }
              className="
                flex-1 px-3 py-1.5 rounded-xl
                text-[10px] font-semibold
                bg-slate-900/90
                border border-amber-400/70
                text-amber-200
                hover:bg-slate-900
                active:scale-95
                transition
              "
            >
              {item.badge === "top" ? "Убрать ТОП" : "Сделать ТОП"}
            </button>

            <button
              type="button"
              onClick={() =>
                onSetBadge(
                  item.id,
                  item.badge === "premium" ? null : "premium",
                )
              }
              className="
                flex-1 px-3 py-1.5 rounded-xl
                text-[10px] font-semibold
                bg-slate-900/90
                border border-violet-400/70
                text-violet-200
                hover:bg-slate-900
                active:scale-95
                transition
              "
            >
              {item.badge === "premium"
                ? "Убрать ПРЕМИУМ"
                : "Сделать ПРЕМИУМ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};