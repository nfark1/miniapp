// src/components/Profile/ProfileListings.tsx
import React from "react";
import type { Listing } from "../../types/types";

const pluralizeDays = (n: number): string => {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
};

type ProfileListingsProps = {
  listings: Listing[];
  emptyText: string;
  onHideListing?: (id: number) => void;
  onDeleteListing?: (id: number) => void;
  onSendToModeration?: (id: number) => void;
  onEditListing?: (item: Listing) => void;
};

export const ProfileListings: React.FC<ProfileListingsProps> = ({
  listings,
  emptyText,
  onHideListing,
  onDeleteListing,
  onSendToModeration,
  onEditListing,
}) => {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-100">
        Мои объявления
      </h2>

      {listings.length === 0 ? (
        <div
          className="
            rounded-2xl border border-dashed border-slate-600/70
            bg-slate-950/70 px-3.5 py-3
            text-[13px] text-slate-400
          "
        >
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2.5">
          {listings.map((it) => {
            // 📅 дата для отсчета — published_at или created_at
            const publishedAtStr =
              (it as any).published_at ??
              (it as any).created_at ??
              null;

            let daysLeft: number | null = null;

            if (it.status === "active" && publishedAtStr) {
              const MS_IN_DAY = 24 * 60 * 60 * 1000;
              const publishedTime = new Date(publishedAtStr).getTime();
              const expiresTime = publishedTime + 30 * MS_IN_DAY;
              const diffMs = expiresTime - Date.now();
              daysLeft = diffMs <= 0 ? 0 : Math.max(1, Math.ceil(diffMs / MS_IN_DAY));
            }

            return (
              <div
                key={it.id}
                className="
                  rounded-2xl
                  bg-slate-950/90
                  border border-slate-700/80
                  px-2 py-2
                  shadow-[0_10px_26px_rgba(0,0,0,0.8)]
                  flex flex-col gap-2.5
                "
              >
                <div className="flex gap-3">
                  <div
                    className="
                      w-25 h-16 rounded-xl
                      bg-slate-900/80 bg-center bg-cover
                      border border-slate-700/80
                      flex-shrink-0
                    "
                    style={{
                      backgroundImage: it.photos[0]
                        ? `url(${it.photos[0]})`
                        : "none",
                    }}
                  />

                  {/* 🔹 Правая часть карточки */}
                  <div className="flex-1 flex flex-col gap-1">

                    {/* 🔹 Верхняя служебная строка: статус → осталось → ID */}
                    <div className="flex items-center justify-between mb-0.5">
                      <div />

                      <div className="flex items-center gap-2">

                        {/* 🟢 Статус */}
                        {it.status === "active" && (
                          <span
                            className="
                              inline-flex items-center px-2 py-[1px]
                              rounded-full bg-emerald-500/15
                              border border-emerald-400/70
                              text-[10px] text-emerald-300 font-semibold
                              whitespace-nowrap
                            "
                          >
                            Активно
                          </span>
                        )}

                        {it.status === "moderation" && (
                          <span
                            className="
                              inline-flex items-center px-2 py-[1px]
                              rounded-full bg-amber-500/15
                              border border-amber-400/70
                              text-[10px] text-amber-300 font-semibold
                              whitespace-nowrap
                            "
                          >
                            На модерации
                          </span>
                        )}

                        {it.status === "hidden" && (
                          <span
                            className="
                              inline-flex items-center px-2 py-[1px]
                              rounded-full bg-slate-700/40
                              border border-slate-500/80
                              text-[10px] text-slate-200 font-semibold
                              whitespace-nowrap
                            "
                          >
                            Скрытое
                          </span>
                        )}

                        {/* ⏱ Осталось N дней — только активно */}
                        {it.status === "active" && daysLeft !== null && (
                          <span
                            className="
                              inline-flex items-center gap-1
                              px-2 py-[1px]
                              rounded-full
                              bg-slate-900/70
                              border border-cyan-400/40
                              text-[10px] text-cyan-300
                              shadow-[0_0_10px_rgba(34,211,238,0.35)]
                              backdrop-blur-[3px]
                              whitespace-nowrap
                            "
                          >
                            Осталось: {daysLeft} {pluralizeDays(daysLeft)}
                          </span>
                        )}

                        {/* 🆔 ID */}
                        <span
                          className="
                            inline-flex items-center px-2 py-[1px]
                            rounded-full bg-slate-900/80
                            border border-slate-600/70
                            text-[10px] text-slate-400
                            backdrop-blur-[3px]
                            whitespace-nowrap
                          "
                        >
                          ID:{" "}
                          <span className="text-slate-200 font-semibold">
                            {it.id}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* 🔹 Основной текст */}
                    <div className="text-[14px] font-semibold text-slate-50 line-clamp-2">
                      {it.title}
                    </div>
                    <div className="text-[14px] font-bold text-accent">
                      {it.price.toLocaleString("ru-RU")} ₽
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {it.year && `${it.year} • `}
                      {it.mileage &&
                        `${it.mileage.toLocaleString("ru-RU")} км • `}
                      {it.district}
                    </div>
                  </div>
                </div>

                {/* 🔹 Кнопки управления */}
                <div
                  className="
                    pt-1 mt-1
                    border-t border-slate-800/80
                    flex flex-wrap gap-2
                  "
                >
                  <button
                    type="button"
                    className="
                      px-2 py-0.5 rounded-xl text-[10px] font-semibold
                      bg-slate-900/90 border border-cyan-400/60
                      text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.35)]
                      active:scale-95 transition
                    "
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditListing?.(it);
                    }}
                  >
                    Редактировать
                  </button>

                  {it.status === "active" && (
                    <button
                      type="button"
                      className="
                        px-2 py-0.5 rounded-xl text-[10px] font-semibold
                        bg-slate-900/80 border border-slate-600/80
                        text-slate-200 active:scale-95 transition
                      "
                      onClick={() => onHideListing?.(it.id)}
                    >
                      Снять с продажи
                    </button>
                  )}

                  {it.status === "hidden" && (
                  <button
                    type="button"
                    className="
                      px-2 py-0.5 rounded-xl
                      text-[10px] font-semibold
                      bg-amber-500/15
                      border border-amber-400/70
                      text-amber-300
                      shadow-[0_0_14px_rgba(251,191,36,0.35)]
                      active:scale-95
                      transition
                    "
                    onClick={() => onSendToModeration?.(it.id)}
                  >
                  Отправить на модерацию
                  </button>
                )}

                  <button
                    type="button"
                    className="
                      px-2 py-0.5 rounded-xl text-[10px] font-semibold
                      bg-[rgba(127,29,29,0.95)]
                      border border-red-400/70 text-red-50
                      shadow-[0_0_18px_rgba(239,68,68,0.5)]
                      active:scale-95 transition
                    "
                    onClick={() => onDeleteListing?.(it.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};