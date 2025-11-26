// src/components/Profile/ProfileHeader.tsx
import React from "react";
import type { TelegramUser } from "../../types/telegram";

type ProfileHeaderProps = {
  tgUser: TelegramUser | null;
  displayName: string;
  username: string;
  initials: string;
  isAdmin: boolean;
  onOpenAdmin?: () => void;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  tgUser,
  displayName,
  username,
  initials,
  isAdmin,
  onOpenAdmin,
}) => {
  return (
    <section
      className="
        profile-card
        rounded-3xl
        border border-slate-700/80
        bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.24),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.2),transparent_60%),rgba(2,6,23,0.98)]
        shadow-[0_18px_45px_rgba(0,0,0,0.95)]
        px-4 py-3.5
        flex items-center justify-between gap-3.5
      "
    >
      {/* левая часть: аватар + текст */}
      <div className="flex items-center gap-3.5">
        {tgUser?.photo_url ? (
          <div
            className="
              w-12 h-12 rounded-full overflow-hidden
              shadow-[0_0_0_2px_rgba(15,23,42,1),0_0_28px_rgba(56,189,248,0.7)]
              flex items-center justify-center
              bg-slate-900
            "
          >
            <img
              src={tgUser.photo_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="
              w-12 h-12 rounded-full
              bg-gradient-to-br from-sky-400 via-cyan-300 to-sky-500
              flex items-center justify-center
              text-slate-950 font-extrabold text-lg
              shadow-[0_0_0_2px_rgba(15,23,42,1),0_0_32px_rgba(56,189,248,0.85)]
            "
          >
            {initials}
          </div>
        )}

        <div className="flex flex-col leading-tight">
          <div className="text-[15px] font-semibold text-slate-50">
            {displayName}
          </div>
          <div className="text-xs text-slate-400">{username}</div>
          <div className="mt-1 inline-flex items-center gap-1.5">
            <span className="h-[6px] w-[6px] rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              В сети через Telegram
            </span>
          </div>
        </div>
      </div>

      {/* правая часть: шестерёнка для админа */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => onOpenAdmin?.()}
          className="
            w-9 h-9 rounded-2xl
            flex items-center justify-center
            bg-[radial-gradient(circle_at_30%_0%,rgba(56,189,248,0.22),transparent_60%),rgba(15,23,42,0.96)]
            border border-cyan-300/60
            shadow-[0_0_0_1px_rgba(15,23,42,1),0_0_22px_rgba(56,189,248,0.75)]
            text-sky-100
            active:scale-95
            transition
          "
          aria-label="Админ-панель"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
            <path d="M19.4 14a1.7 1.7 0 0 0 .34 1.88l.05.05a1.9 1.9 0 1 1-2.69 2.69l-.05-.05A1.7 1.7 0 0 0 15.99 18l-.15-.03a1.7 1.7 0 0 0-1.53.49l-.06.06a1.9 1.9 0 1 1-2.68-2.69l.05-.05A1.7 1.7 0 0 0 11 14.01L10.97 14a1.7 1.7 0 0 0-1.88-.34l-.06.03a1.7 1.7 0 0 0-.86 1.98l.03.1a1.9 1.9 0 1 1-3.62 1.1l-.02-.09A1.7 1.7 0 0 0 19.4 14z" />
          </svg>
        </button>
      )}
    </section>
  );
};