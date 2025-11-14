// ===== Профиль + "Мои объявления" =====
(function () {
  const App = window.App || (window.App = {});

  // --- одна карточка "моего" объявления ---
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
    // APPROVED считаем как ACTIVE
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

    // Редактировать
    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "btn-link";
    btnEdit.textContent = "Редактировать";

    btnEdit.onclick = () => {
      // включаем режим редактирования
      App.EDIT_MODE = true;
      App.EDIT_ID = it.id;

      // список старых фото (что сейчас в объявлении)
      App.EDIT_KEEP_PHOTOS = Array.isArray(it.photos) ? it.photos.slice() : [];

      // открыть форму добавления/редактирования
      const tabAdd = document.getElementById("tabAdd");
      if (tabAdd) {
        tabAdd.click();
      }

      setTimeout(() => {
        const fBrand    = document.getElementById("f_brand");
        const fModel    = document.getElementById("f_model");
        const fYear     = document.getElementById("f_year");
        const fPrice    = document.getElementById("f_price");
        const fDistrict = document.getElementById("f_district");
        const fDesc     = document.getElementById("f_desc");
        const btnSubmit = document.getElementById("btnSubmitAdd");
        const note      = document.getElementById("addNote");
        const pv        = document.getElementById("pv");
        const counter   = document.getElementById("photosCount");

        if (fBrand)    fBrand.value    = it.brand    || "";
        if (fModel)    fModel.value    = it.model    || "";
        if (fYear)     fYear.value     = it.year     || "";
        if (fPrice)    fPrice.value    = it.price_rub || "";
        if (fDistrict) fDistrict.value = it.district || "";
        if (fDesc)     fDesc.value     = it.desc     || "";

        if (btnSubmit) btnSubmit.textContent = "Сохранить";
        if (note)      note.textContent = "После редактирования объявление уйдёт на модерацию.";

        // ===== превью СТАРЫХ фото =====
        if (pv) {
          pv.innerHTML = "";

          (App.EDIT_KEEP_PHOTOS || []).forEach((url) => {
            const box = document.createElement("div");
            box.className = "thumb existing";   // важно: .thumb + .existing
            box.style.backgroundImage = `url('${url}')`;
            box.dataset.url = url;              // важно: сюда кладём путь /uploads/...

            const del = document.createElement("button");
            del.type = "button";
            del.className = "x";                // такая же кнопка, как у новых превью
            del.textContent = "✕";

            box.appendChild(del);
            pv.appendChild(box);
          });
        }

        if (counter) {
          const keepCount = Array.isArray(App.EDIT_KEEP_PHOTOS)
            ? App.EDIT_KEEP_PHOTOS.length
            : 0;
          counter.textContent = String(keepCount);
        }
      }, 0);
    };

    actions.appendChild(btnEdit);

    // Снять с продажи — только для ACTIVE / PENDING / MODERATION
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
              App.toast?.("Снято с продажи");
              App.load?.();
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

    // Отправить на модерацию — только для HIDDEN / REJECTED
    if (st === "HIDDEN" || st === "REJECTED") {
      const btnResubmit = document.createElement("button");
      btnResubmit.type = "button";
      btnResubmit.className = "btn-link";
      btnResubmit.textContent = "Отправить на модерацию";

      btnResubmit.onclick = () => {
        if (!confirm("Отправить объявление на модерацию?")) return;
        fetch("/api/my_republish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: it.id })
        })
          .then(r => r.json())
          .then(data => {
            if (data.ok) {
              App.toast?.("Отправлено на модерацию");
              App.load?.();
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
            App.toast?.("Удалено");
            App.load?.();
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

  // --- рендер страницы профиля ---
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

  // экспорт
  App.renderProfile   = renderProfile;
  App.renderMyAdCard  = renderMyAdCard;
})();