// ===== Utilities / API / глобальное состояние + шиты/жесты/избранное =====
(function () {
  const App = (window.App = window.App || {});

  // ----- базовые утилиты -----
  App.noStore = { credentials: "include", cache: "no-store" };
  App.bust = () => `t=${Date.now()}`;
  App.el = (t, c) => { const d = document.createElement(t); if (c) d.className = c; return d; };
  App.fmt = (n) => (typeof n === "number" ? n.toLocaleString("ru-RU") : (n ?? ""));

  // ----- глобальное состояние -----
  App.IS_ADMIN = false;
  App.ALL_ITEMS = [];
  App.CUR_ITEMS = [];
  App.BRAND_FILTER = "";
  App.qTimer = null;

  // ----- API -----
  App.apiMe = async () => {
    const r = await fetch(`/api/me?${App.bust()}`, App.noStore);
    return r.ok ? r.json() : null;
  };

  App.apiDevLogin = async () => {
    await fetch(`/api/dev_login?tg_id=415254917&username=nfark&first_name=Никита&is_admin=1&${App.bust()}`, App.noStore);
    return App.apiMe();
  };

  App.apiListings = async () => {
    const r = await fetch(`/api/listings?${App.bust()}`, App.noStore);
    return r.ok ? r.json() : { items: [] };
  };

  // 🔹 Мои объявления
  App.apiMyListings = async () => {
    const r = await fetch(`/api/my_listings?${App.bust()}`, App.noStore);
    if (!r.ok) return { items: [] };
    return r.json();
  };
    
    
  // ----- toast -----
  App.toast = (msg) => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1800);
  };

  // ===== Избранное (localStorage) =====
  const FAV_KEY = "fav_ids";
  let favSet;
  try { favSet = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); }
  catch { favSet = new Set(); }

  App.readFav = () => new Set(favSet);
  App.writeFav = (s) => {
    favSet = new Set(s);
    localStorage.setItem(FAV_KEY, JSON.stringify([...favSet]));
    App.updateFavBadge();
  };

  App.isFav = (id) => favSet.has(Number(id));
  App.toggleFav = (id) => {
    id = Number(id);
    favSet.has(id) ? favSet.delete(id) : favSet.add(id);
    localStorage.setItem(FAV_KEY, JSON.stringify([...favSet]));
    App.updateFavBadge();
  };
  App.updateFavBadge = () => {
    const n = favSet.size;
    const badge = document.getElementById("favBadge");
    const tab = document.getElementById("tabFav");
    if (badge) badge.textContent = String(n);
    if (tab) tab.setAttribute("data-count", String(n));
  };
  document.addEventListener("DOMContentLoaded", App.updateFavBadge);

  // ===== Управление шитами (поиск/добавить) =====
  App.closeAllSheets = function closeAllSheets() {
    document.querySelectorAll(".sheet.show").forEach(s => {
      s.classList.remove("show", "dragging");
      s.style.transform = "";
      s.setAttribute("aria-hidden", "true");
    });
    document.documentElement.classList.remove("sheet-open");
    document.querySelectorAll(".tab.active").forEach(t => t.classList.remove("active"));
    document.querySelectorAll("#tabSearch,#tabAdd").forEach(t => t.setAttribute("aria-expanded", "false"));
  };

  App.openSheet = function openSheet(sheet, tabEl) {
    if (!sheet) return;
    App.closeAllSheets();
    sheet.classList.add("show");
    sheet.style.transform = "";
    sheet.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("sheet-open");
    if (tabEl) {
      tabEl.classList.add("active");
      tabEl.setAttribute("aria-expanded", "true");
    }
  };

  App.closeSheet = function closeSheet(sheet, tabEl) {
    if (!sheet) return;
    sheet.classList.remove("show", "dragging");
    sheet.style.transform = "";
    sheet.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("sheet-open");
    if (tabEl) {
      tabEl.classList.remove("active");
      tabEl.setAttribute("aria-expanded", "false");
    }
  };

  App.toggleSheet = function toggleSheet(sheet, tabEl) {
    if (!sheet) return;
    sheet.classList.contains("show") ? App.closeSheet(sheet, tabEl) : App.openSheet(sheet, tabEl);
  };

  // ===== замок от «призрачных» кликов по подложке =====
  App._noBackdropCloseUntil = 0;
  App.setBackdropLock = function (ms = 400) {
    App._noBackdropCloseUntil = Date.now() + ms;
  };

  // ===== Жест «свайп вниз для закрытия» (grab + прокрутка сверху) =====
  App.attachSheetGestures = function attachSheetGestures(sheet, tabEl) {
    if (!sheet) return;
    const inner = sheet.querySelector(".inner") || sheet;

    let startY = 0, lastY = 0;
    let dragging = false;
    let startedOnGrab = false;

    const THRESHOLD = 80;   // тянуть больше — закрываем
    const MAX_PULL  = 140;  // максимум визуального смещения

    const begin = (y, fromGrab) => {
      startedOnGrab = !!fromGrab;
      if (!startedOnGrab && inner.scrollTop > 0) return; // контент прокручивается — не начинаем
      startY = lastY = y;
      dragging = true;
      sheet.classList.add("dragging");
      sheet.style.willChange = "transform";
    };

    const move = (y, e) => {
      if (!dragging) return;
      const dy = y - startY;
      if (dy <= 0 && !startedOnGrab) return; // вверх — игнор, если не с .grab
      const pull = Math.min(Math.max(dy, 0), MAX_PULL);
      if (e && e.cancelable) e.preventDefault();
      sheet.style.transform = `translateY(${pull}px)`;
    };

    const end = (y) => {
      if (!dragging) return;
      const dy = y - startY;
      sheet.classList.remove("dragging");
      sheet.style.transition = "transform .25s ease";
      if (dy > THRESHOLD) {
        if (App.haptics) App.haptics("light");
        App.closeSheet(sheet, tabEl);
      } else {
        sheet.style.transform = "";
      }
      setTimeout(() => {
        sheet.style.transition = "";
        sheet.style.willChange = "";
      }, 250);
      dragging = false;
      startedOnGrab = false;
    };

    // touch
    sheet.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      const isGrab = !!e.target.closest?.(".grab");
      if (isGrab || inner.scrollTop <= 0) begin(t.clientY, isGrab);
    }, { passive: true });

    sheet.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      lastY = t.clientY;
      move(lastY, e);
    }, { passive: false });

    sheet.addEventListener("touchend", () => end(lastY));

    // mouse (десктоп)
    sheet.addEventListener("mousedown", (e) => {
      const isGrab = !!e.target.closest?.(".grab");
      if (isGrab || inner.scrollTop <= 0) begin(e.clientY, isGrab);
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      lastY = e.clientY;
      move(lastY);
    });
    window.addEventListener("mouseup", () => end(lastY));

    // Клик по подложке — закрываем ТОЛЬКО если это был именно sheet,
    // и если не установлен «замок» (например, после нажатия на крестик превью).
    sheet.addEventListener("click", (e) => {
      if (e.target !== sheet) return;
      if (Date.now() < App._noBackdropCloseUntil) return;
      App.closeSheet(sheet, tabEl);
    });
  };

  // ----- Esc — закрыть все шиты -----
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") App.closeAllSheets();
  });

  // ===== Мобильные улучшения: Haptics + viewport-fix =====
  (function mobileEnhancements() {
    // :active на iOS + убираем 300мс лаг
    document.addEventListener("touchstart", () => {}, { passive: true });

    // точный vh для мобильных (используй var(--vh) при желании в CSS)
    function setVhVar() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    }
    setVhVar();
    window.addEventListener("resize", setVhVar);
    window.addEventListener("orientationchange", setVhVar);

    // HAPTICS
    App.haptics = function (style = "light") {
      try {
        const tg = window.Telegram?.WebApp;
        const h = tg?.HapticFeedback;
        if (h?.impactOccurred) {
          // light | medium | heavy | rigid | soft
          h.impactOccurred(style);
          return;
        }
      } catch (_) {}
      // Fallback
      if (navigator.vibrate) {
        const ms = style === "heavy" ? 25 : style === "medium" ? 15 : 8;
        navigator.vibrate(ms);
      }
    };

    // Хаптики на табы
    document.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab");
      if (!tab) return;
      App.haptics(tab.id === "tabAdd" ? "medium" : "light");
    });

    // Хаптики на избранное/пилюли
    document.addEventListener("click", (e) => {
      if (e.target.closest(".fav, .fav-btn, .pill")) App.haptics("light");
    });
  })();
})();
