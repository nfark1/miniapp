// src/components/Profile/ProfileStats.tsx
import React from "react";

export type ProfileFilter = "all" | "active" | "moderation" | "hidden";

type ProfileStatsProps = {
  totalCount: number;
  activeCount: number;
  moderationCount: number;
  hiddenCount: number;
  activeFilter: ProfileFilter;
  onChangeFilter: (filter: ProfileFilter) => void;
};

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  totalCount,
  activeCount,
  moderationCount,
  hiddenCount,
  activeFilter,
  onChangeFilter,
}) => {
  return (
    <section className="grid grid-cols-4 gap-1 -mt-2">
      <ProfileStat
        label="Всего"
        value={String(totalCount)}
        active={activeFilter === "all"}
        onClick={() => onChangeFilter("all")}
      />
      <ProfileStat
        label="Активные"
        value={String(activeCount)}
        active={activeFilter === "active"}
        onClick={() => onChangeFilter("active")}
      />
      <ProfileStat
        label="На модерации"
        value={String(moderationCount)}
        active={activeFilter === "moderation"}
        onClick={() => onChangeFilter("moderation")}
      />
      <ProfileStat
        label="Скрытые"
        value={String(hiddenCount)}
        active={activeFilter === "hidden"}
        onClick={() => onChangeFilter("hidden")}
      />
    </section>
  );
};

const ProfileStat: React.FC<{
  label: string;
  value: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ label, value, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      flex flex-col items-center text-center gap-0.5
      rounded-2xl
      px-2 py-1.5
      shadow-[0_10px_26px_rgba(0,0,0,0.75)]
      border
      ${
        active
          ? "bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.3),transparent_60%),rgba(15,23,42,1)] border-cyan-400/80"
          : "bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.18),transparent_60%),rgba(2,6,23,0.98)] border-slate-700/80"
      }
    `}
  >
    <span className="text-[13px] font-extrabold text-slate-50 leading-none">
      {value}
    </span>
    <span className="text-[9px] text-slate-400 leading-none">
      {label}
    </span>
  </button>
);