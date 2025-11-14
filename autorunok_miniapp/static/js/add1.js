// ===== Добавление объявления (bottom sheet) + автоподсказки с памятью, валидация и отправка =====
(function () {
  const App = (window.App ||= {});

  const addSheet      = document.getElementById("addSheet");
  const tabAdd        = document.getElementById("tabAdd");
  const btnCancelAdd  = document.getElementById("btnCancelAdd");

  const addForm       = document.getElementById("addForm");
  const f_brand       = document.getElementById("f_brand");
  const f_model       = document.getElementById("f_model");
  const f_year        = document.getElementById("f_year");
  const f_price       = document.getElementById("f_price");
  const f_district    = document.getElementById("f_district");
  const f_desc        = document.getElementById("f_desc");
  const f_files       = document.getElementById("f_files");
  const pv            = document.getElementById("pv");

  const btnSubmitAdd  = document.getElementById("btnSubmitAdd");
  const addNote       = document.getElementById("addNote");
  const toastEl       = document.getElementById("toast");

  if (!addSheet || !tabAdd) return;

  // Жесты шита
  if (typeof App.attachSheetGestures === "function") {
    App.attachSheetGestures(addSheet, tabAdd);
  }

  // ---------- ПАМЯТЬ марок/моделей в localStorage ----------
  // Храним в виде объекта: { "Toyota": ["Camry","RAV4"], "BMW": ["320i"] }
  const LS_KEY = "catalog_brand_models_v1";

  function lsLoadCatalogObj() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") return obj;
    } catch (_) {}
    return {};
  }
  function lsSaveCatalogObj(obj) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch(_) {}
  }
  function lsAddBrandModel(brand, model) {
    if (!brand) return;
    const bDisp = String(brand).trim();
    const mDisp = String(model || "").trim();
    if (!bDisp) return;

    const obj = lsLoadCatalogObj();
    if (!Array.isArray(obj[bDisp])) obj[bDisp] = [];
    if (mDisp && !obj[bDisp].includes(mDisp)) obj[bDisp].push(mDisp);
    lsSaveCatalogObj(obj);
  }

  // ---------- Каталог (регистронезависимо) из: localStorage + App.ALL_ITEMS ----------
  // displayBrand -> Set(models)
  let brandToModels = null;
  // lcBrand -> displayBrand
  let brandAlias = null;

  function buildIndexFromLS() {
    const lsObj = lsLoadCatalogObj();
    for (const bDisp of Object.keys(lsObj)) {
      const key = bDisp.toLowerCase();
      const display = brandAlias.get(key) || bDisp;
      brandAlias.set(key, display);
      if (!brandToModels.has(display)) brandToModels.set(display, new Set());
      const arr = Array.isArray(lsObj[bDisp]) ? lsObj[bDisp] : [];
      for (const m of arr) if (m) brandToModels.get(display).add(String(m).trim());
    }
  }
  function buildIndexFromItems(items) {
    (items || []).forEach(item => {
      const bDisp = String(item.brand || "").trim();
      const mDisp = String(item.model || "").trim();
      if (!bDisp) return;
      const key = bDisp.toLowerCase();
      const display = brandAlias.get(key) || bDisp;
      brandAlias.set(key, display);
      if (!brandToModels.has(display)) brandToModels.set(display, new Set());
      if (mDisp) brandToModels.get(display).add(mDisp);
    });
  }

  async function ensureCatalogIndex() {
    if (brandToModels && brandAlias) return;

    brandToModels = new Map();
    brandAlias    = new Map();

    // 1) Память из localStorage (приоритетная база)
    buildIndexFromLS();

    // 2) Подмешиваем уже размещённые объявления
    if (!App.ALL_ITEMS || !App.ALL_ITEMS.length) {
      try {
        const data = await App.apiListings?.();
        if (data?.items) App.ALL_ITEMS = data.items;
      } catch {}
    }
    buildIndexFromItems(App.ALL_ITEMS || []);
  }

  const getCanonicalBrand = (input) =>
    input ? (brandAlias.get(String(input).trim().toLowerCase()) || null) : null;

  const getAllBrandsDisplay = () => Array.from(brandToModels?.keys() || []);

  // ---------- Выпадающие подсказки ----------
  function makeSuggest(forInput) {
    const wrap = forInput.closest(".inp") || forInput.parentElement || forInput;
    let box = wrap.querySelector(".suggest");
    if (!box) {
      box = document.createElement("div");
      box.className = "suggest hidden";
      wrap.appendChild(box);
    }
    let activeIdx = -1;

    const hide = () => {
      box.classList.add("hidden");
      box.innerHTML = "";
      activeIdx = -1;
    };
    const show = (list) => {
      if (!list || !list.length) return hide();
      box.innerHTML = "";
      list.forEach((txt) => {
        const it = document.createElement("div");
        it.className = "suggest-item";
        it.textContent = txt;
        it.dataset.value = txt;
        it.addEventListener("mousedown", (e) => {
          e.preventDefault(); // чтобы blur не закрыл раньше
          applyValue(txt);
        });
        box.appendChild(it);
      });
      box.classList.remove("hidden");
      activeIdx = -1;
    };
    const move = (delta) => {
      const items = Array.from(box.querySelectorAll(".suggest-item"));
      if (!items.length) return;
      activeIdx = activeIdx === -1 ? (delta > 0 ? 0 : items.length - 1)
                                   : (activeIdx + delta + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle("active", i === activeIdx));
      const cur = items[activeIdx];
      if (cur) {
        const cTop = cur.offsetTop, cBot = cTop + cur.offsetHeight;
        const vTop = box.scrollTop, vBot = vTop + box.clientHeight;
        if (cTop < vTop) box.scrollTop = cTop;
        else if (cBot > vBot) box.scrollTop = cBot - box.clientHeight;
      }
    };
    const applyActive = () => {
      const el = box.querySelector(".suggest-item.active");
      if (el) applyValue(el.dataset.value || el.textContent || "");
    };
    const applyValue = (val) => {
      forInput.value = val;
      hide();
      forInput.dispatchEvent(new Event("input", { bubbles: true }));
      forInput.dispatchEvent(new Event("change", { bubbles: true }));
      if (forInput === f_brand) {
        enableModelForBrand(val);
        if (f_model && !f_model.disabled) setTimeout(() => f_model.focus(), 0);
      }
    };

    document.addEventListener("click", (e) => {
      if (!box.contains(e.target) && e.target !== forInput) hide();
    });
    forInput.addEventListener("keydown", (e) => {
      if (box.classList.contains("hidden")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); move(+1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter")   { e.preventDefault(); applyActive(); }
      else if (e.key === "Escape")  { e.preventDefault(); hide(); }
    });

    return { show, hide };
  }

  let brandSuggest, modelSuggest;

  const filterByPrefix = (src, query) => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    const arr = Array.isArray(src) ? src : Array.from(src || []);
    const starts = [], contains = [];
    for (const s of arr) {
      const v = String(s || "").toLowerCase();
      if (!v) continue;
      if (v.startsWith(q)) starts.push(s);
      else if (v.includes(q)) contains.push(s);
    }
    return [...starts, ...contains].slice(0, 30);
  };

  function enableModelForBrand(brandInput) {
    const hasAnyBrand = !!String(brandInput || "").trim();
    if (f_model) {
      f_model.value = "";
      f_model.disabled = !hasAnyBrand;   // <-- разрешаем модель для любой непустой марки
    }
    if (!modelSuggest) return;
    const canonical = getCanonicalBrand(brandInput);
    if (!canonical) modelSuggest.hide(); // нет канона — просто скрываем подсказки
  }

  // ---------- Открыть/закрыть (toggle) ----------
  tabAdd.addEventListener("click", async (e) => {
    e.preventDefault();
    await ensureCatalogIndex();

    if (typeof App.toggleSheet === "function") {
      App.toggleSheet(addSheet, tabAdd);
    } else {
      const opened = addSheet.classList.contains("show");
      addSheet.classList.toggle("show", !opened);
      addSheet.setAttribute("aria-hidden", String(opened));
      document.documentElement.classList.toggle("sheet-open", !opened);
      tabAdd.classList.toggle("active", !opened);
      tabAdd.setAttribute("aria-expanded", opened ? "false" : "true");
    }

    if (!brandSuggest && f_brand) {
      brandSuggest = makeSuggest(f_brand);
      f_brand.addEventListener("input", () => {
        const list = filterByPrefix(getAllBrandsDisplay(), f_brand.value);
        if (f_brand.value && list.length) brandSuggest.show(list); else brandSuggest.hide();
        enableModelForBrand(f_brand.value);
      });
      f_brand.addEventListener("focus", () => {
        const list = filterByPrefix(getAllBrandsDisplay(), f_brand.value);
        if (f_brand.value && list.length) brandSuggest.show(list);
      });
      f_brand.addEventListener("blur", () => setTimeout(() => brandSuggest?.hide(), 120));
    }

    if (!modelSuggest && f_model) {
      modelSuggest = makeSuggest(f_model);

      // раньше было: f_model.disabled = !getCanonicalBrand(f_brand?.value);
      // теперь разрешаем ввод модели, если марка непустая
      f_model.disabled = !(f_brand?.value && f_brand.value.trim());

      f_model.addEventListener("input", () => {
        const canonical = getCanonicalBrand(f_brand?.value);
        if (!canonical) { 
          // новая марка: подсказок нет, но ввод не блокируем
          modelSuggest.hide();
          return;
        }
        const models = Array.from(brandToModels.get(canonical) || []);
        const list = filterByPrefix(models, f_model.value);
        if (f_model.value && list.length) modelSuggest.show(list); else modelSuggest.hide();
      });

      f_model.addEventListener("focus", () => {
        const canonical = getCanonicalBrand(f_brand?.value);
        if (!canonical) { modelSuggest.hide(); return; }
        const models = Array.from(brandToModels.get(canonical) || []);
        const list = filterByPrefix(models, f_model.value);
        if (f_model.value && list.length) modelSuggest.show(list);
      });

      f_model.addEventListener("blur", () => setTimeout(() => modelSuggest?.hide(), 120));
    }

    enableModelForBrand(f_brand?.value);
  });

  // Закрыть по «Отмена»
  btnCancelAdd?.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof App.closeSheet === "function") App.closeSheet(addSheet, tabAdd);
    else {
      addSheet.classList.remove("show");
      addSheet.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("sheet-open");
      tabAdd.classList.remove("active");
      tabAdd.setAttribute("aria-expanded", "false");
    }
  });

  // Закрывать при переходе на другие вкладки
  ["tabHome", "tabFav", "tabProfile", "tabSearch"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", () => {
      if (typeof App.closeSheet === "function") App.closeSheet(addSheet, tabAdd);
      else {
        addSheet.classList.remove("show");
        addSheet.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("sheet-open");
        tabAdd.classList.remove("active");
        tabAdd.setAttribute("aria-expanded", "false");
      }
    });
  });

  // ---------- Валидация/превью/отправка ----------
  let pickedFiles = [];

  const fieldWrap = (input) => input?.closest(".inp") || input?.parentElement;
  function clearError(input) {
    input?.classList.remove("invalid");
    const w = fieldWrap(input);
    const err = w?.querySelector(".err");
    if (err) err.remove();
  }
  function showError(input, msg) {
    clearError(input);
    if (!input) return;
    input.classList.add("invalid");
    const w = fieldWrap(input);
    const e = document.createElement("div");
    e.className = "err";
    e.textContent = msg;
    w?.appendChild(e);
    w?.classList.add("shake");
    setTimeout(() => w?.classList.remove("shake"), 320);
  }
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  // счётчик фото (если у тебя есть <span id="photosCount">)
  function updatePhotosCount() {
    const el = document.getElementById("photosCount");
    if (el) el.textContent = String(pickedFiles.length);
  }

  [f_brand, f_model, f_year, f_price, f_district, f_desc, f_files].forEach((inp) => {
    inp?.addEventListener("input", () => clearError(inp));
    inp?.addEventListener("change", () => clearError(inp));
  });

  function syncFilesInput() {
    try {
      const dt = new DataTransfer();
      pickedFiles.slice(0, 10).forEach((f) => dt.items.add(f));
      if (f_files) f_files.files = dt.files;
    } catch {}
    updatePhotosCount();
  }

  // Превью + удаление через делегирование
  function renderPreviews() {
    if (!pv) return;
    pv.innerHTML = "";
    pickedFiles.forEach((file, idx) => {
      const t = document.createElement("div");
      t.className = "thumb";
      const url = URL.createObjectURL(file);
      t.style.backgroundImage = `url('${url}')`;
      t.dataset.url = url;

      const del = document.createElement("button");
      del.className = "x";
      del.type = "button";
      del.dataset.idx = String(idx);
      del.textContent = "✕";

      t.appendChild(del);
      pv.appendChild(t);
    });
    updatePhotosCount();
  }

  // Делегирование: один обработчик на контейнер превью
  pv?.addEventListener("click", (e) => {
    const btn = e.target.closest(".x");
    if (!btn) { e.stopPropagation(); return; }
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    const idx = Number(btn.dataset.idx);
    const thumb = btn.closest(".thumb");
    const url = thumb?.dataset.url;

    if (!Number.isNaN(idx)) {
      pickedFiles.splice(idx, 1);
      syncFilesInput();
      renderPreviews();
    }
    if (url) URL.revokeObjectURL(url);
  });
  pv?.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  pv?.addEventListener("touchmove",  (e) => e.stopPropagation(), { passive: true });

  f_files?.addEventListener("change", (e) => {
    clearError(f_files);
    const list = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    pickedFiles = [...pickedFiles, ...list].slice(0, 10);
    syncFilesInput();
    renderPreviews();
  });

  function validateDetailed() {
    let first = null;

    // Марка
    const brandInput = f_brand?.value.trim();
    if (!brandInput) { showError(f_brand, "Укажи марку"); first = first || f_brand; }
    else {
      const canonicalB = getCanonicalBrand(brandInput);
      // Разрешаем новые бренды — просто не будет канона => подсказки допишем в LS на сабмите
      clearError(f_brand);
    }

    // Модель
    const modelInput = f_model?.value.trim();
    if (!modelInput) { showError(f_model, "Укажи модель"); first = first || f_model; }
    else clearError(f_model);

    // Год
    const y = parseInt(f_year?.value, 10);
    if (!y || y < 1950 || y > 2100) { showError(f_year, "Проверь год (1950–2100)"); first = first || f_year; }
    else clearError(f_year);

    // Цена
    const p = parseInt(f_price?.value, 10);
    if (!p || p < 0) { showError(f_price, "Укажи цену в ₽"); first = first || f_price; }
    else clearError(f_price);

    // Фото
    if (pickedFiles.length === 0) { showError(f_files, "Добавь хотя бы 1 фото"); first = first || f_files; }
    else clearError(f_files);

    if (first) {
      first.focus({ preventScroll: false });
      toast("Исправь выделенные поля");
      return false;
    }
    return true;
  }

  async function doSubmit() {
    if (!validateDetailed()) return;
    if (!btnSubmitAdd || btnSubmitAdd.disabled) return;

    btnSubmitAdd.disabled = true;
    const prev = btnSubmitAdd.textContent;
    btnSubmitAdd.textContent = "Отправка…";
    if (addNote) addNote.textContent = "Файлы загружаются…";

    // Канонизируем бренд: если есть в индексе — используем отображаемое имя, иначе — как ввёл юзер
    const inputBrand = f_brand.value.trim();
    const canonical = getCanonicalBrand(inputBrand) || inputBrand;

    const fd = new FormData();
    fd.append("brand",     canonical);
    fd.append("model",     f_model.value.trim());
    fd.append("year",      String(parseInt(f_year.value, 10)));
    fd.append("price_rub", String(parseInt(f_price.value, 10)));
    fd.append("district",  f_district.value.trim());
    fd.append("desc",      f_desc.value.trim());
    pickedFiles.slice(0, 10).forEach((f) => fd.append("photos", f, f.name));

    const send = () => fetch(`/api/listings_upload?${Date.now()}`, {
      method: "POST", credentials: "include", body: fd
    });

    try {
      let r = await send();
      if (r.status === 401) {
        await fetch(`/api/dev_login?tg_id=415254917&username=nfark&first_name=%D0%9D%D0%B8%D0%BA%D0%B8%D1%82%D0%B0&is_admin=1`,
          { credentials: "include" });
        r = await send();
      }
      const raw = await r.text();
      let js = null; try { js = JSON.parse(raw); } catch {}

      if (!r.ok) {
        if (r.status === 413) throw new Error("Фото слишком большие — попробуй меньше/меньше штук");
        throw new Error((js && (js.error || js.message)) || raw || `HTTP ${r.status}`);
      }

      // === УСПЕХ: запоминаем бренд/модель в локальную память, чтобы предлагать в будущем ===
      const model = f_model.value.trim();
      lsAddBrandModel(canonical, model);

      // Также обновим текущий индекс в памяти страницы без перезагрузки
      // (чтобы подсказки появились сразу)
      if (!brandToModels) { await ensureCatalogIndex(); }
      const key = canonical.toLowerCase();
      const disp = brandAlias.get(key) || canonical;
      brandAlias.set(key, disp);
      if (!brandToModels.has(disp)) brandToModels.set(disp, new Set());
      if (model) brandToModels.get(disp).add(model);

      App.toast?.("Отправлено на модерацию");

      addForm?.reset();
      pickedFiles = [];
      syncFilesInput();
      renderPreviews();
      if (addNote) addNote.textContent = "";
      [f_brand, f_model, f_year, f_price, f_district, f_desc, f_files].forEach((inp) => inp && clearError(inp));

      if (typeof App.closeSheet === "function") App.closeSheet(addSheet, tabAdd);
      else {
        addSheet.classList.remove("show");
        addSheet.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("sheet-open");
        tabAdd.classList.remove("active");
        tabAdd.setAttribute("aria-expanded", "false");
      }
      await App.load?.();
    } catch (e) {
      console.error("[add] error", e);
      App.toast?.(String(e?.message || e));
      if (addNote) addNote.textContent = "Ошибка: " + (e?.message || e);
    } finally {
      btnSubmitAdd.disabled = false;
      btnSubmitAdd.textContent = prev;
    }
  }

  addForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();
    doSubmit();
  });
  btnSubmitAdd?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    doSubmit();
  });

  // стартовое значение счётчика
  (function initPhotosCounter(){ const el = document.getElementById("photosCount"); if (el) el.textContent = "0"; })();
})();