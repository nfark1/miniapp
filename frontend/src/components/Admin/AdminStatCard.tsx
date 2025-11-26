// src/components/admin/AdminStatCard.tsx
import React from "react";

type StatCardProps = {
  label: string;
  value: number;
  badge?: string;
  accent: string;
  active?: boolean;
  onClick?: () => void;
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  badge,
  accent,
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      w-full text-left
      rounded-2xl border
      bg-gradient-to-br ${accent}
      px-3 py-2.5
      text-[12px]
      flex flex-col gap-1
      transition
      ${
        active
          ? "border-accent shadow-[0_0_18px_rgba(34,211,238,0.7)] ring-1 ring-accent/70"
          : "border-slate-700/80 text-slate-200 opacity-85 hover:opacity-100 hover:border-cyan-400/70"
      }
    `}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-300">{label}</span>
      {badge && <span className="text-[13px]">{badge}</span>}
    </div>
    <div className="text-[18px] font-extrabold text-slate-50 leading-none">
      {value}
    </div>
  </button>
);