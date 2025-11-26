// src/components/FeedList.tsx
import React from "react";
import type { Listing } from "../types/types";

// универсальное склонение (как в Авито)
const pluralize = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return forms[0]; // 1 минута / час / день
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return forms[1]; // 2 минуты / часа / дня
  }
  return forms[2]; // 5 минут / часов / дней
};

// красивый формат времени публикации "как в Авито"
const formatRelativeDate = (iso?: string) => {
  if (!iso) return "–";

  // если строка без Z/+смещения — считаем, что это UTC
  const normalizedIso =
    iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z";

  const date = new Date(normalizedIso);
  if (Number.isNaN(date.getTime())) return "–";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // будущее или кривое время — просто дата
  if (diffMs < 0) {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  // 🔹 только что
  if (diffSec < 60) return "только что";

  // 🔹 минуты назад
  if (diffMin < 60) {
    return `${diffMin} ${pluralize(diffMin, [
      "минута",
      "минуты",
      "минут",
    ])} назад`;
  }

  // 🔹 часы назад (до суток)
  if (diffHours < 24) {
    if (diffHours === 1) return "час назад";
    return `${diffHours} ${pluralize(diffHours, [
      "час",
      "часа",
      "часов",
    ])} назад`;
  }

  // считаем дни по полуночам (чтобы корректно "вчера" / "3 дня назад")
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDays === 1) return "вчера";

  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} ${pluralize(diffDays, [
      "день",
      "дня",
      "дней",
    ])} назад`;
  }

  // старше недели — как на Авито: "7 ноября" / "7 ноября 2024"
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
  };

  if (date.getFullYear() !== now.getFullYear()) {
    options.year = "numeric";
  }

  return date.toLocaleDateString("ru-RU", options);
};

type FeedProps = {
  items: Listing[];
  favIds: Set<number>;
  onToggleFav: (id: number) => void;
  onOpenItem: (it: Listing) => void;
  isFavoritesView?: boolean;
  isLoading?: boolean;
};

export const FeedList: React.FC<FeedProps> = ({
  items,
  favIds,
  onToggleFav,
  onOpenItem,
  isFavoritesView,
  isLoading,
}) => {
  // 🔹 Скелетоны при загрузке
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="
              animate-pulse
              flex gap-3 w-full text-left
              rounded-2xl bg-slate-950/80
              border border-slate-800/90
              shadow-[0_10px_28px_rgba(15,23,42,0.85)]
              overflow-hidden
            "
          >
            <div className="relative w-[130px] h-[110px] flex-shrink-0 bg-slate-900/80" />
            <div className="flex-1 flex flex-col py-2 pr-3 space-y-2">
              <div className="h-4 rounded bg-slate-800/80 w-3/4" />
              <div className="h-4 rounded bg-slate-800/70 w-1/2" />
              <div className="h-3 rounded bg-slate-800/70 w-2/3" />
              <div className="h-6 rounded-full bg-slate-800/70 w-1/2 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 🔹 Нет объявлений
  if (!items.length) {
    return (
      <div className="mt-10 text-center text-sm text-slate-400">
        {isFavoritesView ? "В избранном пока пусто" : "Пока нет объявлений"}
      </div>
    );
  }

  // 🔹 Список объявлений
return (
  <div className="flex flex-col gap-3">
    {items.map((it) => {
      const isFav = favIds.has(it.id);
      const mainPhoto = it.photos[0];

      // время публикации: сначала published_at (после модерации),
      // если его нет — используем created_at
      const publishedAt =
        (it.published_at as string | undefined) ??
        (it.created_at as string | undefined);

      return (
        <div
          key={it.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpenItem(it)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onOpenItem(it);
          }}
          className="
            relative
            flex gap-3 w-full text-left
            rounded-2xl bg-slate-950/80
            border border-slate-800/90
            shadow-[0_10px_28px_rgba(15,23,42,0.85)]
            overflow-hidden
            active:translate-y-[1px]
            transition
          "
        >
          {/* ❤️ избранное */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFav(it.id);
            }}
            className="
              absolute top-2 right-2
              w-5 h-5 rounded-full
              flex items-center justify-center
              bg-slate-950/85 border border-slate-600/70
              shadow-[0_0_16px_rgba(0,0,0,0.9)]
              active:scale-95 transition
            "
          >
            <svg
              viewBox="0 0 24 24"
              className="w-[12px] h-[12px]"
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

          {/* 📷 Фото слева */}
          <div
            className="
              relative
              w-[150px] h-[125px] flex-shrink-0
              border-r border-slate-800/80
              bg-slate-900/80
            "
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: mainPhoto ? `url(${mainPhoto})` : "none",
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Старый флаг isTop, если вдруг нужен */}
            {it.isTop && (
              <div
                className="
                  absolute top-1.5 left-1.5
                  px-2 py-0.5 text-[11px] font-extrabold
                  rounded-md bg-accent text-slate-900
                  shadow-[0_4px_12px_rgba(0,0,0,0.7)]
                "
              >
                ТОП
              </div>
            )}

            {/* счётчик фото */}
            {it.photos.length > 1 && (
              <div
                className="
                  absolute right-1.5 bottom-1.5
                  px-2 py-[2px] text-[10px]
                  rounded-full bg-black/55 text-slate-100
                  backdrop-blur
                "
              >
                📷 {it.photos.length}
              </div>
            )}
          </div>

          {/* 📄 Текстовая часть */}
          <div className="flex-1 flex flex-col py-2 pr-3">
            <div className="font-extrabold text-[15px] text-slate-50 leading-snug line-clamp-2 pr-8">
              {it.title}
            </div>

            <div className="mt-1 text-[17px] font-black text-accent tracking-wide">
              {it.price.toLocaleString("ru-RU")} ₽
            </div>

            <div className="mt-1 text-xs text-slate-400">
              {it.year && `${it.year} • `}
              {it.mileage &&
                `${it.mileage.toLocaleString("ru-RU")} км • `}
              {it.district}
            </div>

            {/* Низ строки — слева плашка, справа дата */}
            <div className="mt-4 flex items-center justify-between">
              {/* Плашка ТОП / ПРЕМИУМ в неоновом стеклянном стиле */}
              <div className="min-h-[18px] flex items-center">
                {it.badge === "top" && (
                  <span
                    className={`
                      badge-anim-top
                      inline-flex items-center gap-1
                      px-2.5 py-[1px]
                      rounded-full
                      bg-slate-950/85
                      border border-cyan-400/80
                      text-[10px] text-cyan-200 font-semibold
                      backdrop-blur-[4px]
                    `}
                  >
                    <span
                      className="
                        w-[6px] h-[6px] rounded-full
                        bg-cyan-400
                        shadow-[0_0_10px_rgba(34,211,238,0.9)]
                      "
                    />
                    ТОП
                  </span>
                )}

                {it.badge === "premium" && (
                  <span
                    className={`
                      badge-anim-premium
                      inline-flex items-center gap-1
                      px-2.5 py-[1px]
                      rounded-full
                      bg-slate-950/85
                      border border-fuchsia-400/80
                      text-[10px] text-fuchsia-200 font-semibold
                      backdrop-blur-[4px]
                    `}
                  >
                    <span
                      className="
                        w-[6px] h-[6px] rounded-full
                        bg-fuchsia-400
                        shadow-[0_0_10px_rgba(217,70,239,0.9)]
                      "
                    />
                    ПРЕМИУМ
                  </span>
                )}
              </div>

              {/* 📅 Дата справа — как была */}
              <div
                className="
                  inline-flex items-center gap-1
                  px-2.5 py-[1px]
                  rounded-full
                  bg-slate-950/85
                  border border-slate-600/70
                  text-[10px] text-slate-300
                  shadow-[0_0_16px_rgba(15,23,42,0.9)]
                  backdrop-blur-[4px]
                "
              >
                <span
                  className="
                    w-[6px] h-[6px] rounded-full
                    bg-cyan-400
                    shadow-[0_0_10px_rgba(34,211,238,0.8)]
                  "
                />
                {formatRelativeDate(publishedAt)}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
  );
} 