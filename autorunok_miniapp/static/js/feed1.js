// ===== Лента (home list) + избранное + профиль + просмотр объявления =====
(function () {
  const App = window.App;

  // ===== Карточка объявления в общей ленте =====
  function card(it) {
    const a = App.el("a", "item");
    // не переходим на отдельную страницу
    a.href = "javascript:void(0)";
    a.dataset.id = it.id; // 👈 чтобы потом достать id из делегированного клика

    const ph = App.el("div", "ph");
    if (it.photos?.[0]) ph.style.backgroundImage = `url('${it.photos[0]}')`;

    // ТОП значок
    if (it.top) {
      const b = App.el("div", "badge");
      b.textContent = "ТОП";
      ph.appendChild(b);
    }
    // Кол-во фото
    if ((it.photos?.length || 0) > 1) {
      const c = App.el("div", "cam");
      c.textContent = `📷 ${it.photos.length}`;
      ph.appendChild(c);
    }

    // Сердечко-оверлей
    const favBtn = App.el("button", "fav-btn stop");
    favBtn.type = "button";
    favBtn.dataset.id = it.id;
    favBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M12 21s-7-4.35-9.33-8.26C.9 9.58 2.9 6 6.24 6c2.02 0 3.22 1.2 3.76 2.06C10.78 7.2 11.98 6 14 6c3.34 0 5.34 3.58 3.57 6.74C19 16.65 12 21 12 21z"/>
      </svg>`;
    if (App.readFav().has(it.id)) favBtn.classList.add("on");
    // чтобы клик по сердечку НЕ открывал карточку
    favBtn.addEventListener("click", (e) => e.stopPropagation());
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

  // ===== Бейдж счётчика избранного в таббаре =====
  function updateFavBadge() {
    const fav = App.readFav();
    const n = fav.size;
    const tabFav = document.getElementById("tabFav");
    const badge = document.getElementById("favBadge");
    if (tabFav) tabFav.setAttribute("data-count", String(n));
    if (badge) badge.textContent = String(n);
  }

  // ===== Рендер обычной ленты =====
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

  // ===== Карточка объявления в профиле (со статусом и кнопками) =====
  // ===== Карточка объявления в профиле (со статусом и кнопками) =====
  function renderMyAdCard(it) {
    const card = document.createElement("div");
    card.className = "my-ad-card";

    const main = document.createElement("div");
    main.className = "my-ad-main";

    const ph = document.createElement("div");
    ph.className = "my-ad-photo";
    if (it.photos && it.photos[0]) {
      ph.style.backgroundImage = `url('${it.photos[0]}')`;
    }

    const body = document.createElement("div");
    body.className = "my-ad-body";

    const title = document.createElement("div");
    title.className = "my-ad-title";
    title.textContent = `${it.brand || ""} ${it.model || ""}, ${it.year || ""}`.trim();

    const price = document.createElement("div");
    price.className = "my-ad-price";
    if (it.price_rub) {
      price.textContent = `${App.fmt(it.price_rub)} ₽`;
    }

    const meta = document.createElement("div");
    meta.className = "my-ad-meta";
    meta.textContent = `📍 ${it.district || "Не указан район"}`;

    body.appendChild(title);
    body.appendChild(price);
    body.appendChild(meta);

    // ---------- статус ----------
    let stRaw = (it.status || "").toString().toUpperCase();
    // чтобы APPROVED и ACTIVE обрабатывались одинаково
    let st = stRaw === "APPROVED" ? "ACTIVE" : stRaw;

    if (st) {
      const badge = document.createElement("div");
      badge.className = "status-badge";

      let cls  = "status-active";
      let text = "Активно";

      if (st === "PENDING" || st === "MODERATION") {
        cls  = "status-pending";
        text = "На модерации";
      } else if (st === "REJECTED") {
        cls  = "status-rejected";
        text = "Отклонено";
      } else if (st === "HIDDEN") {
        cls  = "status-hidden";
        text = "Скрыто";
      } else if (st === "ACTIVE") {
        cls  = "status-active";
        text = "Активно";
      }

      badge.classList.add(cls);
      badge.textContent = text;
      body.appendChild(badge);
    }

    main.appendChild(ph);
    main.appendChild(body);
    card.appendChild(main);

    // ---------- нижние кнопки ----------
    const actions = document.createElement("div");
    actions.className = "my-ad-actions";

    // Редактировать (оставляем, потом допилим)
    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "btn-link";
    btnEdit.textContent = "Редактировать";
    actions.appendChild(btnEdit);

    // Снять с продажи — только для активных и на модерации
    if (st === "ACTIVE" || st === "PENDING" || st === "MODERATION") {
      const btnHide = document.createElement("button");
      btnHide.type = "button";
      btnHide.className = "btn-link danger";
      btnHide.textContent = "Снять с продажи";

      btnHide.onclick = () => {
        if (!confirm("Снять объявление с продажи?")) return;
        fetch("/api/my_hide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: it.id })
        })
          .then(r => r.json())
          .then(data => {
            if (data.ok) {
              App.toast("Снято с продажи");
              App.load();
            } else {
              alert("Ошибка: " + data.error);
            }
          })
          .catch(err => {
            console.error(err);
            alert("Ошибка сети");
          });
      };

      actions.appendChild(btnHide);
    }

    // Отправить на модерацию — только для скрытых / отклонённых
    if (st === "HIDDEN" || st === "REJECTED") {
      const btnResubmit = document.createElement("button");
      btnResubmit.type = "button";
      btnResubmit.className = "btn-link";
      btnResubmit.textContent = "Отправить на модерацию";

      btnResubmit.onclick = () => {
        if (!confirm("Отправить объявление на модерацию?")) return;
        fetch("/api/my_resubmit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: it.id })
        })
          .then(r => r.json())
          .then(data => {
            if (data.ok) {
              App.toast("Отправлено на модерацию");
              App.load();
            } else {
              alert("Ошибка: " + data.error);
            }
          })
          .catch(err => {
            console.error(err);
            alert("Ошибка сети");
          });
      };

      actions.appendChild(btnResubmit);
    }

    // Удалить — всегда
    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn-link danger";
    btnDelete.textContent = "Удалить";

    btnDelete.onclick = () => {
      if (!confirm("Удалить объявление навсегда?")) return;
      fetch("/api/my_delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: it.id })
      })
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            App.toast("Удалено");
            App.load();
          } else {
            alert("Ошибка: " + data.error);
          }
        })
        .catch(err => {
          console.error(err);
          alert("Ошибка сети");
        });
    };

    actions.appendChild(btnDelete);
    card.appendChild(actions);

    return card;
  }

  // ===== Рендер профиля =====
  function renderProfile() {
    const feed = document.getElementById("feed");
    const empty = document.getElementById("empty");
    if (!feed || !empty) return;

    empty.style.display = "none";
    feed.innerHTML = "";

    const me = App.ME || {};
    const myItems = App.MY_ITEMS || [];

    const name = me.first_name && me.last_name
      ? `${me.first_name} ${me.last_name}`
      : (me.first_name || "Пользователь Telegram");
    const username = me.username ? `@${me.username}` : "без username";
    const initial = (name || "?").trim()[0]?.toUpperCase() || "?";

    const norm = (s) => String(s || "").toUpperCase();

    const total   = myItems.length;
    const active  = myItems.filter(x => {
      const st = norm(x.status);
      return st === "APPROVED" || st === "ACTIVE";
    }).length;
    const pending = myItems.filter(x => {
      const st = norm(x.status);
      return st === "PENDING" || st === "MODERATION";
    }).length;
    const hidden  = myItems.filter(x => norm(x.status) === "HIDDEN").length;

    const page = document.createElement("div");
    page.className = "profile-page";

    // шапка профиля
    const head = document.createElement("div");
    head.className = "profile-header";

    const av = document.createElement("div");
    av.className = "profile-avatar";
    av.textContent = initial;

    const info = document.createElement("div");
    info.className = "profile-info";

    const nameEl = document.createElement("div");
    nameEl.className = "profile-name";
    nameEl.textContent = name;

    const userEl = document.createElement("div");
    userEl.className = "profile-username";
    userEl.textContent = username;

    info.appendChild(nameEl);
    info.appendChild(userEl);
    head.appendChild(av);
    head.appendChild(info);

    // статистика
    const statsWrap = document.createElement("div");
    statsWrap.className = "profile-stats";

    const mkStat = (value, label) => {
      const box = document.createElement("div");
      box.className = "profile-stat";
      const v = document.createElement("div");
      v.className = "profile-stat-value";
      v.textContent = String(value);
      const l = document.createElement("div");
      l.className = "profile-stat-label";
      l.textContent = label;
      box.appendChild(v);
      box.appendChild(l);
      return box;
    };

    statsWrap.appendChild(mkStat(total,   "Всего объявлений"));
    statsWrap.appendChild(mkStat(active,  "Активные"));
    statsWrap.appendChild(mkStat(pending, "На модерации"));
    statsWrap.appendChild(mkStat(hidden,  "Скрытые"));

    const title = document.createElement("div");
    title.className = "profile-section-title";
    title.textContent = "Мои объявления";

    page.appendChild(head);
    page.appendChild(statsWrap);
    page.appendChild(title);

    if (!myItems.length) {
      const emptyBox = document.createElement("div");
      emptyBox.className = "profile-empty";
      emptyBox.textContent = "Вы ещё не подали ни одного объявления.";
      page.appendChild(emptyBox);
    } else {
      myItems.forEach((it) => {
        page.appendChild(renderMyAdCard(it));
      });
    }

    feed.appendChild(page);
  }

  // ===== Детальный просмотр объявления =====
  function renderItemDetail(it) {
    const feed  = document.getElementById("feed");
    const empty = document.getElementById("empty");
    if (!feed || !empty) return;

    empty.style.display = "none";
    feed.innerHTML = "";

    const page = document.createElement("div");
    page.className = "item-page";

    const top = document.createElement("div");
    top.className = "item-header";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn-back";
    backBtn.textContent = "← Назад";

    backBtn.onclick = () => {
      const prev = App.PREV_VIEW || "home";
      const tabHome    = document.getElementById("tabHome");
      const tabFav     = document.getElementById("tabFav");
      const tabProfile = document.getElementById("tabProfile");

      if (prev === "fav") {
        App.VIEW_MODE = "fav";
        setActiveTab(tabFav);
        const favOnly = App.ALL_ITEMS.filter(x => App.readFav().has(x.id));
        render(favOnly);
      } else if (prev === "profile") {
        App.VIEW_MODE = "profile";
        setActiveTab(tabProfile);
        renderProfile();
      } else {
        App.VIEW_MODE = "home";
        setActiveTab(tabHome);
        render(App.ALL_ITEMS);
      }
    };

    const ttl = document.createElement("div");
    ttl.className = "item-title";
    ttl.textContent = `${it.brand || ""} ${it.model || ""}, ${it.year || ""}`.trim();

    top.appendChild(backBtn);
    top.appendChild(ttl);

    const photo = document.createElement("div");
    photo.className = "item-photo";
    if (it.photos?.[0]) photo.style.backgroundImage = `url('${it.photos[0]}')`;

    const price = document.createElement("div");
    price.className = "item-price";
    if (it.price_rub) price.textContent = `${App.fmt(it.price_rub)} ₽`;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = `📍 ${it.district || "Район не указан"}`;

    const desc = document.createElement("div");
    desc.className = "item-desc";
    desc.textContent = it.desc || "Без описания";

    const owner = document.createElement("div");
    owner.className = "item-owner";
    if (it.owner_username) {
      owner.innerHTML = `Продавец: <b>@${it.owner_username}</b>`;
    } else {
      owner.textContent = "Продавец: пользователь Telegram";
    }

    page.appendChild(top);
    page.appendChild(photo);
    page.appendChild(price);
    page.appendChild(meta);
    page.appendChild(desc);
    page.appendChild(owner);

    feed.appendChild(page);
  }

  async function openItemFromList(id) {
    try {
      App.PREV_VIEW = App.VIEW_MODE || "home";
      const r = await fetch(`/api/listing/${id}?${App.bust()}`, App.noStore);
      const data = await r.json();
      if (!r.ok || !data.ok) {
        App.toast?.("Ошибка загрузки объявления");
        console.error("item error", data);
        return;
      }
      App.VIEW_MODE = "item";
      renderItemDetail(data.item);
    } catch (e) {
      console.error(e);
      App.toast?.("Ошибка сети");
    }
  }

  // ===== Загрузка данных =====
  async function load() {
    const me = await App.apiMe().catch(() => null);
    App.ME = me || null;
    App.IS_ADMIN = !!(me && me.is_admin);

    const data = await App.apiListings();
    App.ALL_ITEMS = data.items || [];

    let myData = null;
    if (typeof App.apiMyListings === "function") {
      myData = await App.apiMyListings().catch(() => null);
    }
    App.MY_ITEMS = (myData && myData.items) || [];

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
      renderProfile();
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
      render(App.ALL_ITEMS);
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
    const favOnly = App.ALL_ITEMS.filter(x => App.readFav().has(x.id));
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
    renderProfile();
    const url = new URL(location.href);
    url.searchParams.delete("fav");
    url.searchParams.set("profile", "1");
    history.replaceState(null, "", url);
  });

  // ===== Делегирование кликов =====
  document.addEventListener("click", (e) => {
    // 1) сердечко избранного
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
        const favOnly = App.ALL_ITEMS.filter(x => App.readFav().has(x.id));
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
      openItemFromList(id);
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

  // Экспорт в App
  App.render          = render;
  App.load            = safeLoad;
  App.updateFavBadge  = updateFavBadge;
  App.renderProfile   = renderProfile;
})();