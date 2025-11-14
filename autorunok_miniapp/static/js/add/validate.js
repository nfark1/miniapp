// validate.js — валидация полей
function fieldWrap(input){ return input?.closest(".inp") || input?.parentElement; }
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

export function bindInlineClear(inputs) {
  inputs.forEach((inp) => {
    inp?.addEventListener("input", () => clearError(inp));
    inp?.addEventListener("change", () => clearError(inp));
  });
}

export function validate(fields, helpers, photosCount, toast) {
  const { f_brand, f_model, f_year, f_price, f_files } = fields;
  let first = null;

  // Марка — только непусто
  const brandInput = f_brand?.value.trim();
  if (!brandInput) { showError(f_brand, "Укажи марку"); first = first || f_brand; }
  else clearError(f_brand);

  // Модель — только непусто
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
  if (!photosCount) { showError(f_files, "Добавь хотя бы 1 фото"); first = first || f_files; }
  else clearError(f_files);

  if (first) {
    first.focus({ preventScroll: false });
    toast?.("Исправь выделенные поля");
    return false;
  }
  return true;
}