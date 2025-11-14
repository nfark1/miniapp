// /static/js/add/catalog.js
// Каталог марок/моделей + «самообучение»
const LS_KEY = "brand_models_v1";

// локальные структуры
let brandToModels = new Map();   // DisplayBrand -> Set(models)
let brandAlias    = new Map();   // lcBrand -> DisplayBrand
let inited = false;

/* ===== LS helpers ===== */
function readLS() {
  try {
    const obj = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    const map = new Map();
    Object.entries(obj).forEach(([brand, arr]) => map.set(brand, new Set(arr)));
    return map;
  } catch {
    return new Map();
  }
}
function writeLS(map) {
  const obj = {};
  for (const [b, set] of map.entries()) obj[b] = Array.from(set);
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}

/* ===== Инициализация из LS и/или фида ===== */
export async function ensureCatalogFromFeed(App) {
  if (inited) return;

  brandToModels = new Map();
  brandAlias    = new Map();

  // 1) сначала — localStorage, чтобы подсказки были сразу
  const ls = readLS();
  for (const [b, set] of ls.entries()) {
    const bDisp = String(b).trim();
    if (!bDisp) continue;
    brandAlias.set(bDisp.toLowerCase(), bDisp);
    if (!brandToModels.has(bDisp)) brandToModels.set(bDisp, new Set());
    for (const m of set) {
      const mDisp = String(m).trim();
      if (mDisp) brandToModels.get(bDisp).add(mDisp);
    }
  }

  // 2) затем — лента. Если пусто, попробуем подгрузить через API.
  try {
    if (!Array.isArray(App.ALL_ITEMS) || !App.ALL_ITEMS.length) {
      const data = await App.apiListings?.();
      if (data?.items) App.ALL_ITEMS = data.items;
    }
  } catch {}

  const items = Array.isArray(App.ALL_ITEMS) ? App.ALL_ITEMS : [];
  for (const it of items) {
    const bDisp = String(it.brand || "").trim();
    const mDisp = String(it.model || "").trim();
    if (!bDisp) continue;

    const key = bDisp.toLowerCase();
    const display = brandAlias.get(key) || bDisp;
    brandAlias.set(key, display);

    if (!brandToModels.has(display)) brandToModels.set(display, new Set());
    if (mDisp) brandToModels.get(display).add(mDisp);
  }

  inited = true;
}

/* ===== API ===== */
export function getCanonicalBrand(input) {
  if (!input) return null;
  const lc = String(input).trim().toLowerCase();
  return brandAlias.get(lc) || null; // если не нашлось — вернём null, но ввод не блокируем
}

export function getAllBrandsDisplay() {
  // чуть приятнее — отсортируем
  return Array.from(brandToModels.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

export function getModelsForBrand(displayBrand) {
  return brandToModels.get(displayBrand) || new Set();
}

/* Дообучение каталога — запоминание пары */
export function rememberPair(brand, model) {
  const bDisp = String(brand || "").trim();
  const mDisp = String(model || "").trim();
  if (!bDisp) return;

  // обновим alias
  brandAlias.set(bDisp.toLowerCase(), bDisp);

  // в память
  if (!brandToModels.has(bDisp)) brandToModels.set(bDisp, new Set());
  if (mDisp) brandToModels.get(bDisp).add(mDisp);

  // и в LS
  const ls = readLS();
  if (!ls.has(bDisp)) ls.set(bDisp, new Set());
  if (mDisp) ls.get(bDisp).add(mDisp);
  writeLS(ls);
}