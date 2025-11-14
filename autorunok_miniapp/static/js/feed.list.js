// ===== Лента (home list) + избранное + переключение вкладок =====
(function () {
  const App = window.App;

  // ===== Карточка объявления в общей ленте =====
  function card(it) {
    const a = App.el("a", "item");
    a.href = `/webapp/item/${it.id}`; // "настоящий" href, но мы его перехватываем
    a.dataset.id = it.id;

    const ph = App.el("div", "ph");
    if (it.photos?.[0]) ph.style.backgroundImage = `url('${it.photos[0]}')`;

    if (it.top) {
      const b = App.el("div", "badge");
      b.textContent = "ТОП";
      ph.appendChild(b);
    }
    if ((it.photos?.length || 0) > 1) {
      const c = App.el("div", "cam");
      c.textContent = `📷 ${it.photos.length}`;
      ph.appendChild(c);
    }

    const favBtn = App.el("button", "fav-btn stop");
    favBtn.type = "button";
    favBtn.dataset.id = it.id;
    favBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M12 21s-7-4.35-9.33-8.26C.9 9.58 2.9 6 6.24 6c2.02 0 3.22 1.2 3.76 2.06C10.78 7.2 11.98 6 14 6c3.34 0 5.34 3.58 3.57 6.74C19 16.65 12 21 12 21z"/>
      </svg>`;
    if (App.readFav().has(it.id)) favBtn.classList.add("on");
    ph.appendChild(favBtn);

    a.appendChild(ph);

    const cnt = App.el("div", "cnt");
    const ttl = App.el("div", "ttl");
    ttl.textContent = `${it.brand} ${it.model}, ${it.year}`;
    cnt.appendChild(ttl);

    const price = App.el("div", "price");
    price.textContent = `${App.fmt(it.price_rub)} ₽`;
    cnt.appendChild(price);

    const meta = App.el("div", "meta");
    meta.textContent = `📍 ${it.district || ""}`;
    cnt.appendChild(meta);

    a.appendChild(cnt);

    return a;
  }

  // ===== Бейдж счётчика избранного =====
  function updateFavBadge() {
    const fav = App.readFav();
    const n = fav.size;
    const tabFav = document.getElementById("tabFav");
    const badge = document.getElementById("favBadge");
    if (tabFav) tabFav.setAttribute("data-count", String(n));
    if (badge) badge.textContent = String(n);
  }

  // ===== Рендер списка =====
  function render(items) {
    App.CUR_ITEMS = items.slice();
    const feed = document.getElementById("feed");
    const empty = document.getElementById("empty");
    if (!feed || !empty) return;

    feed.innerHTML = "";
    if (!items.length) {
      empty.style.display = "block";
      updateFavBadge();
      App.updateSearchMeta?.();
      return;
    }
    empty.style.display = "none";
    items.forEach((it) => feed.appendChild(card(it)));
    updateFavBadge();
    App.updateSearchMeta?.();
  }

  // ===== Загрузка данных =====
  async function load() {
    const me = await App.apiMe().catch(() => null);
    App.ME = me || null;
    App.IS_ADMIN = !!(me && me.is_admin);

    const data = await App.apiListings();
    App.ALL_ITEMS = data.items || [];

    // "Мои объявления" (для профиля)
    let myData = null;
    if (typeof App.apiMyListings === "function") {
      myData = await App.apiMyListings().catch(() => null);
    }
    App.MY_ITEMS = (myData && myData.items) || [];

    // Чипы брендов
    const chipsBox = document.getElementById("brandChips");
    if (chipsBox && chipsBox.children.length === 0) {
      chipsBox.innerHTML = "";
      const s = new Set(App.ALL_ITEMS.map((x) => x.brand || "").filter(Boolean));
      ["Все", ...Array.from(s)].forEach((name) => {
        const c = App.el("button", "chip");
        c.textContent = name;
        c.dataset.brand = name === "Все" ? "" : name;
        c.onclick = () => {
          App.BRAND_FILTER = c.dataset.brand || "";
          chipsBox.querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
          c.classList.add("on");
          App.applySearch?.();
        };
        chipsBox.appendChild(c);
      });
    }

    const tabFav     = document.getElementById("tabFav");
    const tabHome    = document.getElementById("tabHome");
    const tabProfile = document.getElementById("tabProfile");

    const url = new URL(location.href);
    if (url.searchParams.get("profile") === "1") {
      App.VIEW_MODE = "profile";
      setActiveTab(tabProfile);
      App.renderProfile?.();
    } else if (url.searchParams.get("fav") === "1") {
      App.VIEW_MODE = "fav";
      setActiveTab(tabFav);
      const favOnly = App.ALL_ITEMS.filter(x => App.readFav().has(x.id));
      render(favOnly);
    } else {
      App.VIEW_MODE = "home";
      setActiveTab(tabHome);
      render(App.ALL_ITEMS);
    }
  }

  // ===== Переключение табов =====
  function setActiveTab(el) {
    document.querySelectorAll(".tabbar .tab").forEach(t => t.classList.remove("active"));
    el?.classList.add("active");
  }

  const tabHome    = document.getElementById("tabHome");
  const tabFav     = document.getElementById("tabFav");
  const tabProfile = document.getElementById("tabProfile");

  tabHome?.addEventListener("click", (e) => {
    if (location.pathname.startsWith("/webapp/")) {
      e.preventDefault();
      App.VIEW_MODE = "home";
      setActiveTab(tabHome);
      render(App.ALL_ITEMS || []);
      const url = new URL(location.href);
      url.searchParams.delete("fav");
      url.searchParams.delete("profile");
      history.replaceState(null, "", url);
    }
  });

  tabFav?.addEventListener("click", (e) => {
    e.preventDefault();
    App.VIEW_MODE = "fav";
    setActiveTab(tabFav);
    const favOnly = (App.ALL_ITEMS || []).filter(x => App.readFav().has(x.id));
    render(favOnly);
    const url = new URL(location.href);
    url.searchParams.set("fav", "1");
    url.searchParams.delete("profile");
    history.replaceState(null, "", url);
  });

  tabProfile?.addEventListener("click", (e) => {
    e.preventDefault();
    App.VIEW_MODE = "profile";
    setActiveTab(tabProfile);
    App.renderProfile?.();
    const url = new URL(location.href);
    url.searchParams.delete("fav");
    url.searchParams.set("profile", "1");
    history.replaceState(null, "", url);
  });

  // ===== Делегирование кликов =====
  document.addEventListener("click", (e) => {
    // 1) сердечко
    const favBtn = e.target.closest(".fav-btn");
    if (favBtn) {
      e.preventDefault();
      e.stopPropagation();

      const fav = App.readFav();
      const id = +favBtn.dataset.id;
      fav.has(id) ? fav.delete(id) : fav.add(id);
      App.writeFav(fav);

      favBtn.classList.toggle("on", fav.has(id));
      updateFavBadge();

      if (App.VIEW_MODE === "fav" && !fav.has(id)) {
        const favOnly = (App.ALL_ITEMS || []).filter(x => App.readFav().has(x.id));
        render(favOnly);
      }
      return;
    }

    // 2) клик по карточке объявления
    const link = e.target.closest("a.item");
    if (link) {
      e.preventDefault();
      const id = Number(link.dataset.id);
      if (!id) return;
      if (typeof App.openItemFromList === "function") {
        App.openItemFromList(id);
      } else {
        // запасной вариант — обычный переход
        location.href = link.href;
      }
    }
  });

  // ===== Безопасная загрузка =====
  async function safeLoad() {
    try {
      await load();
    } catch (e) {
      console.error("[feed] load error", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeLoad);
  } else {
    safeLoad();
  }

  window.addEventListener("focus", safeLoad);

  // экспорт в App
  App.render         = render;
  App.load           = safeLoad;
  App.updateFavBadge = updateFavBadge;
  App.setActiveTab   = setActiveTab;
})();