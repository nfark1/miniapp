// src/components/ItemDetail/SellerCard.tsx
import React from "react";
import type { Listing } from "../../types/types";

type SellerCardProps = {
  item: Listing;
  isMyListing: boolean;

  sellerUsername?: string | null;
  sellerListingsCount?: number;
  onOpenSellerProfile?: (username: string) => void;
};

export const SellerCard: React.FC<SellerCardProps> = ({
  item,
  isMyListing,
  sellerUsername,
  sellerListingsCount,
  onOpenSellerProfile,
}) => {
  const name = item.seller_name || "Продавец";
  const username = sellerUsername || item.owner || null;
  const photoUrl = (item as any).seller_photo_url as string | undefined; // если поле есть в Listing — убери any

  const openChat = () => {
    if (!username) return;
    const link = `https://t.me/${username}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(link);
    } else {
      window.open(link, "_blank");
    }
  };

  const canOpenProfile = !!(onOpenSellerProfile && username);

  const initials = (name || username || "??")
    .replace("@", "")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section
      className="
        rounded-3xl
        border border-slate-800/80
        bg-slate-950/95
        px-4 py-3.5
        shadow-[0_16px_40px_rgba(0,0,0,0.9)]
        space-y-3
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* АВАТАР */}
          <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="
                  w-full h-full
                  bg-gradient-to-br from-cyan-500/40 via-sky-500/40 to-slate-900
                  flex items-center justify-center
                  text-slate-50 text-sm font-bold
                  shadow-[0_0_18px_rgba(56,189,248,0.45)]
                "
              >
                {initials}
              </div>
            )}
          </div>

          {/* ИМЯ + ЮЗЕРНЕЙМ + КОЛ-ВО ОБЪЯВ */}
          <div>
            <div className="text-[13px] font-semibold text-slate-50">
              {name}
            </div>
            {username && (
              <div className="text-[11px] text-slate-400">@{username}</div>
            )}

            {typeof sellerListingsCount === "number" && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                Объявлений:{" "}
                <span className="font-semibold text-slate-100">
                  {sellerListingsCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {isMyListing && (
          <span className="text-[10px] px-2 py-[3px] rounded-full bg-emerald-500/15 border border-emerald-400/70 text-emerald-200">
            Это ваше объявление
          </span>
        )}
      </div>

      {/* КНОПКИ */}
      <div className="flex flex-col sm:flex-row gap-2 mt-1">
        {/* Написать продавцу */}
        {!isMyListing && username && (
          <button
            type="button"
            onClick={openChat}
            className="
              flex-1 px-3 py-2 rounded-xl
              text-[12px] font-semibold
              bg-cyan-500/15 border border-cyan-400/70
              text-cyan-100
              flex items-center justify-center gap-1.5
              hover:bg-cyan-500/25
              active:scale-95
              transition
            "
          >
            💬 Написать продавцу
          </button>
        )}

        {/* Профиль продавца */}
        {canOpenProfile && username && (
          <button
            type="button"
            onClick={() => onOpenSellerProfile(username)}
            className="
              flex-1 px-3 py-2 rounded-xl
              text-[12px] font-semibold
              bg-slate-900/90 border border-slate-700/80
              text-slate-100
              flex items-center justify-center gap-1.5
              hover:bg-slate-800
              active:scale-95
              transition
            "
          >
            👤 Профиль продавца
          </button>
        )}
      </div>
    </section>
  );
};