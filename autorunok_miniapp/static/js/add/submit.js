// static/js/add/submit.js
import { rememberPair } from "./catalog.js";
import { getPickedFiles } from "./photos.js";

export async function doSubmit(App, ctx) {
  const {
    addSheet,
    tabAdd,
    addForm,
    f_brand,
    f_model,
    f_year,
    f_price,
    f_district,
    f_desc,
    btnSubmitAdd,
    addNote,
  } = ctx;

  const btn  = btnSubmitAdd;
  const note = addNote;
  if (!btn) return;

  // режим редактирования?
  const isEdit = !!App.EDIT_MODE && !!App.EDIT_ID;

  // исходный текст кнопки
  const originalText =
    btn.dataset.label ||
    btn.textContent ||
    (isEdit ? "Сохранить" : "Отправить");

  // состояние "отправляем"
  btn.disabled = true;
  btn.classList.add("loading");
  btn.textContent = isEdit ? "Сохраняем…" : "Отправляем…";
  btn.dataset.label = originalText;
  if (note) note.textContent = "";

  try {
    const fd = new FormData();
    fd.append("brand",     (f_brand?.value || "").trim());
    fd.append("model",     (f_model?.value || "").trim());
    fd.append("year",      String(f_year?.value || "").trim());
    fd.append("price_rub", String(f_price?.value || "").trim());
    fd.append("district",  (f_district?.value || "").trim());
    fd.append("desc",      (f_desc?.value || "").trim());

    // ---- редактирование ----
    if (isEdit) {
      fd.append("id", String(App.EDIT_ID || ""));

      const keep = Array.isArray(App.EDIT_KEEP_PHOTOS)
        ? App.EDIT_KEEP_PHOTOS
        : [];
      fd.append("photos_keep", keep.join(","));
    }

    // ---- новые файлы ----
    const files = getPickedFiles();
    files.forEach((file) => {
      fd.append("photos", file);
    });

    const url = isEdit
      ? `/api/my_edit_upload?${Date.now()}`
      : `/api/listings_upload?${Date.now()}`;

    const resp = await fetch(url, {
      method: "POST",
      body: fd,
      credentials: "include",
    });

    let data = null;
    try {
      data = await resp.json();
    } catch (_) {}

    if (!resp.ok || !data || data.ok === false) {
      console.error("[add] upload error", resp.status, data);
      throw new Error(data?.error || "submit_failed");
    }

    // запоминаем бренд/модель
    if (f_brand?.value) {
      rememberPair(f_brand.value.trim(), f_model?.value.trim() || "");
    }

    if (note) {
      note.textContent = isEdit
        ? "Изменения сохранены. Объявление снова отправлено на модерацию."
        : "Объявление отправлено на модерацию. Мы проверим и опубликуем.";
    }
    App.toast?.(
      isEdit
        ? "Сохранено и отправлено на модерацию"
        : "Отправлено на модерацию"
    );

    // очистка формы / превью
    addForm?.reset();
    const counter = document.getElementById("photosCount");
    if (counter) counter.textContent = "0";
    const pv = document.getElementById("pv");
    if (pv) pv.innerHTML = "";

    // сбрасываем флаги редактирования
    App.EDIT_MODE = false;
    App.EDIT_ID = null;
    App.EDIT_KEEP_PHOTOS = [];

    // закрываем шит
    if (addSheet && typeof App.closeSheet === "function") {
      App.closeSheet(addSheet, tabAdd);
    } else if (addSheet) {
      addSheet.classList.remove("show");
      addSheet.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("sheet-open");
      tabAdd?.classList.remove("active");
      tabAdd?.setAttribute("aria-expanded", "false");
    }

    // перезагрузить ленту / профиль
    if (typeof App.load === "function") {
      App.load();
    }
  } catch (err) {
    console.error("[add] submit error", err);
    if (note) {
      note.textContent = "Ошибка отправки. Попробуйте ещё раз.";
    }
    App.toast?.("Ошибка отправки");
  } finally {
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.textContent = originalText;
  }
}