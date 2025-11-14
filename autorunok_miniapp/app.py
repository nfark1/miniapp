# ---- imports -------------------------------------------------
import os
import time
import secrets
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import Depends

from fastapi import FastAPI, Request, Query, File, UploadFile, Form
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pydantic import BaseModel, Field
from starlette.middleware.sessions import SessionMiddleware

# ---- mode / app / uploads -----------------------------------
APP_MODE = "browser"  # локальный браузерный режим
app = FastAPI(title="Авторынок (local)")
app.add_middleware(SessionMiddleware, secret_key="dev-secret-please-change")

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
print("UPLOAD_DIR =", UPLOAD_DIR)  # DEBUG

# static /uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

# fallback (перестраховка)
@app.get("/uploads/{name:path}")
def serve_upload(name: str):
    path = UPLOAD_DIR / name
    if not path.is_file():
        return JSONResponse({"ok": False, "error": "not_found", "path": str(path)}, status_code=404)
    return FileResponse(str(path))

# ---- HTML templates loader -------------------------------------
HTML_DIR = BASE_DIR / "html"

def load_html(name: str) -> str:
    path = HTML_DIR / f"{name}.html"
    if not path.exists():
        return f"<h1>Ошибка</h1><p>Файл {name}.html не найден.</p>"
    return path.read_text(encoding="utf-8")

# Предзагрузка HTML (можно и на лету через load_html(..))
HTML_HOME    = load_html("home")
HTML_NEW     = load_html("new")
HTML_ADMIN   = load_html("admin")
HTML_PROFILE = load_html("profile")
# detail (item) отдаём по месту через load_html("item")

# ---- helper: save files -------------------------------------
async def save_upload_files(files: List[UploadFile]) -> List[str]:
    """Сохраняет файлы в UPLOAD_DIR и возвращает список URL /uploads/..."""
    urls: List[str] = []
    for f in files or []:
        if not f or not f.filename:
            continue
        ext = os.path.splitext(f.filename)[1].lower() or ".jpg"
        fname = f"{secrets.token_hex(8)}{ext}"
        path = UPLOAD_DIR / fname
        data = await f.read()
        with open(path, "wb") as out:
            out.write(data)
        print(f"[UPLOAD] saved {fname} ({len(data)} bytes) -> {path}")
        urls.append(f"/uploads/{fname}")  # ведущий слэш обязателен
    return urls

# ---- debug endpoint (временно) -------------------------------
@app.get("/api/debug/uploads")
def api_debug_uploads():
    try:
        files = sorted(os.listdir(UPLOAD_DIR))
        return {"ok": True, "dir": str(UPLOAD_DIR), "files": files}
    except Exception as e:
        return {"ok": False, "error": str(e)}

# ---------------------------
# Хранилища (in-memory)
# ---------------------------
SESSION_TTL = 60 * 60 * 24 * 7  # 7 дней
SESSIONS: Dict[str, Dict[str, Any]] = {}   # sid -> {"user": {...}, "ts": int}
USERS: Dict[int, Dict[str, Any]] = {}      # tg_id -> профиль
LISTINGS: List[Dict[str, Any]] = []        # in-memory объявления

# Демоданные
now = datetime.utcnow()
LISTINGS[:] = [
    {
        "id": 1,
        "brand": "Toyota",
        "model": "Camry",
        "year": 2018,
        "price_rub": 1_749_000,
        "district": "Пермь, Свердловский",
        "desc": "Один владелец, сервисная история, без ДТП.",
        "photos": [
            "/uploads/demo_camry_1.jpg",
            "/uploads/demo_camry_2.jpg",
        ],
        "status": "APPROVED",
        "top": True,
        "created_at": (now - timedelta(hours=5)).isoformat(),
    },
    {
        "id": 2,
        "brand": "BMW",
        "model": "3-Series",
        "year": 2016,
        "price_rub": 1_590_000,
        "district": "Пермь, Дзержинский",
        "desc": "2.0, xDrive, хорошая комплектация, потолок чёрный.",
        "photos": [
            "/uploads/demo_bmw_1.jpg",
        ],
        "status": "APPROVED",
        "top": False,
        "created_at": (now - timedelta(hours=20)).isoformat(),
    },
]

# ---------------------------
# Сессии / профиль
# ---------------------------
def make_session(user: Dict[str, Any]) -> str:
    sid = secrets.token_urlsafe(32)
    SESSIONS[sid] = {"user": user, "ts": int(time.time())}
    return sid

def get_user(request: Request) -> Optional[Dict[str, Any]]:
    """
    1) Основной способ — SessionMiddleware (request.session['user'])
    2) Фолбэк — старая sid-кука (совместимость)
    """
    u = request.session.get("user")
    if u:
        return u

    sid = request.cookies.get("sid")
    if not sid:
        return None
    sess = SESSIONS.get(sid)
    if not sess:
        return None
    if int(time.time()) - sess["ts"] > SESSION_TTL:
        SESSIONS.pop(sid, None)
        return None
    sess["ts"] = int(time.time())  # продлеваем TTL
    return sess["user"]

def safe_user(u: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "tg_id": u.get("tg_id"),
        "username": u.get("username", ""),
        "first_name": u.get("first_name", ""),
        "last_name": u.get("last_name", ""),
        "phone": u.get("phone", ""),
        "dealer": bool(u.get("dealer", False)),
        "is_admin": bool(u.get("is_admin", False)),
    }

def respond_with_session(user: Dict[str, Any]) -> JSONResponse:
    sid = make_session(user)
    resp = JSONResponse({"ok": True, "user": safe_user(user)})
    resp.set_cookie("sid", sid, httponly=True, samesite="lax", max_age=SESSION_TTL, path="/")
    return resp

def require_admin(request: Request) -> Optional[Dict[str, Any]]:
    u = get_user(request)
    if not u or not u.get("is_admin"):
        return None
    return u

# ---------------------------
# DEV-логин (только для браузера)
# ---------------------------
@app.get("/api/dev_login")
def dev_login(request: Request,
              tg_id: str = "415254917",
              username: str = "nfark",
              first_name: str = "Никита",
              is_admin: int = 1):
    # пишем флаги прямо в сессию
    request.session["user"] = {
        "tg_id": tg_id,
        "username": username,
        "first_name": first_name,
        "is_admin": bool(int(is_admin)),
    }
    return {"ok": True}

@app.get("/api/me")
def api_me(request: Request):
    user = request.session.get("user")
    if not user:
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    return user  # вернёт 200 с данными

@app.get("/api/profile")
def api_profile_get(request: Request):
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)
    return safe_user(u)

@app.post("/api/profile")
async def api_profile_set(request: Request):
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)
    data = await request.json()
    # разрешаем править только свои простые поля
    u["first_name"] = str(data.get("first_name", u.get("first_name","")))[:100]
    u["last_name"]  = str(data.get("last_name",  u.get("last_name","")))[:100]
    u["phone"]      = str(data.get("phone",      u.get("phone","")))[:50]
    u["dealer"]     = bool(int(data.get("dealer", 1 if u.get("dealer") else 0)))
    return {"ok": True, "user": safe_user(u)}

# ---------------------------
# API объявлений
# ---------------------------
class ListingIn(BaseModel):
    brand: str = Field(min_length=1)
    model: str = Field(min_length=1)
    year: int = Field(ge=1950, le=2100)
    price_rub: int = Field(ge=0)
    district: str = Field(min_length=1)
    desc: str = Field(min_length=1)
    photos: List[str] = Field(default_factory=list)

@app.post("/api/listings")
def api_create_listing(data: ListingIn, request: Request):
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)
    new_id = (max([x["id"] for x in LISTINGS]) + 1) if LISTINGS else 1
    item = {
        "id": new_id,
        "brand": data.brand.strip(),
        "model": data.model.strip(),
        "year": data.year,
        "price_rub": data.price_rub,
        "district": data.district.strip(),
        "desc": data.desc.strip(),
        "photos": data.photos or [],
        "status": "PENDING",
        "top": False,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "owner_username": u.get("username", ""),
        "owner_id": u.get("tg_id"),
    }
    LISTINGS.append(item)
    return {"ok": True, "id": new_id, "status": item["status"]}

@app.post("/api/listings_upload")
async def api_create_listing_upload(
    request: Request,
    brand: str = Form(...),
    model: str = Form(...),
    year: int = Form(...),
    price_rub: int = Form(...),
    district: str = Form(...),
    desc: str = Form(...),
    photos: List[UploadFile] = File(default=[])
):
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

    new_id = (max([x["id"] for x in LISTINGS]) + 1) if LISTINGS else 1
    saved_urls = await save_upload_files(photos)

    item = {
        "id": new_id,
        "brand": brand.strip(),
        "model": model.strip(),
        "year": int(year),
        "price_rub": int(price_rub),
        "district": district.strip(),
        "desc": desc.strip(),
        "photos": saved_urls,
        "status": "PENDING",
        "top": False,
        "created_at": datetime.utcnow().isoformat(),
        "owner_username": u.get("username", ""),
        "owner_id": u.get("tg_id"),
    }
    LISTINGS.append(item)
    return {"ok": True, "id": new_id, "status": item["status"], "item": item}

from typing import Optional, List
from fastapi import Form, File, UploadFile

@app.post("/api/my_edit_upload")
async def api_my_edit_upload(
    request: Request,
    id: int = Form(...),

    # простые поля (все опционально)
    brand: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    price_rub: Optional[int] = Form(None),
    district: Optional[str] = Form(None),
    desc: Optional[str] = Form(None),

    # какие старые фото оставить (из формы редактирования)
    photos_keep: str = Form(""),

    # новые файлы (могут отсутствовать)
    photos: Optional[List[UploadFile]] = File(None),
):
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

    # находим объявление и проверяем владельца
    item = next((x for x in LISTINGS if x["id"] == id), None)
    if not item:
        return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)

    if str(item.get("owner_id")) != str(u.get("tg_id")) and not u.get("is_admin"):
        return JSONResponse({"ok": False, "error": "forbidden"}, status_code=403)

    # 1) обновляем простые поля
    if brand is not None:
        item["brand"] = brand.strip()
    if model is not None:
        item["model"] = model.strip()
    if year is not None:
        item["year"] = int(year)
    if price_rub is not None:
        item["price_rub"] = int(price_rub)
    if district is not None:
        item["district"] = district.strip()
    if desc is not None:
        item["desc"] = desc.strip()

    # 2) старые фото, которые пользователь оставил
    kept = [p.strip() for p in (photos_keep or "").split(",") if p.strip()]

    # 3) новые файлы
    new_urls = await save_upload_files(photos or [])

    # 4) окончательный список фото
    item["photos"] = kept + new_urls

    # 5) после редактирования — снова на модерацию
    item["status"] = "PENDING"

    print(f"[MY-EDIT] id={id} kept={kept} added={new_urls}")
    return {"ok": True, "item": item}

@app.get("/api/listings")
def api_listings(brand: Optional[str] = None):
    # Показываем только утверждённые объявления
    items = [x for x in LISTINGS if x.get("status") == "APPROVED"]

    # Фильтрация по бренду (регистр не важен)
    if brand:
        b = brand.strip().lower()
        items = [x for x in items if x.get("brand", "").lower() == b]

    # Сортировка: свежие объявления первыми
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Отдаём клиенту безопасную структуру
    safe_items = []
    for it in items:
        safe_items.append({
            "id": it["id"],
            "brand": it["brand"],
            "model": it["model"],
            "year": it["year"],
            "price_rub": it["price_rub"],
            "district": it["district"],
            "desc": (it.get("desc") or ""), 
            "photos": it.get("photos", []),
            "top": it.get("top", False),
            "created_at": it.get("created_at"),
            "owner_username": it.get("owner_username", ""),
            "owner_id": it.get("owner_id"),
        })

    return {"ok": True, "items": safe_items}

# Одна карточка (публично только APPROVED; админу — всё)
@app.get("/api/listing/{item_id}")
def api_listing_one(item_id: int, request: Request):
    user = get_user(request)
    is_admin = bool(user and user.get("is_admin"))

    it = next((x for x in LISTINGS if x["id"] == item_id), None)
    if not it:
        return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)

    if (not is_admin) and it.get("status") != "APPROVED":
        return JSONResponse({"ok": False, "error": "forbidden"}, status_code=403)

    return {"ok": True, "item": it}
    
@app.get("/api/my_listings")
def api_my_listings(request: Request):
    """
    Мои объявления для текущего пользователя:
    - возвращаем ВСЕ статусы (PENDING, APPROVED, REJECTED, HIDDEN и т.д.)
    - фильтруем по owner_id == tg_id из сессии
    """
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

    tg_id = str(u.get("tg_id"))
    items = [x for x in LISTINGS if str(x.get("owner_id")) == tg_id]

    # свежие сверху
    items = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    # отдаём как есть (со статусом), чтобы профиль мог рисовать “На модерации”
    return {"ok": True, "items": items}


@app.post("/api/my_delete")
async def api_my_delete(request: Request):
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

    data = await request.json()
    lid = int(data.get("id", 0))

    # ищем объявление пользователя
    for i, it in enumerate(LISTINGS):
        if it["id"] == lid and str(it.get("owner_id")) == str(u.get("tg_id")):
            LISTINGS.pop(i)
            return {"ok": True}

    return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)

@app.post("/api/my_hide")
async def api_my_hide(request: Request):
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

    data = await request.json()
    lid = int(data.get("id", 0))

    for it in LISTINGS:
        # скрывать можно только свои объявления
        if it["id"] == lid and str(it.get("owner_id")) == str(u.get("tg_id")):
            it["status"] = "HIDDEN"
            return {"ok": True, "item": it}

    return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)    

@app.post("/api/my_republish")
async def api_my_republish(request: Request):
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

    data = await request.json()
    lid = int(data.get("id", 0))

    for it in LISTINGS:
        # пользователь может повторно опубликовать только свои объявления
        if it["id"] == lid and str(it.get("owner_id")) == str(u.get("tg_id")):
            # Разрешаем отправлять на модерацию только скрытые или отклонённые
            if it.get("status") in ["HIDDEN", "REJECTED"]:
                it["status"] = "PENDING"
                return {"ok": True, "item": it}
            else:
                return JSONResponse(
                    {"ok": False, "error": "invalid_status"},
                    status_code=400
                )

    return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)

@app.post("/api/my_edit")
async def api_my_edit(request: Request):
    u = get_user(request)
    if not u:
        return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

    data = await request.json()
    lid = int(data.get("id", 0))

    for it in LISTINGS:
        # редактировать может только владелец
        if it["id"] == lid and str(it.get("owner_id")) == str(u.get("tg_id")):

            # обновляем только отправленные поля
            for key in ["brand", "model", "year", "price_rub", "district", "desc"]:
                if key in data:
                    it[key] = data[key]

            # 👇 главное условие:
            # после любого редактирования → объявление идёт на модерацию
            it["status"] = "PENDING"

            return {"ok": True, "item": it}

    return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)

# ---------------------------
# Admin API
# ---------------------------
@app.get("/api/admin/listings")
def api_admin_listings(request: Request, status: Optional[str] = None):
    if not require_admin(request):
        return JSONResponse({"ok": False, "error": "forbidden"}, status_code=403)
    items = LISTINGS
    if status:
        s = status.strip().upper()
        items = [x for x in items if x.get("status","").upper() == s]
    items = sorted(items, key=lambda x: x["created_at"], reverse=True)
    return {"ok": True, "items": items}

@app.post("/api/admin/approve")
async def api_admin_approve(request: Request):
    if not require_admin(request):
        return JSONResponse({"ok": False, "error": "forbidden"}, status_code=403)
    data = await request.json()
    lid = int(data.get("id", 0))
    for it in LISTINGS:
        if it["id"] == lid:
            it["status"] = "APPROVED"
            return {"ok": True, "item": it}
    return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)

@app.post("/api/admin/reject")
async def api_admin_reject(request: Request):
    if not require_admin(request):
        return JSONResponse({"ok": False, "error": "forbidden"}, status_code=403)
    data = await request.json()
    lid = int(data.get("id", 0))
    for it in LISTINGS:
        if it["id"] == lid:
            it["status"] = "REJECTED"
            return {"ok": True, "item": it}
    return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)

@app.post("/api/admin/delete")
async def api_admin_delete(request: Request):
    if not require_admin(request):
        return JSONResponse({"ok": False, "error": "forbidden"}, status_code=403)
    data = await request.json()
    lid = int(data.get("id", 0))
    idx = next((i for i, it in enumerate(LISTINGS) if it["id"] == lid), None)
    if idx is None:
        return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)
    LISTINGS.pop(idx)
    return {"ok": True}

@app.post("/api/admin/update_upload")
async def api_admin_update_upload(
    request: Request,
    id: int = Form(...),

    # простые поля (все опционально)
    brand: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    price_rub: Optional[int] = Form(None),
    district: Optional[str] = Form(None),
    desc: Optional[str] = Form(None),
    top: Optional[int] = Form(0),

    # какие фото оставить (после удалений в модалке)
    photos_keep: str = Form(""),

    # новые файлы (могут отсутствовать)
    files: Optional[List[UploadFile]] = File(None),
):
    if not require_admin(request):
        return JSONResponse({"ok": False, "error": "forbidden"}, status_code=403)

    item = next((x for x in LISTINGS if x["id"] == id), None)
    if not item:
        return JSONResponse({"ok": False, "error": "not_found"}, status_code=404)

    # 1) обновляем простые поля
    if brand is not None:     item["brand"] = brand.strip()
    if model is not None:     item["model"] = model.strip()
    if year is not None:      item["year"] = int(year)
    if price_rub is not None: item["price_rub"] = int(price_rub)
    if district is not None:  item["district"] = district.strip()
    if desc is not None:      item["desc"] = desc.strip()
    if top is not None:       item["top"] = bool(int(top or 0))

    # 2) фото, оставленные после «крестиков» в модалке
    kept = [p.strip() for p in (photos_keep or "").split(",") if p.strip()]

    # 3) новые файлы (если выбраны)
    new_urls = await save_upload_files(files or [])

    # 4) итоговые фото
    item["photos"] = kept + new_urls

    print(f"[ADMIN-UPDATE] id={id} kept={kept} added={new_urls}")
    return {"ok": True, "item": item}

# ---------------------------
# Страницы
# ---------------------------
@app.get("/", response_class=HTMLResponse)
def root_redirect():
    return HTML_HOME

@app.get("/webapp/", response_class=HTMLResponse)
def webapp_home():
    return HTML_HOME

@app.get("/webapp/new")
async def redirect_new():
    return RedirectResponse("/webapp/")

@app.get("/webapp/profile", response_class=HTMLResponse)
def webapp_profile():
    return HTML_PROFILE

@app.get("/webapp/admin", response_class=HTMLResponse)
def webapp_admin(request: Request):
    u = get_user(request)
    if not u or not u.get("is_admin"):
        return HTMLResponse("""
        <!doctype html><meta charset="utf-8">
        <title>Доступ запрещён</title>
        <body style="background:#0f0f0f;color:#fff;font:14px -apple-system,system-ui;padding:16px">
          <div style="margin-bottom:12px">Нужен вход как админ.</div>
          <button id="dev" style="background:#2d82ff;color:#fff;border:1px solid #2d82ff;border-radius:10px;padding:10px 14px;cursor:pointer">
            Dev-логин (локально)
          </button>
          <script>
            document.getElementById('dev').onclick = async ()=>{
              const r = await fetch('/api/dev_login?tg_id=415254917&username=nfark&first_name=Никита&is_admin=1',
                { credentials:'include' });
              if(r.ok) location.reload(); else alert('Ошибка dev_login: '+(await r.text()));
            };
          </script>
        </body>
        """, status_code=403)
    return HTML_ADMIN

# Страница карточки (JS сам дёргает /api/listing/{id})
@app.get("/webapp/item/{item_id}", response_class=HTMLResponse)
def webapp_item(item_id: int):
    return HTMLResponse(load_html("item"))