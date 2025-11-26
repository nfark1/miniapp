// src/components/Profile/ProfileView.tsx
import React, { useEffect, useState } from "react";
import type { TelegramUser } from "../../types/telegram";
import type { Listing } from "../../types/types";

import { ProfileHeader } from "./ProfileHeader";
import { ProfileSupportBlock } from "./ProfileSupportBlock";
import { ProfileStats, type ProfileFilter } from "./ProfileStats";
import { ProfileListings } from "./ProfileListings";

type ProfileViewProps = {
  totalCount: number;
  activeCount: number;
  moderationCount: number;
  hiddenCount: number;
  myListings: Listing[];
  onOpenAdmin?: () => void;
  onHideListing?: (id: number) => void;
  onDeleteListing?: (id: number) => void;
  onSendToModeration?: (id: number) => void;
  onEditListing?: (item: Listing) => void;
};

const getInitials = (user: TelegramUser | null): string => {
  if (!user) return "Г";
  const parts = [user.first_name, user.last_name].filter(Boolean);
  if (!parts.length) return "Г";
  const first = parts[0]!.charAt(0);
  const second = parts[1]?.charAt(0) ?? "";
  return (first + second).toUpperCase();
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  totalCount,
  activeCount,
  moderationCount,
  hiddenCount,
  myListings,
  onOpenAdmin,
  onHideListing,
  onDeleteListing,
  onSendToModeration,
  onEditListing,
}) => {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [filter, setFilter] = useState<ProfileFilter>("all");

  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      setTgUser(window.Telegram.WebApp.initDataUnsafe.user);
    }
  }, []);

  const initials = getInitials(tgUser);
  const displayName =
    [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(" ") || "Гость";
  const username = tgUser?.username ? `@${tgUser.username}` : "неизвестно";
  const isAdmin = tgUser?.username === "nfark";

  // 🔹 фильтрация "Моих объявлений" по статусу
  const filteredListings = myListings.filter((it) => {
    if (filter === "all") return true;
    if (filter === "active") return it.status === "active";
    if (filter === "moderation") return it.status === "moderation";
    if (filter === "hidden") return it.status === "hidden";
    return true;
  });

  const emptyText =
    filter === "all"
      ? "У тебя пока нет объявлений 🚗"
      : filter === "active"
      ? "Нет активных объявлений"
      : filter === "moderation"
      ? "Нет объявлений на модерации"
      : "Нет скрытых объявлений";

  return (
    <div className="max-w-xl mx-auto px-2 pb-4 space-y-5">
      {/* 🔹 Шапка профиля + шестерёнка админа */}
      <ProfileHeader
        tgUser={tgUser}
        displayName={displayName}
        username={username}
        initials={initials}
        isAdmin={isAdmin}
        onOpenAdmin={onOpenAdmin}
      />

      {/* 🔹 Блок "Возникли проблемы?" */}
      <ProfileSupportBlock />

      {/* 🔹 Статистика объявлений — кликабельная */}
      <ProfileStats
        totalCount={totalCount}
        activeCount={activeCount}
        moderationCount={moderationCount}
        hiddenCount={hiddenCount}
        activeFilter={filter}
        onChangeFilter={setFilter}
      />

      {/* 🔹 Мои объявления с учётом фильтра */}
      <ProfileListings
        listings={filteredListings}
        emptyText={emptyText}
        onHideListing={onHideListing}
        onDeleteListing={onDeleteListing}
        onSendToModeration={onSendToModeration}
        onEditListing={onEditListing}
      />
    </div>
  );
};