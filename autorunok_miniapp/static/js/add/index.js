// /static/js/add/index.js — точка входа: toggle шита, подсказки, фото, валидация, отправка
import { ensureCatalogFromFeed, getCanonicalBrand, getAllBrandsDisplay, getModelsForBrand } from "./catalog.js";
import { makeSuggest, filterByPrefix } from "./suggest.js";
import { initPhotos, renderPreviews, getPickedFiles } from "./photos.js";
import { bindInlineClear, validate } from "./validate.js";
import { doSubmit } from "./submit.js";
import "./dnd.js";

// используем глобальный App из utils.js (не создаём новый)
const App = window.App || (window.App = {});
window.__addModuleReady = true;
console.log("[add] module loaded");

// безопасный запуск (если модуль вдруг подгрузится до DOM)
const start = () => {
  const $ = (id) => document.getElementById(id);

  const addSheet     = $("addSheet");
  const tabAdd       = $("tabAdd");
  const btnCancelAdd = $("btnCancelAdd");

  const addForm      = $("addForm");
  const f_brand      = $("f_brand");
  const f_model      = $("f_model");
  const f_year       = $("f_year");
  const f_price      = $("f_price");
  const f_district   = $("f_district");
  const f_desc       = $("f_desc");
  const f_files      = $("f_files");
  const pv           = $("pv");
  const btnSubmitAdd = $("btnSubmitAdd");
  const addNote      = $("addNote");

  if (!addSheet || !tabAdd) {
    console.warn("[add] sheet elements not found");
    return;
  }

  // ===== ФОТО: выбор/превью/удаление =====
  initPhotos({ f_files, pv });
  renderPreviews();

  // ===== Жесты (если подключены в utils.js) =====
  if (typeof App.attachSheetGestures === "function") {
    try { App.attachSheetGestures(addSheet, tabAdd); } catch(_){}
  }

  // ===== Подсказки (ленивая инициализация один раз) =====
  let brandSuggest = null;
  let modelSuggest = null;
  let suggestsInited = false;

  let lastCanonicalBrand = null;

function enableModelForBrand(brandInput) {
  const canonical = getCanonicalBrand(brandInput);

  // модель всегда активна — не блокируем произвольный ввод
  if (f_model) {
    f_model.disabled = false;

    // сбрасываем модель только если марка реально сменилась
    if (canonical !== lastCanonicalBrand) {
      // f_model.value = ""; // обычно не нужно, лучше НЕ сбрасывать
      lastCanonicalBrand = canonical;
    }
  }

  // подсказки для модели скрываем, если марка неизвестна
  if (modelSuggest && !canonical) modelSuggest.hide();
}

  function setupSuggestsOnce() {
    if (suggestsInited) return;
    suggestsInited = true;

    if (f_brand) {
      brandSuggest = makeSuggest(f_brand, (val) => {
        f_brand.value = val;
        enableModelForBrand(val);
        if (f_model && !f_model.disabled) setTimeout(() => f_model.focus(), 0);
      });
      const updBrand = () => {
        const list = filterByPrefix(getAllBrandsDisplay(), f_brand.value);
        if (f_brand.value && list.length) brandSuggest.show(list); else brandSuggest.hide();
        enableModelForBrand(f_brand.value);
      };
      f_brand.addEventListener("input", updBrand);
      f_brand.addEventListener("focus", updBrand);
      f_brand.addEventListener("blur", () => setTimeout(() => brandSuggest?.hide(), 120));
    }

    if (f_model) {
      modelSuggest = makeSuggest(f_model, (val) => { f_model.value = val; });
      const updModel = () => {
        const canonical = getCanonicalBrand(f_brand?.value);
        if (!canonical) return modelSuggest.hide();
        const models = Array.from(getModelsForBrand(canonical));
        const list   = filterByPrefix(models, f_model.value);
        if (f_model.value && list.length) modelSuggest.show(list); else modelSuggest.hide();
      };
      f_model.disabled = !getCanonicalBrand(f_brand?.value);
      f_model.addEventListener("input", updModel);
      f_model.addEventListener("focus", updModel);
      f_model.addEventListener("blur", () => setTimeout(() => modelSuggest?.hide(), 120));
    }

    enableModelForBrand(f_brand?.value);
  }

  // ===== Надёжный toggle шита =====
  function fallbackToggle() {
    const opened = addSheet.classList.contains("show");
    addSheet.classList.toggle("show", !opened);
    addSheet.setAttribute("aria-hidden", String(opened));
    document.documentElement.classList.toggle("sheet-open", !opened);
    tabAdd.classList.toggle("active", !opened);
    tabAdd.setAttribute("aria-expanded", opened ? "false" : "true");

    // ХОТФИКС: пробиваем трансформ, если вдруг не сбросился
    if (!opened) {
      const cs = getComputedStyle(addSheet);
      if (cs.transform && cs.transform !== "none" && cs.transform.includes("matrix")) {
        addSheet.style.transform = "translateY(0)";
        addSheet.style.pointerEvents = "auto";
      }
    }
  }

  function toggleAddSheet() {
    if (typeof App.toggleSheet === "function") {
      try { App.toggleSheet(addSheet, tabAdd); return; } catch(_){}
    }
    fallbackToggle();
  }

  // «+» — открыть/закрыть
  tabAdd.addEventListener("click", async (e) => {
    e.preventDefault(); e.stopPropagation();
    try { await ensureCatalogFromFeed(App); } catch {}
    setupSuggestsOnce();
    toggleAddSheet();
  });

  // «Отмена» — закрыть
  btnCancelAdd?.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof App.closeSheet === "function") {
      try { App.closeSheet(addSheet, tabAdd); return; } catch(_){}
    }
    if (addSheet.classList.contains("show")) fallbackToggle();
  });

  // Переход на другие вкладки — закрыть
  ["tabHome", "tabFav", "tabProfile", "tabSearch"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", () => {
      if (!addSheet.classList.contains("show")) return;
      if (typeof App.closeSheet === "function") {
        try { App.closeSheet(addSheet, tabAdd); return; } catch(_){}
      }
      fallbackToggle();
    });
  });

  // ===== Валидация/сабмит =====
  bindInlineClear([f_brand, f_model, f_year, f_price, f_district, f_desc, f_files]);

  const onSubmit = (e) => {
    e.preventDefault(); e.stopPropagation();
    const ok = validate(
      { f_brand, f_model, f_year, f_price, f_files },
      { getCanonicalBrand, getModelsForBrand },
      getPickedFiles().length,
      App.toast
    );
    if (!ok) return;
    doSubmit(App, { addSheet, tabAdd, addForm, f_brand, f_model, f_year, f_price, f_district, f_desc, btnSubmitAdd, addNote });
  };
  addForm?.addEventListener("submit", onSubmit);
  btnSubmitAdd?.addEventListener("click", onSubmit);

  // helpers для дебага в консоли
  window.__openAdd  = () => { setupSuggestsOnce(); if (!addSheet.classList.contains("show")) toggleAddSheet(); };
  window.__closeAdd = () => { if (addSheet.classList.contains("show")) toggleAddSheet(); };

  console.log("%c[add] готово: __openAdd(), __closeAdd()", "color:#22D3EE");
};

// запуск (если DOM уже готов — сразу, иначе после DOMContentLoaded)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}