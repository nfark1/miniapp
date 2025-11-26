import React from "react";
import type { Listing } from "../../types/types";

type Props = {
  status?: Listing["status"];
};

export const StatusChip: React.FC<Props> = ({ status }) => {
  if (status === "moderation") {
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

  if (status === "hidden") {
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

  // по умолчанию считаем active
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