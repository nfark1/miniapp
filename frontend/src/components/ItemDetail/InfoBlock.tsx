import React from "react";
import type { Listing } from "../../types/types";

type Props = {
  item: Listing;
  statusSlot: React.ReactNode;
};

export const InfoBlock: React.FC<Props> = ({ item, statusSlot }) => {
  return (
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
          {statusSlot}
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
  );
};