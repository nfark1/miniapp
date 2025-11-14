// suggest.js — универсальный выпадающий список под инпутом
export function makeSuggest(forInput, onPick) {
  const wrap = forInput.closest(".inp") || forInput.parentElement || forInput;
  let box = wrap.querySelector(".suggest");
  if (!box) {
    box = document.createElement("div");
    box.className = "suggest hidden";
    wrap.appendChild(box);
  }
  let activeIdx = -1;

  const hide = () => { box.classList.add("hidden"); box.innerHTML = ""; activeIdx = -1; };
  const show = (list) => {
    if (!list || !list.length) return hide();
    box.innerHTML = "";
    list.forEach((txt) => {
      const it = document.createElement("div");
      it.className = "suggest-item";
      it.textContent = txt;
      it.dataset.value = txt;
      it.addEventListener("mousedown", (e) => {
        e.preventDefault();
        onPick?.(txt);
        hide();
      });
      box.appendChild(it);
    });
    box.classList.remove("hidden");
    activeIdx = -1;
  };

  function move(delta) {
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
  }
  function applyActive() {
    const el = box.querySelector(".suggest-item.active");
    if (!el) return;
    onPick?.(el.dataset.value || el.textContent || "");
    hide();
  }

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

/** помощь для фильтра по префиксу */
export function filterByPrefix(src, query) {
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
}