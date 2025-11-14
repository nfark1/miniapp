// /static/js/add/dnd.js — перетаскивание превью: десктоп (HTML5 DnD) + мобильный (Pointer Events)
import { getPickedFiles, setPickedFiles } from "./photos.js";

const pv = document.getElementById("pv");
if (!pv) {
  console.warn("[dnd] pv not found");
} else {
  // ---------- Общая вспомогалка ----------
  function markThumbsDraggable() {
    pv.querySelectorAll(".thumb").forEach((t, i) => {
      t.dataset.idx = String(i);
      t.setAttribute("draggable", "true"); // для десктопа
      t.style.touchAction = "none";        // для pointer на мобиле
    });
  }
  const mo = new MutationObserver(markThumbsDraggable);
  mo.observe(pv, { childList: true });
  markThumbsDraggable();

  // ==========================================================
  // 1) Десктоп: классический HTML5 Drag & Drop (как раньше)
  // ==========================================================
  let dragFromIdx = null;

  pv.addEventListener("dragstart", (e) => {
    const th = e.target.closest(".thumb");
    if (!th) return;
    dragFromIdx = Number(th.dataset.idx);
    th.classList.add("dragging");
    try { e.dataTransfer.setData("text/plain", String(dragFromIdx)); } catch {}
  });

  pv.addEventListener("dragend", (e) => {
    e.target.closest(".thumb")?.classList.remove("dragging");
    dragFromIdx = null;
  });

  pv.addEventListener("dragover", (e) => {
    e.preventDefault(); // нужно для drop
  });

  pv.addEventListener("drop", (e) => {
    e.preventDefault();
    const toThumb = e.target.closest(".thumb");
    if (!toThumb) return;

    let from = dragFromIdx;
    try {
      const dt = e.dataTransfer?.getData("text/plain");
      if (dt) from = Number(dt);
    } catch {}

    const to = Number(toThumb.dataset.idx);
    if (Number.isNaN(from) || Number.isNaN(to) || from === to) return;

    const arr = getPickedFiles();
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setPickedFiles(arr);
  });

  // ==========================================================
  // 2) Мобилки: Pointer Events + “долгий тап” для старта DnD
  // ==========================================================
  let pState = {
    active: false,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
    longPressTimer: null,
    ghost: null,
    fromIdx: null,
    overIdx: null,
  };

  // placeholder между миниатюрами
  function makePlaceholder(w, h) {
    const ph = document.createElement("div");
    ph.className = "thumb placeholder";
    ph.style.width = `${w}px`;
    ph.style.height = `${h}px`;
    return ph;
  }

  function indexFromPoint(x, y) {
    // находим ближайший индекс по центрам миниатюр
    const thumbs = Array.from(pv.querySelectorAll(".thumb:not(.placeholder):not(.dragging)"));
    if (!thumbs.length) return null;
    let bestIdx = 0;
    let bestDist = Infinity;
    thumbs.forEach((t, i) => {
      const r = t.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = cx - x, dy = cy - y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestDist) { bestDist = d2; bestIdx = i; }
    });
    return bestIdx;
  }

  function startPointerDrag(th, ev) {
    const rect = th.getBoundingClientRect();
    pState.active = true;
    pState.fromIdx = Number(th.dataset.idx);
    pState.overIdx = pState.fromIdx;

    // “призрак” (двигаемая карточка)
    const ghost = th.cloneNode(true);
    ghost.classList.add("dragging");
    ghost.style.position = "fixed";
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "1001";
    document.body.appendChild(ghost);
    pState.ghost = ghost;

    // плейсхолдер на месте исходной
    const ph = makePlaceholder(rect.width, rect.height);
    th.replaceWith(ph);

    // стартовая позиция
    pState.startX = ev.clientX;
    pState.startY = ev.clientY;
    pState.curX = ev.clientX;
    pState.curY = ev.clientY;

    // ловим все движения
    try { th.setPointerCapture(ev.pointerId); } catch {}
  }

  function movePointerDrag(ev) {
    if (!pState.active || !pState.ghost) return;
    pState.curX = ev.clientX;
    pState.curY = ev.clientY;

    // двигаем “призрак”
    const dx = pState.curX - pState.startX;
    const dy = pState.curY - pState.startY;
    pState.ghost.style.transform = `translate(${dx}px, ${dy}px)`;

    // вычисляем куда вставлять
    const idx = indexFromPoint(ev.clientX, ev.clientY);
    if (idx == null || idx === pState.overIdx) return;
    pState.overIdx = idx;

    // переставим placeholder визуально
    const thumbs = Array.from(pv.querySelectorAll(".thumb"));
    const ph = thumbs.find(t => t.classList.contains("placeholder"));
    if (!ph) return;

    // уберём placeholder и вставим в новое место
    pv.removeChild(ph);
    const kids = Array.from(pv.querySelectorAll(".thumb:not(.dragging)"));
    if (idx >= kids.length) {
      pv.appendChild(ph);
    } else {
      pv.insertBefore(ph, kids[idx]);
    }
  }

  function endPointerDrag(ev) {
    // сброс long-press
    clearTimeout(pState.longPressTimer);

    if (!pState.active) return;
    const thumbs = Array.from(pv.querySelectorAll(".thumb"));
    const ph = thumbs.find(t => t.classList.contains("placeholder"));

    const from = pState.fromIdx;
    let to = pState.overIdx;
    if (ph) {
      // финальный индекс — позиция placeholder
      const list = Array.from(pv.querySelectorAll(".thumb:not(.dragging)"));
      to = list.indexOf(ph);
    }

    // привести массив файлов
    if (from != null && to != null && from !== to) {
      const arr = getPickedFiles();
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      setPickedFiles(arr);
    } else {
      // просто вернуть исходный элемент на место (перерисовка всё равно починит)
      if (ph) {
        const dummy = document.createElement("div");
        dummy.className = "thumb dummy";
        ph.replaceWith(dummy);
        dummy.remove();
      }
    }

    // очистка
    pState.active = false;
    pState.fromIdx = null;
    pState.overIdx = null;

    pState.ghost?.remove();
    pState.ghost = null;
  }

  // long-press для старта DnD на мобиле
  pv.addEventListener("pointerdown", (ev) => {
    const th = ev.target.closest(".thumb");
    if (!th) return;

    // только пальцем (мышкой — работает нативный DnD)
    if (ev.pointerType !== "touch" && ev.pointerType !== "pen") return;

    // не даём странице скроллиться во время long press
    ev.preventDefault();

    // ставим таймер на долгий тап (170–250 мс обычно ок)
    pState.longPressTimer = setTimeout(() => {
      startPointerDrag(th, ev);
    }, 180);
  }, { passive: false });

  pv.addEventListener("pointermove", (ev) => {
    if (pState.longPressTimer) {
      // если палец сильно сдвинулся до старта — отменяем
      const mx = Math.abs(ev.clientX - (pState.startX || ev.clientX));
      const my = Math.abs(ev.clientY - (pState.startY || ev.clientY));
      if (mx > 6 || my > 6) {
        clearTimeout(pState.longPressTimer);
        pState.longPressTimer = null;
      }
    }
    if (pState.active) {
      ev.preventDefault();
      movePointerDrag(ev);
    }
  }, { passive: false });

  pv.addEventListener("pointerup", (ev) => {
    if (pState.longPressTimer) {
      clearTimeout(pState.longPressTimer);
      pState.longPressTimer = null;
    }
    if (pState.active) {
      ev.preventDefault();
      endPointerDrag(ev);
    }
  }, { passive: false });

  pv.addEventListener("pointercancel", (ev) => {
    if (pState.longPressTimer) {
      clearTimeout(pState.longPressTimer);
      pState.longPressTimer = null;
    }
    if (pState.active) {
      endPointerDrag(ev);
    }
  }, { passive: true });
}