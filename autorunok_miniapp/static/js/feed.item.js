// ===== Детальный просмотр объявления =====
(function () {
  const App = window.App || (window.App = {});

  // рендер одной карточки в режиме просмотра
  function renderItemDetail(it) {
    const feed  = document.getElementById("feed");
    const empty = document.getElementById("empty");
    if (!feed || !empty) return;

    empty.style.display = "none";
    feed.innerHTML = "";

    const page = document.createElement("div");
    page.className = "item-page";

    // верхушка с кнопкой назад
    const top = document.createElement("div");
    top.className = "item-header";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn-back";
    backBtn.textContent = "← Назад";

    backBtn.onclick = () => {
      const prev = App.VIEW_MODE_BEFORE_ITEM || "home";
      const tabHome    = document.getElementById("tabHome");
      const tabFav     = document.getElementById("tabFav");
      const tabProfile = document.getElementById("tabProfile");

      if (prev === "fav") {
        App.VIEW_MODE = "fav";
        App.setActiveTab?.(tabFav);
        const favOnly = (App.ALL_ITEMS || []).filter(x => App.readFav().has(x.id));
        App.render?.(favOnly);
      } else if (prev === "profile" && typeof App.renderProfile === "function") {
        App.VIEW_MODE = "profile";
        App.setActiveTab?.(tabProfile);
        App.renderProfile();
      } else {
        App.VIEW_MODE = "home";
        App.setActiveTab?.(tabHome);
        App.render?.(App.ALL_ITEMS || []);
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

  // загрузка объявления по id
  async function openItemFromList(id) {
    try {
      // запоминаем, откуда пришли
      App.VIEW_MODE_BEFORE_ITEM = App.VIEW_MODE || "home";

      const r = await fetch(`/api/listing/${id}?t=${Date.now()}`);
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

  // экспорт в App
  App.renderItemDetail  = renderItemDetail;
  App.openItemFromList  = openItemFromList;
})();