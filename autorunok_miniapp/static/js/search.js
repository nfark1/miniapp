// ===== Поиск (bottom sheet) =====
(function () {
  const App = (window.App ||= {});

  const searchSheet   = document.getElementById("searchSheet");
  const qInput        = document.getElementById("q");
  const clearBtn      = document.getElementById("clearBtn");
  const resMeta       = document.getElementById("resMeta");
  const brandChipsBox = document.getElementById("brandChips");
  const tabSearch     = document.getElementById("tabSearch");

  if (!searchSheet || !tabSearch) return;

  // — Подключаем жесты один раз
  if (!App._searchGesturesAttached && typeof App.attachSheetGestures === "function") {
    App.attachSheetGestures(searchSheet, tabSearch);
    App._searchGesturesAttached = true;
  }

  // — Открыть/закрыть (toggle) по кнопке «Поиск»
  tabSearch.addEventListener("click", (e) => {
    e.preventDefault();

    if (typeof App.toggleSheet === "function") {
      App.toggleSheet(searchSheet, tabSearch);
    } else {
      // fallback
      const opened = searchSheet.classList.contains("show");
      searchSheet.classList.toggle("show", !opened);
      searchSheet.setAttribute("aria-hidden", opened ? "true" : "false");
      document.documentElement.classList.toggle("sheet-open", !opened);
      tabSearch.classList.toggle("active", !opened);
      tabSearch.setAttribute("aria-expanded", opened ? "false" : "true");
    }

    if (searchSheet.classList.contains("show")) {
      setTimeout(() => qInput?.focus(), 100);
      updateSearchMeta();
    }
  });

  // — Закрывать поиск при переходе на другие вкладки
  ["tabHome", "tabFav", "tabProfile", "tabAdd"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", () => {
      if (typeof App.closeSheet === "function") App.closeSheet(searchSheet, tabSearch);
      else {
        searchSheet.classList.remove("show");
        searchSheet.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("sheet-open");
        tabSearch.classList.remove("active");
        tabSearch.setAttribute("aria-expanded", "false");
      }
    });
  });

  // — ESC закрывает, если открыт
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchSheet.classList.contains("show")) {
      if (typeof App.closeSheet === "function") App.closeSheet(searchSheet, tabSearch);
      else {
        searchSheet.classList.remove("show");
        searchSheet.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("sheet-open");
        tabSearch.classList.remove("active");
        tabSearch.setAttribute("aria-expanded", "false");
      }
    }
  });

  // — Метка «Найдено: N»
  function updateSearchMeta() {
    if (!resMeta) return;
    const count = App.CUR_ITEMS?.length ?? 0;
    resMeta.textContent = `Найдено: ${count}`;
    if (clearBtn) {
      const hasQuery = !!(qInput?.value.trim());
      const hasBrand = !!App.BRAND_FILTER;
      clearBtn.style.display = (hasQuery || hasBrand) ? "inline-block" : "none";
    }
  }

  // — Применить фильтры
  function applySearch() {
    const q = (qInput?.value || "").trim().toLowerCase();
    let arr = (App.ALL_ITEMS || []).slice();

    if (App.BRAND_FILTER) {
      const bf = App.BRAND_FILTER.toLowerCase();
      arr = arr.filter((x) => (x.brand || "").toLowerCase() === bf);
    }
    if (q) {
      arr = arr.filter((x) =>
        `${x.brand || ""} ${x.model || ""} ${x.district || ""} ${x.desc || ""}`
          .toLowerCase()
          .includes(q)
      );
    }

    App.render(arr);
    App.CUR_ITEMS = arr; // подстраховка
    updateSearchMeta();
  }

  // — Очистка строки/бренда
  clearBtn?.addEventListener("click", () => {
    if (qInput) qInput.value = "";
    App.BRAND_FILTER = "";
    brandChipsBox?.querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
    applySearch();
    qInput?.focus();
  });

  // — Ввод с debounce
  qInput?.addEventListener("input", () => {
    clearTimeout(App._qTimer);
    App._qTimer = setTimeout(applySearch, 150);
  });

  // Экспорт
  App.applySearch = applySearch;
  App.updateSearchMeta = updateSearchMeta;

  // первичная мета (если лента уже есть)
  updateSearchMeta();
})();