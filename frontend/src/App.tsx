// src/App.tsx
import React, { useState, useEffect, useRef } from "react";
import type { Listing, View } from "./types/types";

import { FeedList } from "./components/FeedList";
import { ItemDetail } from "./components/ItemDetail/ItemDetail";
import { ProfileView } from "./components/Profile/ProfileView";
import { TabBar } from "./components/TabBar";
import { Admin } from "./components/Admin/Admin";
import { AddView } from "./components/AddView/AddView";
import { EditView } from "./components/EditView/EditView";
import type { AddFormData, LocalPhoto } from "./components/AddView/AddView";

// сколько объявлений показывать сначала и шаг подгрузки
const INITIAL_VISIBLE = 6;
const LOAD_STEP = 6;

const API_BASE =
  "https://symmetrical-capybara-7vxw5747qpgq3wxpg-8001.app.github.dev";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>("home");
  const [items, setItems] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [editItem, setEditItem] = useState<Listing | null>(null);
  const [editReturnView, setEditReturnView] = useState<View>("profile");
  const [sellerProfileUsername, setSellerProfileUsername] =
    useState<string | null>(null);
  const [sellerProfileItems, setSellerProfileItems] = useState<Listing[]>([]);

  // 🔹 контейнер ленты
  const mainRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Pull-to-refresh
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 70; // порог в пикселях

  // ленивый рендер
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // избранное (с сохранением в localStorage)
  const [favIds, setFavIds] = useState<Set<number>>(() => {
    if (typeof window === "undefined") {
      return new Set();
    }

    try {
      const raw = window.localStorage.getItem("favIds");
      if (!raw) return new Set();

      const arr = JSON.parse(raw) as number[];
      return new Set(arr);
    } catch (e) {
      console.error("favIds load error", e);
      return new Set();
    }
  });

  // 🔹 ID объявления, которое нужно открыть при старте (из start_param)
  const [startListingId, setStartListingId] = useState<number | null>(null);

  // ===== Чтение start_param из Telegram WebApp =====
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const startParam = tg?.initDataUnsafe?.start_param as string | undefined;

    // ждём формат "listing_123"
    if (startParam && startParam.startsWith("listing_")) {
      const idPart = startParam.split("_")[1];
      const parsed = Number(idPart);
      if (!Number.isNaN(parsed)) {
        setStartListingId(parsed);
      }
    }
  }, []);

  // ✅ Сброс количества видимых объявлений при смене экрана / обновлении списка
  useEffect(() => {
    if (view === "home" || view === "fav") {
      setVisibleCount(INITIAL_VISIBLE);
      // сбрасываем скролл наверх при смене вкладки
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
    }
  }, [view, items.length]);

  // ✅ Сохранение избранного в localStorage при каждом изменении
  useEffect(() => {
    try {
      const arr = Array.from(favIds);
      localStorage.setItem("favIds", JSON.stringify(arr));
    } catch (e) {
      console.error("favIds save error", e);
    }
  }, [favIds]);

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

  // ===== Авто-открытие объявления по start_param, когда данные загрузились =====
  useEffect(() => {
    if (!startListingId) return;
    if (!items.length) return;

    const found = items.find((it) => it.id === startListingId);
    if (found) {
      setSelected(found);
      setView("item");
    }
  }, [startListingId, items]);

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

  // базовый список для главной/избранного
  const baseList = view === "fav" ? favItems : activeItems;

  // что показываем в ленте (для home / fav — slice по visibleCount)
  const listToRender =
    view === "home" || view === "fav"
      ? baseList.slice(0, visibleCount)
      : activeItems;

  // ===== PULL-TO-REFRESH (свайп вниз на главной/избранном) =====
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (view !== "home" && view !== "fav") return;
    const el = mainRef.current;
    if (!el) return;

    // тянем только если мы в самом верху списка
    if (el.scrollTop > 0) return;

    setTouchStartY(e.touches[0].clientY);
    setPullDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY === null) return;
    const el = mainRef.current;
    if (!el) return;

    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY;

    // если двигаем вверх — сбрасываем
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }

    // если уже проскроллились вниз — не тянем
    if (el.scrollTop > 0) return;

    setPullDistance(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartY === null) return;

    if (pullDistance > PULL_THRESHOLD && !isLoading) {
      refreshListings();
    }

    setTouchStartY(null);
    setPullDistance(0);
  };

  // 🔥 Избранное: локальный Set + глобальный likes_count
  const toggleFav = async (id: number) => {
    const wasFav = favIds.has(id); // было ли в избранном
    const isAdding = !wasFav;
    const delta = isAdding ? 1 : -1;

    // 1) Мгновенно обновляем локальный Set (UI)
    setFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // 2) Пытаемся обновить глобальный счётчик лайков на бэке
    try {
      const res = await fetch(`${API_BASE}/api/listings/${id}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });

      if (!res.ok) {
        console.error("like update failed", await res.text());
        // откат favIds, если бэк не принял
        setFavIds((prev) => {
          const next = new Set(prev);
          if (wasFav) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
        return;
      }

      const updated: Listing = await res.json();

      // обновляем объявление в общем списке
      setItems((prev) =>
        prev.map((it) => (it.id === updated.id ? updated : it)),
      );

      // если сейчас открыт детальный просмотр этого объявления —
      // тоже обновим его там
      setSelected((prev) =>
        prev && prev.id === updated.id ? updated : prev,
      );
    } catch (e) {
      console.error("like update error", e);
      // откат favIds при ошибке сети
      setFavIds((prev) => {
        const next = new Set(prev);
        if (wasFav) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    }
  };

  const openItem = (it: Listing) => {
    setSelected(it);
    setView("item");

    // увеличиваем счётчик просмотров на бэке
    fetch(`${API_BASE}/api/listings/${it.id}/views`, {
      method: "POST",
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("views update failed", await res.text());
          return;
        }
        const updated: Listing = await res.json();

        setItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setSelected((prev) =>
          prev && prev.id === updated.id ? updated : prev,
        );
      })
      .catch((err) => {
        console.error("views update error", err);
      });
  };

  const handleShareListing = async (it: Listing) => {
    try {
      const res = await fetch(`${API_BASE}/api/listings/${it.id}/shares`, {
        method: "POST",
      });

      if (!res.ok) {
        console.error("share update failed", await res.text());
        return;
      }

      const updated: Listing = await res.json();

      // обновляем общий список
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );

      // если открыта детальная карточка — обновляем и её
      setSelected((prev) =>
        prev && prev.id === updated.id ? updated : prev,
      );
    } catch (e) {
      console.error("share update error", e);
    }
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
    const ok = window.confirm(
      "Точно удалить объявление? Отменить будет нельзя.",
    );
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
    if (
      !window.confirm("Снять объявление с продажи? Оно уйдёт в «Скрытые».")
    )
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
    if (!window.confirm("Отклонить объявление? Оно уйдёт в скрытые."))
      return;

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
        (it.status ?? "active") === "active",
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
      const res = await fetch(`${API_BASE}/api/listings/${id}/badge`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge }),
      });

      if (!res.ok) {
        console.error("badge update failed", await res.text());
        alert("Не удалось изменить выделение объявления (ТОП/ПРЕМИУМ).");
        return;
      }

      const updated: Listing = await res.json();

      setItems((prev) =>
        prev.map((it) => (it.id === id ? updated : it)),
      );
    } catch (e) {
      console.error("badge update error", e);
      alert("Ошибка при изменении ТОП/ПРЕМИУМ.");
    }
  };

  const handleUpdateCounters = async (
    id: number,
    counters: {
      views_count?: number;
      shares_count?: number;
      likes_count?: number;
    },
  ) => {
    try {
      const res = await fetch(`${API_BASE}/api/listings/${id}/counters`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(counters),
      });

      if (!res.ok) {
        console.error("counters update failed", await res.text());
        alert("Не удалось обновить счётчики. Попробуй ещё раз.");
        return;
      }

      const updated: Listing = await res.json();

      // обновляем общий список
      setItems((prev) =>
        prev.map((it) => (it.id === updated.id ? updated : it)),
      );

      // если карточка сейчас открыта в детальном просмотре — тоже обновим
      setSelected((prev) =>
        prev && prev.id === updated.id ? updated : prev,
      );
    } catch (e) {
      console.error("counters update error", e);
      alert("Ошибка при обновлении счётчиков.");
    }
  };

  // ===== Бесконечный скролл по main =====
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (view !== "home" && view !== "fav") return;

    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceToBottom < 200) {
      const base = view === "fav" ? favItems : activeItems;

      setVisibleCount((prev) => {
        if (prev >= base.length) return prev; // уже всё показали
        return Math.min(prev + LOAD_STEP, base.length);
      });
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

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto px-2 pb-24 pt-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
      >
        {/* 🔄 Индикатор pull-to-refresh (только на главной и избранном) */}
        {(view === "home" || view === "fav") && pullDistance > 0 && (
          <div className="flex justify-center text-[11px] text-slate-400 mb-2">
            {pullDistance > PULL_THRESHOLD
              ? "Отпусти, чтобы обновить"
              : "Потяни вниз, чтобы обновить"}
          </div>
        )}

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
                  it.owner.toLowerCase() === selected.owner.toLowerCase(),
              ).length
            }
            onShare={handleShareListing}
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
            onUpdateCounters={handleUpdateCounters}
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