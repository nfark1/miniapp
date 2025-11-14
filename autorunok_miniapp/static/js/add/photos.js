// /static/js/add/photos.js
// Работа только с НОВЫМИ файлами (загружаемыми через input).
// Старые фото при редактировании храним в App.EDIT_KEEP_PHOTOS
// и рисуем в feed.profile.js — тут их не трогаем.

let pickedFiles = [];
let $filesInput = null;
let $pv = null;

// сколько всего фоток сейчас (старые + новые)
function totalCount() {
  const App = window.App || {};
  const existing = Array.isArray(App.EDIT_KEEP_PHOTOS)
    ? App.EDIT_KEEP_PHOTOS.length
    : 0;
  return existing + pickedFiles.length;
}

function updatePhotosCount() {
  const el = document.getElementById("photosCount");
  if (!el) return;

  const App = window.App || {};
  const keepCount = Array.isArray(App.EDIT_KEEP_PHOTOS)
    ? App.EDIT_KEEP_PHOTOS.length
    : 0;

  el.textContent = String(keepCount + pickedFiles.length);
}

// пробрасываем выбранные файлы в input.files, чтобы браузер корректно отправил их
function syncFilesInput() {
  if (!$filesInput) return;
  try {
    const dt = new DataTransfer();
    pickedFiles.slice(0, 10).forEach((f) => dt.items.add(f));
    $filesInput.files = dt.files;
  } catch (_) {}
  updatePhotosCount();
}

export function renderPreviews() {
  if (!$pv) return;

  // ❗ НЕ трогаем старые .thumb.existing — только чистим НОВЫЕ превью
  Array.from($pv.querySelectorAll(".thumb:not(.existing)")).forEach((el) =>
    el.remove()
  );

  pickedFiles.forEach((file, idx) => {
    const t = document.createElement("div");
    t.className = "thumb";
    t.draggable = true;
    t.dataset.idx = String(idx);

    const url = URL.createObjectURL(file);
    t.style.backgroundImage = `url('${url}')`;
    t.dataset.url = url;

    const del = document.createElement("button");
    del.className = "x";
    del.type = "button";
    del.dataset.idx = String(idx);
    del.textContent = "✕";

    t.appendChild(del);
    $pv.appendChild(t);

    // ===== DnD события =====
    t.addEventListener("dragstart", (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
      t.classList.add("dragging");
    });

    t.addEventListener("dragend", () => {
      t.classList.remove("dragging");
    });

    t.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    t.addEventListener("drop", (e) => {
      e.preventDefault();
      const fromStr = e.dataTransfer.getData("text/plain");
      const from = Number(fromStr);
      const to = idx;

      if (Number.isNaN(from) || from === to) return;
      if (from < 0 || from >= pickedFiles.length) return;

      const [moved] = pickedFiles.splice(from, 1);
      pickedFiles.splice(to, 0, moved);

      syncFilesInput();
      renderPreviews();
    });
  });

  updatePhotosCount();
}

// инициализация фоток (вешаем обработчики на инпут и контейнер превью)
export function initPhotos({ f_files, pv }) {
  $filesInput = f_files || null;
  $pv = pv || null;

  // делегирование удаления ТОЛЬКО для новых превью (кнопка .x)
  $pv?.addEventListener("click", (e) => {
    const btn = e.target.closest(".x");
    if (!btn) {
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const thumb = btn.closest(".thumb");
    if (!thumb) return;

    const url = thumb.dataset.url || "";
    const idx = Number(btn.dataset.idx);

    const App = window.App || {};

    // Если это СТАРОЕ фото (existing)
    if (thumb.classList.contains("existing")) {
      const keep = Array.isArray(App.EDIT_KEEP_PHOTOS)
        ? App.EDIT_KEEP_PHOTOS
        : [];
      App.EDIT_KEEP_PHOTOS = keep.filter((p) => p !== url);
      thumb.remove();
      updatePhotosCount();
      return;
    }

    // иначе — это НОВЫЙ файл
    if (!Number.isNaN(idx)) {
      pickedFiles.splice(idx, 1);
      syncFilesInput();
      renderPreviews();
    }
  });

  // не закрываем шит при скролле/тапах по превью
  $pv?.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  $pv?.addEventListener("touchmove",  (e) => e.stopPropagation(), { passive: true });

  // выбор картинок
  $filesInput?.addEventListener("change", (e) => {
    const list = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    // новые файлы добавляем к уже выбранным (но максимум 10)
    pickedFiles = [...pickedFiles, ...list].slice(0, 10);
    syncFilesInput();
    renderPreviews();
  });

  updatePhotosCount();
}

// отдать копию массива выбранных НОВЫХ файлов
export function getPickedFiles() {
  return pickedFiles.slice();
}

// добавить выбранные файлы в FormData (для submit.js)
export function appendPickedToForm(fd) {
  pickedFiles.slice(0, 10).forEach((f) => fd.append("photos", f, f.name));
}

// если вдруг захотим программно менять набор новых файлов (DnD и т.п.)
export function setPickedFiles(newFilesArray) {
  pickedFiles = Array.isArray(newFilesArray) ? newFilesArray.slice(0, 10) : [];
  syncFilesInput();
  renderPreviews();
}

// опционально: можно вызывать при открытии формы как "новое объявление"
export function resetPickedFiles() {
  pickedFiles = [];
  syncFilesInput();
  renderPreviews();
}