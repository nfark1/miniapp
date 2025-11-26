// src/components/Profile/ProfileSupportBlock.tsx
import React from "react";

export const ProfileSupportBlock: React.FC = () => {
  const handleSupportClick = () => {
    const url = "https://t.me/nfark";

    const tg = (window as any).Telegram?.WebApp;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <section
      className="
        rounded-2xl
        border border-slate-700/70
        bg-slate-950/85
        px-3.5 py-3.5
        shadow-[0_12px_30px_rgba(0,0,0,0.85)]
        space-y-2.5
      "
    >
      <div className="text-[13px] text-slate-200 leading-snug">
        Возникли проблемы с объявлением, модерацией или работой мини-приложения?
        <br />
        <span className="text-slate-400">
          Напиши в техподдержку — ответим лично и поможем разобраться.
        </span>
      </div>

      <button
        type="button"
        onClick={handleSupportClick}
        className="
          w-full mt-1
          py-3 rounded-2xl
          bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.25),transparent_60%),rgba(8,16,32,0.98)]
          border border-cyan-300/50
          text-[14px] font-semibold text-sky-50
          shadow-[0_0_0_1px_rgba(15,23,42,1),0_0_26px_rgba(56,189,248,0.65)]
          active:scale-[0.98]
          transition
        "
      >
        💬 Написать в техподдержку
      </button>
    </section>
  );
};