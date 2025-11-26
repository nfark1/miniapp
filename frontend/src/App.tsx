// src/App.tsx
import React, { useState, useEffect } from "react";
import type { Listing, View } from "./types/types";

import { FeedList } from "./components/FeedList";
import { ItemDetail } from "./components/ItemDetail/ItemDetail";
import { ProfileView } from "./components/Profile/ProfileView";
import { TabBar } from "./components/TabBar";
import { Admin } from "./components/Admin/Admin";
import { AddView } from "./components/AddView/AddView";
import { EditView } from "./components/EditView/EditView";
import type { AddFormData, LocalPhoto } from "./components/AddView/AddView";

const API_BASE =
  "https://symmetrical-capybara-7vxw5747qpgq3wxpg-8001.app.github.dev";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>("home");
  const [items, setItems] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [editItem, setEditItem] = useState<Listing | null>(null);
  const [editReturnView, setEditReturnView] = useState<View>("profile");
  const [sellerProfileUsername, setSellerProfileUsername] = useState<string | null>(null);
  const [sellerProfileItems, setSellerProfileItems] = useState<Listing[]>([]);

  // ===== Загрузка объявлений =====
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/api/listings`);
        const data: Listing[] = await res.json();
        const sorted = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        setItems(sorted);
      } catch (e) {
        console.error("load listings error", e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // избранное только по активным
  const favCount = items.filter(
    (it) => (it.status ?? "active") === "active" && favIds.has(it.id),
  ).length;

  // username текущего пользователя из Telegram WebApp
  const tgUsername =
    typeof window !== "undefined"
      ? window.Telegram?.WebApp?.initDataUnsafe?.user?.username ?? null
      : null;

  // Мои объявления = owner === мой username
  const myListings = tgUsername
    ? items.filter(
        (it) =>
          it.owner &&
          it.owner.toLowerCase() === tgUsername.toLowerCase(),
      )
    : [];

  // Счётчики ТОЛЬКО по моим объявлениям
  const totalMyCount = myListings.length;
  const activeCount = myListings.filter(
    (it) => (it.status ?? "active") === "active",
  ).length;
  const moderationCount = myListings.filter(
    (it) => it.status === "moderation",
  ).length;
  const hiddenCount = myListings.filter(
    (it) => it.status === "hidden",
  ).length;

  // Главная — только активные объявления всех
  const activeItems = items.filter(
    (it) => (it.status ?? "active") === "active",
  );

  // избранное — только из активных
  const favItems = activeItems.filter((it) => favIds.has(it.id));

  // что показываем в ленте
  const listToRender = view === "fav" ? favItems : activeItems;

  const toggleFav = (id: number) => {
    setFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openItem = (it: Listing) => {
    setSelected(it);
    setView("item");
  };

  const goHome = () => {
    setSelected(null);
    setView("home");
  };

  // ===== Добавление объявления =====
  const handleAddListing = async (
    form: {
      brand: string;
      model: string;
      price: number;
      year?: number;
      mileage?: number;
      district: string;
      desc?: string;
    },
    files: File[],
  ) => {
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          console.error("upload error", await res.text());
          throw new Error("upload failed");
        }

        const data = (await res.json()) as { url: string };
        const fullUrl = `${API_BASE}${data.url}`;
        uploadedUrls.push(fullUrl);
      }

      const title =
        `${form.brand} ${form.model}`.trim() ||
        form.brand ||
        form.model ||
        "Без названия";

      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

      const owner =
        tgUser?.username && tgUser.username.length > 0
          ? tgUser.username
          : undefined;

      const seller_name =
        [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(" ") ||
        undefined;

      const seller_photo_url = tgUser?.photo_url || undefined;

      const body = {
        title,
        price: form.price,
        district: form.district,
        year: form.year,
        mileage: form.mileage,
        desc: form.desc,
        owner,
        seller_name,
        seller_photo_url,
        status: "moderation" as const,
        photos: uploadedUrls,
        created_at: new Date().toISOString(),
      };

      const res = await fetch(`${API_BASE}/api/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("create error", await res.text());
        throw new Error("create failed");
      }

      const created = (await res.json()) as Listing;

      setItems((prev) => [created, ...prev]);
      setView("profile");
      setSelected(null);
    } catch (err) {
      console.error("Ошибка сохранения объявления:", err);
      alert("Ошибка: не удалось сохранить объявление, попробуй ещё раз.");
    }
  };

  // ===== Удаление =====
  const handleDeleteListing = async (id: number) => {
    const ok = window.confirm("Точно удалить объявление? Отменить будет нельзя.");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/listings/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("delete failed");
      }

      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      console.error("delete error", e);
      alert("Не удалось удалить объявление. Попробуй ещё раз.");
    }
  };

  // ===== Снять с продажи =====
  const handleHideListing = async (id: number) => {
    if (!window.confirm("Снять объявление с продажи? Оно уйдёт в «Скрытые»."))
      return;

    try {
      const res = await fetch(`${API_BASE}/api/listings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "hidden" }),
      });
      if (!res.ok) throw new Error("status update failed");

      const updated: Listing = await res.json();

      setItems((prev) =>
        prev.map((it) => (it.id === id ? updated : it)),
      );
    } catch (e) {
      console.error(e);
      alert("Не удалось снять с продажи. Попробуй ещё раз.");
    }
  };

  // ===== Отправить скрытое на модерацию =====
  const handleSendToModeration = async (id: number) => {
    if (!window.confirm("Отправить объявление на модерацию?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/listings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "moderation" }),
      });
      if (!res.ok) throw new Error("status update failed");

      const updated: Listing = await res.json();

      setItems((prev) =>
        prev.map((it) => (it.id === id ? updated : it)),
      );
    } catch (e) {
      console.error(e);
      alert("Не получилось отправить на модерацию. Попробуй ещё раз.");
    }
  };

  // ===== Модерация (админ) =====
  const handleApproveListing = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/listings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error("status update failed");

      const updated: Listing = await res.json();
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    } catch (e) {
      console.error(e);
      alert("Не удалось одобрить объявление. Попробуй ещё раз.");
    }
  };

  const handleRejectListing = async (id: number) => {
    if (!window.confirm("Отклонить объявление? Оно уйдёт в скрытые.")) return;

    try {
      const res = await fetch(`${API_BASE}/api/listings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "hidden" }),
      });
      if (!res.ok) throw new Error("status update failed");

      const updated: Listing = await res.json();
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    } catch (e) {
      console.error(e);
      alert("Не удалось отклонить объявление. Попробуй ещё раз.");
    }
  };

  const refreshListings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/listings`);
      const data: Listing[] = await res.json();
      const sorted = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      setItems(sorted);
    } catch (e) {
      console.error("refresh error", e);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Редактирование =====
  const handleEditFromProfile = (it: Listing) => {
  setEditItem(it);
  setEditReturnView("profile");
  setView("edit");
};

const handleEditFromAdmin = (it: Listing) => {
  setEditItem(it);
  setEditReturnView("admin");
  setView("edit");
};

  const handleUpdateListing = async (
  data: AddFormData,
  photosState: LocalPhoto[],
) => {
  if (!editItem) return;

  // 1) Собираем итоговый массив URL по порядку
  const finalUrls: string[] = [];

  for (const p of photosState) {
    if (p.file) {
      // новое фото → грузим
      const fd = new FormData();
      fd.append("file", p.file);

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        console.error("upload error", await res.text());
        throw new Error("upload failed");
      }

      const j = (await res.json()) as { url: string };
      const fullUrl = `${API_BASE}${j.url}`;
      finalUrls.push(fullUrl);
    } else {
      // старое фото → оставляем URL как есть
      finalUrls.push(p.preview);
    }
  }

  // 2) Новый title
  const title =
    `${data.brand} ${data.model}`.trim() ||
    data.brand ||
    data.model ||
    editItem.title;

  const body = {
    title,
    price: data.price,
    district: data.district,
    year: data.year,
    mileage: data.mileage,
    desc: data.desc,
    photos: finalUrls,
    status: "moderation",
  };

  const res = await fetch(`${API_BASE}/api/listings/${editItem.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("update error", await res.text());
    alert("Не удалось сохранить изменения. Попробуй ещё раз.");
    return;
  }

  await refreshListings();
  setEditItem(null);
  setView(editReturnView === "admin" ? "admin" : "profile");
  };
const handleOpenSellerProfile = (username: string) => {
  // берём все объявления этого продавца
  const sellerAds = items.filter(
    (it) =>
      it.owner &&
      username &&
      it.owner.toLowerCase() === username.toLowerCase() &&
      (it.status ?? "active") === "active"
  );

  setSellerProfileUsername(username);
  setSellerProfileItems(sellerAds);
  setView("seller_profile");
};

const handleSetBadge = async (
  id: number,
  badge: "top" | "premium" | null,
) => {
  try {
    const res = await fetch(`${API_BASE}/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge }),
    });

    if (!res.ok) throw new Error("badge update failed");

    const updated: Listing = await res.json();

    setItems((prev) =>
      prev.map((it) => (it.id === id ? updated : it)),
    );
  } catch (e) {
    console.error("badge update error", e);
    alert("Не удалось изменить выделение объявления (ТОП/ПРЕМИУМ).");
  }
};

  // ===== Рендер =====
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 px-4 pt-15 pb-4 border-b border-cyan-400/20 shadow-[0_22px_60px_rgba(0,0,0,0.95)] bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.18),transparent_60%),linear-gradient(135deg,#020617_0%,#020617_45%,#020617_100%)]">
        <div className="max-w-xl mx-auto flex items-center justify-center">
          <h1 className="text-center uppercase font-black tracking-[0.10em] text-sky-100 text-[16px] sm:text-[17px] drop-shadow-[0_0_18px_rgba(56,189,248,0.45)]">
            АВТОРЫНОК&nbsp;ПЕРМЬ
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-2 pb-24 pt-8">
        {view === "item" && selected ? (
          <ItemDetail
            item={selected}
            isFav={favIds.has(selected.id)}
            onBack={goHome}
            onToggleFav={toggleFav}
            onOpenSellerProfile={handleOpenSellerProfile}
            sellerListingsCount={
              items.filter(
                (it) =>
                  it.owner &&
                  selected.owner &&
                  it.owner.toLowerCase() === selected.owner.toLowerCase()
              ).length
            }
          />
        ) : view === "profile" ? (
          <ProfileView
            totalCount={totalMyCount}
            activeCount={activeCount}
            moderationCount={moderationCount}
            hiddenCount={hiddenCount}
            myListings={myListings}
            onOpenAdmin={() => setView("admin")}
            onHideListing={handleHideListing}
            onDeleteListing={handleDeleteListing}
            onSendToModeration={handleSendToModeration}
            onEditListing={handleEditFromProfile}
          />
        ) : view === "admin" ? (
          <Admin
            onBack={() => setView("profile")}
            items={items}
            onApprove={handleApproveListing}
            onReject={handleRejectListing}
            onRefresh={refreshListings}
            onHide={handleHideListing}
            onDelete={handleDeleteListing}
            onEditListing={handleEditFromAdmin}
            onSetBadge={handleSetBadge}
          />
        ) : view === "add" ? (
          <AddView onBack={goHome} onSubmit={handleAddListing} />
        ) : view === "edit" && editItem ? (
          <EditView
            item={editItem}
            onBack={() =>
              setView(editReturnView === "admin" ? "admin" : "profile")
            }
            onSubmit={handleUpdateListing}
          />
        ) : view === "seller_profile" && sellerProfileUsername ? (
          <>
            {/* 🔥 Шапка профиля продавца */}
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={goHome}
                className="
                  px-3 py-1.5 rounded-xl text-xs font-medium
                  bg-slate-900/80 border border-slate-600/70
                  active:scale-95
                "
              >
                ← Назад
              </button>

              <div className="text-right">
                <div className="text-[12px] text-slate-400">
                  Профиль продавца
                </div>
                <div className="text-[13px] font-semibold text-slate-100">
                  @{sellerProfileUsername}
                </div>
                <div className="text-[11px] text-slate-500">
                  Объявлений:{" "}
                  <span className="font-semibold">
                    {sellerProfileItems.length}
                  </span>
                </div>
              </div>
            </div>

            {/* 🔥 Список объявлений продавца */}
            <FeedList
              items={sellerProfileItems}
              isFavoritesView={false}
              favIds={favIds}
              onToggleFav={toggleFav}
              onOpenItem={openItem}
              isLoading={isLoading}
            />
          </>
        ) : (
          <FeedList
            items={listToRender}
            isFavoritesView={view === "fav"}
            favIds={favIds}
            onToggleFav={toggleFav}
            onOpenItem={openItem}
            isLoading={isLoading}
          />
        )}
      </main>

      <TabBar
        current={view}
        favCount={favCount}
        onChange={(v) => {
          setView(v);
          if (v !== "item") setSelected(null);
        }}
      />
    </div>
  );
};

export default App;