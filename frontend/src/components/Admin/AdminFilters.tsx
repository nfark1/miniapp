// src/components/admin/AdminFilters.tsx
import React from "react";
import type { SortValue } from "./Admin.types";

type AdminFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
  onlyWithPhotos: boolean;
  onOnlyWithPhotosChange: (value: boolean) => void;
  filteredCount: number;
  totalCount: number;
};

export const AdminFilters: React.FC<AdminFiltersProps> = ({
  search,
  onSearchChange,
  sort,
  onSortChange,
  onlyWithPhotos,
  onOnlyWithPhotosChange,
  filteredCount,
  totalCount,
}) => {
  return (
    <section
      className="
        rounded-2xl border border-slate-700/70
        bg-slate-950/70 p-3 space-y-3
        shadow-[0_10px_30px_rgba(0,0,0,0.8)]
      "
    >
      {/* строка поиска + сортировка */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по заголовку, району, @username…"
            className="
              w-full rounded-xl bg-slate-950/70
              border border-slate-600/70
              px-3 py-2 text-[12px] text-slate-100
              outline-none
              focus:border-cyan-400 focus:shadow-[0_0_0_1px_rgba(8,145,178,0.9)]
            "
          />
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortValue)}
          className="
            w-[130px] rounded-xl bg-slate-950/70
            border border-slate-600/70
            px-2 py-2 text-[12px] text-slate-100
            outline-none
            focus:border-cyan-400 focus:shadow-[0_0_0_1px_rgba(8,145,178,0.9)]
          "
        >
          <option value="new">Сначала новые</option>
          <option value="old">Сначала старые</option>
          <option value="price_desc">Цена ↓</option>
          <option value="price_asc">Цена ↑</option>
        </select>
      </div>

      {/* чекбоксы */}
      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyWithPhotos}
            onChange={(e) => onOnlyWithPhotosChange(e.target.checked)}
            className="accent-cyan-400"
          />
          <span>Только с фото</span>
        </label>

        <span className="text-slate-500">
          Показано: {filteredCount} из {totalCount}
        </span>
      </div>
    </section>
  );
};