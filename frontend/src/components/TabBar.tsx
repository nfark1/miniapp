// src/components/TabBar.tsx
import React from "react";
import type { View } from "../types/types";

type TabBarProps = {
  current: View;
  favCount: number;
  onChange: (v: View) => void;
};

export const TabBar: React.FC<TabBarProps> = ({
  current,
  favCount,
  onChange,
}) => {
  return (
    <nav
      className="
        fixed inset-x-0 bottom-4 z-30
        px-3
      "
    >
      <div
        className="
          max-w-xl mx-auto
          rounded-[22px]
          border border-cyan-400/25
          bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.18),transparent_60%),rgba(2,6,23,0.96)]
          backdrop-blur-xl
          shadow-[0_-18px_45px_rgba(0,0,0,0.95),0_0_22px_rgba(34,211,238,0.24)]
          px-3 pt-2 pb-2.5
        "
      >
        <div className="grid grid-cols-5 gap-2 items-center">
          {/* home */}
          <TabButton active={current === "home"} onClick={() => onChange("home")}>
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path
                d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </TabButton>

          {/* search (заглушка) */}
          <TabButton active={false} onClick={() => {}}>
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <circle
                cx="11"
                cy="11"
                r="6"
                stroke="currentColor"
                strokeWidth={2}
                fill="none"
              />
              <line
                x1="16"
                y1="16"
                x2="21"
                y2="21"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </TabButton>

          {/* плюс — центральная премиум-кнопка */}
          <div className="flex items-center justify-center">
            <button
              className="
                w-[52px] h-[52px] rounded-2xl
                bg-gradient-to-br from-slate-100/10 via-slate-900/95 to-slate-950/95
                border border-slate-400/60
                shadow-[0_18px_40px_rgba(15,23,42,0.95),0_0_0_1px_rgba(15,23,42,1)]
                flex items-center justify-center
                active:scale-95
                transition
              "
              type="button"
              onClick={() => onChange("add")}   // 🔹 вот это главное
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="#E5F2FF"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* fav — ТЕПЕРЬ без лишнего wrapper'а */}
          <TabButton
            active={current === "fav"}
            onClick={() => onChange("fav")}
          >
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  d="M20.84 6.61a5.5 5.5 0 0 0-7.78 0L12 7.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 22l7.78-6.55 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {favCount > 0 && (
                <span
                  className="
                    absolute -top-3 -right-3
                    min-w-[18px] h-[18px]
                    px-[3px]
                    rounded-full

                    bg-[radial-gradient(circle_at_30%_0%,rgba(34,211,238,0.38),transparent_55%),rgba(2,6,23,0.98)]
                    border border-cyan-300/75

                    text-[10px] font-extrabold
                    text-cyan-50
                    flex items-center justify-center
                    tracking-tight

                    shadow-[0_0_10px_rgba(34,211,238,0.6)]

                    animate-pulse
                  "
                >
                  {favCount}
                </span>
              )}
            </div>
          </TabButton>

          {/* profile */}
          <TabButton
            active={current === "profile"}
            onClick={() => onChange("profile")}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path
                d="M20 21a8 8 0 0 0-16 0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="8"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              />
            </svg>
          </TabButton>
        </div>
      </div>
    </nav>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      relative flex items-center justify-center
      py-2 rounded-xl
      text-[13px]
      transition
      ${
        active
          ? "text-slate-50 bg-slate-900/80 shadow-[0_8px_24px_rgba(15,23,42,0.9)]"
          : "text-slate-400/85 hover:text-slate-100/90 hover:bg-slate-900/40"
      }
    `}
  >
    {children}
    {active && (
      <span
        className="
          absolute -bottom-0.5 w-6 h-[3px] rounded-full
          bg-gradient-to-r from-accent/0 via-accent to-accent/0
        "
      />
    )}
  </button>
);