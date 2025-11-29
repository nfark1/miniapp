// src/components/admin/Admin.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { Listing } from "../../types/types";
import { StatCard } from "./AdminStatCard";
import { AdminFilters } from "./AdminFilters";
import { AdminListingCard } from "./AdminListingCard";
import { PreviewModal } from "./AdminPreviewModal";
import type { FilterValue, SortValue } from "./Admin.types";

type AdminProps = {
  onBack: () => void;
  items: Listing[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onRefresh: () => void;
  onHide: (id: number) => void;        // отдельный колбэк для скрытия
  onDelete?: (id: number) => void;
  onEditListing?: (item: Listing) => void;
  onSetBadge?: (id: number, badge: "top" | "premium" | null) => void;
  onUpdateCounters?: (
    id: number,
    counters: {
      views_count?: number;
      shares_count?: number;
      likes_count?: number;
    }
  ) => void;
};

export const Admin: React.FC<AdminProps> = ({
  onBack,
  items,
  onApprove,
  onReject,
  onRefresh,
  onHide,
  onDelete,
  onEditListing,
  onSetBadge,
  onUpdateCounters,
}) => {
  const [filter, setFilter] = useState<FilterValue>("moderation");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("new");
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [previewItem, setPreviewItem] = useState<Listing | null>(null);
  const [searchId, setSearchId] = useState<string>("");

  // 🔄 автообновление каждые 15 секунд (если включено)
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      onRefresh();
    }, 15000);

    return () => clearInterval(timer);
  }, [autoRefresh, onRefresh]);

  // 📊 статистика
  const stats = useMemo(() => {
    const total = items.length;
    const moderation = items.filter((it) => it.status === "moderation").length;
    const active = items.filter((it) => it.status === "active").length;
    const hidden = items.filter((it) => it.status === "hidden").length;

    return { total, moderation, active, hidden };
  }, [items]);

  // 🔎 фильтрация + сортировка
  const filtered = useMemo(() => {
    let res = [...items];

    // фильтр по статусу
    if (filter !== "all") {
      res = res.filter((it) => it.status === filter);
    }

    // только с фотографиями
    if (onlyWithPhotos) {
      res = res.filter((it) => it.photos && it.photos.length > 0);
    }

    // текстовый поиск
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      res = res.filter((it) => {
        const haystack = [
          it.title,
          it.district,
          it.owner ? `@${it.owner}` : "",
          it.seller_name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    // 🔍 поиск по ID
    const idStr = searchId.trim();
    if (idStr) {
      const idNum = Number(idStr);
      if (!Number.isNaN(idNum)) {
        res = res.filter((it) => it.id === idNum);
      } else {
        // если ввели не число — просто ничего не показываем
        res = [];
      }
    }

    // сортировка
    res.sort((a, b) => {
      if (sort === "new") {
        return (b.id ?? 0) - (a.id ?? 0);
      }
      if (sort === "old") {
        return (a.id ?? 0) - (b.id ?? 0);
      }
      if (sort === "price_desc") {
        return b.price - a.price;
      }
      if (sort === "price_asc") {
        return a.price - b.price;
      }
      return 0;
    });

    return res;
  }, [items, filter, onlyWithPhotos, search, sort, searchId]);


    const handleEditCounters = (item: Listing) => {
    if (!onUpdateCounters) return;

    const currentViews = item.views_count ?? 0;
    const currentShares = item.shares_count ?? 0;
    const currentLikes = item.likes_count ?? 0;

    const viewsStr = window.prompt(
      `Просмотры (сейчас: ${currentViews})`,
      String(currentViews),
    );
    if (viewsStr === null) return;

    const sharesStr = window.prompt(
      `Репосты (сейчас: ${currentShares})`,
      String(currentShares),
    );
    if (sharesStr === null) return;

    const likesStr = window.prompt(
      `Лайки (сейчас: ${currentLikes})`,
      String(currentLikes),
    );
    if (likesStr === null) return;

    const views = Number(viewsStr);
    const shares = Number(sharesStr);
    const likes = Number(likesStr);

    const payload: {
      views_count?: number;
      shares_count?: number;
      likes_count?: number;
    } = {};

    if (!Number.isNaN(views)) payload.views_count = views;
    if (!Number.isNaN(shares)) payload.shares_count = shares;
    if (!Number.isNaN(likes)) payload.likes_count = likes;

    onUpdateCounters(item.id, payload);
  };

  return (
    <div className="max-w-xl mx-auto px-1 py-1 space-y-2 relative">
      {/* 🔙 верхняя панель */}
      <div className="flex items-center justify-between">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="
              px-3 py-1.5 rounded-xl text-xs font-semibold
              bg-slate-900/80 border border-cyan-400/60
              text-cyan-300
              shadow-[0_0_12px_rgba(34,211,238,0.4)]
              active:scale-95
            "
          >
            Обновить
          </button>

          {/* переключатель автообновления */}
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`
              px-2.5 py-1.5 rounded-xl text-[11px]
              border
              flex items-center gap-1
              ${
                autoRefresh
                  ? "bg-emerald-500/20 border-emerald-400/70 text-emerald-200"
                  : "bg-slate-900/80 border-slate-600/70 text-slate-300"
              }
            `}
          >
            <span
              className={`
                inline-block w-[9px] h-[9px] rounded-full
                ${
                  autoRefresh
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                    : "bg-slate-500"
                }
              `}
            />
            авто
          </button>
        </div>
      </div>

      <h1 className="text-xl font-bold text-slate-50">Админ-панель</h1>

      {/* 📊 карточки-статистика (кликабельные) */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Всего"
          value={stats.total}
          accent="from-slate-100/10 via-slate-700/40 to-slate-900"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <StatCard
          label="На модерации"
          value={stats.moderation}
          badge="⏳"
          accent="from-amber-300/20 via-amber-500/10 to-slate-900"
          active={filter === "moderation"}
          onClick={() => setFilter("moderation")}
        />
        <StatCard
          label="Активные"
          value={stats.active}
          badge="✅"
          accent="from-emerald-300/25 via-emerald-500/15 to-slate-900"
          active={filter === "active"}
          onClick={() => setFilter("active")}
        />
        <StatCard
          label="Скрытые"
          value={stats.hidden}
          badge="🚫"
          accent="from-rose-400/25 via-rose-500/10 to-slate-900"
          active={filter === "hidden"}
          onClick={() => setFilter("hidden")}
        />
      </div>

      {/* 🔎 Фильтры (поиск по тексту, сортировка, только с фото) */}
      <AdminFilters
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        onlyWithPhotos={onlyWithPhotos}
        onOnlyWithPhotosChange={setOnlyWithPhotos}
        filteredCount={filtered.length}
        totalCount={items.length}
      />

      {/* 🔍 Отдельный поиск по ID */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          Поиск по ID объявления
        </span>
        <input
          type="number"
          placeholder="например, 123"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="
            w-[110px]
            px-2.5 py-1.5 rounded-xl
            bg-slate-950/85 border border-slate-700/80
            text-[12px] text-slate-100
            placeholder:text-slate-500
            outline-none
            focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/60
          "
        />
      </div>

      {/* 📦 Список объявлений */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-slate-400 text-sm mt-6 text-center">
            Нет объявлений под выбранные фильтры
          </div>
        )}

        {filtered.map((it) => (
          <AdminListingCard
            key={it.id}
            item={it}
            onApprove={onApprove}
            onReject={onReject}
            onHide={onHide}
            onDelete={onDelete}
            onEditListing={onEditListing}
            onPreview={() => setPreviewItem(it)}
            onSetBadge={onSetBadge}
            onEditCounters={handleEditCounters}
          />
        ))}
      </div>

      {/* 🔍 Модальное окно предпросмотра */}
      {previewItem && (
        <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
};