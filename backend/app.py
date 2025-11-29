from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel, Field, Session, create_engine, select
from typing import Optional, List
from datetime import datetime, timedelta
import os
import uuid
import json
from sqlalchemy.exc import OperationalError
from pydantic import BaseModel  # для LikeDelta

# ===== БАЗА ДАННЫХ =====
DATABASE_URL = "sqlite:///./db.sqlite3"
engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables():
    # создаём таблицы, если их нет
    SQLModel.metadata.create_all(engine)

    # 🔧 мягкая миграция: добавляем недостающие колонки для счётчиков
    with engine.connect() as conn:
        for col in ("views_count", "shares_count", "likes_count"):
            try:
                conn.exec_driver_sql(
                    f"ALTER TABLE listing ADD COLUMN {col} INTEGER NOT NULL DEFAULT 0"
                )
            except OperationalError as e:
                # если колонка уже есть — игнорируем, остальные ошибки пробрасываем
                if "duplicate column name" not in str(e):
                    raise


# ===== МОДЕЛИ =====

class ListingBase(SQLModel):
    title: str
    price: int
    district: str
    year: Optional[int] = None
    mileage: Optional[int] = None
    desc: Optional[str] = None
    owner: Optional[str] = None           # username продавца (@без собаки)
    seller_name: Optional[str] = None     # Имя + фамилия
    seller_photo_url: Optional[str] = None  # URL фото продавца
    status: str = "active"                # active | moderation | hidden
    badge: Optional[str] = None           # "top" | "premium" | None

    # 🔹 глобальные счётчики
    views_count: int = 0
    shares_count: int = 0
    likes_count: int = 0

class ListingCountersUpdate(SQLModel):
    views_count: Optional[int] = None
    shares_count: Optional[int] = None
    likes_count: Optional[int] = None

class ListingUpdate(SQLModel):
    title: Optional[str] = None
    price: Optional[int] = None
    district: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    desc: Optional[str] = None
    photos: Optional[List[str]] = None
    status: Optional[str] = None
    badge: Optional[str] = None           # "top" | "premium" | None


class Listing(ListingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    photos_json: str = "[]"               # массив URL'ов в виде JSON-строки
    created_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None  # когда стало active


class ListingCreate(ListingBase):
    photos: List[str] = []


class ListingRead(ListingBase):
    id: int
    photos: List[str]
    created_at: datetime
    published_at: Optional[datetime] = None


class ListingStatusUpdate(SQLModel):
    status: str  # "active" | "moderation" | "hidden"


class ListingBadgeUpdate(SQLModel):
    badge: Optional[str] = None  # "top" | "premium" | None


def get_session():
    with Session(engine) as session:
        yield session


app = FastAPI()

# CORS (для dev можно оставить *)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # потом сузим
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# статика для фото
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def on_startup():
    # используем нашу функцию с мягкой миграцией
    create_db_and_tables()


# ===== ЗАГРУЗКА ФОТО =====

@app.post("/api/upload", response_model=dict)
async def upload_photo(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".heic"]:
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    url = f"/uploads/{filename}"
    return {"url": url}


# ===== API ОБЪЯВЛЕНИЙ =====

@app.get("/api/listings", response_model=list[ListingRead])
def list_listings(session: Session = Depends(get_session)):
    # 🔥 Авто-скрытие объявлений старше 30 дней (от даты публикации)
    now = datetime.utcnow()
    expire_delta = timedelta(days=30)

    stmt = select(Listing)
    rows = session.exec(stmt).all()

    changed = False
    for listing in rows:
        # если активно и опубликовано более 30 дней назад — скрываем
        if listing.status == "active":
            base_dt = listing.published_at or listing.created_at
            if base_dt and base_dt + expire_delta < now:
                listing.status = "hidden"
                session.add(listing)
                changed = True

    if changed:
        session.commit()

    out: list[ListingRead] = []
    for row in rows:
        out.append(
            ListingRead(
                id=row.id,
                title=row.title,
                price=row.price,
                district=row.district,
                year=row.year,
                mileage=row.mileage,
                desc=row.desc,
                owner=row.owner,
                seller_name=row.seller_name,
                seller_photo_url=row.seller_photo_url,
                status=row.status,
                badge=row.badge,
                photos=json.loads(row.photos_json or "[]"),
                created_at=row.created_at,
                published_at=row.published_at,
                views_count=row.views_count,
                shares_count=row.shares_count,
                likes_count=row.likes_count,
            )
        )
    return out


@app.post("/api/listings", response_model=ListingRead)
def create_listing(data: ListingCreate, session: Session = Depends(get_session)):
    listing = Listing(
        title=data.title,
        price=data.price,
        district=data.district,
        year=data.year,
        mileage=data.mileage,
        desc=data.desc,
        owner=data.owner,
        seller_name=data.seller_name,
        seller_photo_url=data.seller_photo_url,
        status=data.status,
        badge=data.badge,
        photos_json=json.dumps(data.photos or []),
    )
    session.add(listing)
    session.commit()
    session.refresh(listing)
    return ListingRead(
        id=listing.id,
        title=listing.title,
        price=listing.price,
        district=listing.district,
        year=listing.year,
        mileage=listing.mileage,
        desc=listing.desc,
        owner=listing.owner,
        seller_name=listing.seller_name,
        seller_photo_url=listing.seller_photo_url,
        status=listing.status,
        badge=listing.badge,
        photos=json.loads(listing.photos_json or "[]"),
        created_at=listing.created_at,
        published_at=listing.published_at,
        views_count=listing.views_count,
        shares_count=listing.shares_count,
        likes_count=listing.likes_count,
    )


@app.patch("/api/listings/{listing_id}/status", response_model=ListingRead)
def update_listing_status(
    listing_id: int,
    data: dict = Body(...),
    session: Session = Depends(get_session),
):
    new_status = data.get("status")
    if new_status not in ["active", "hidden", "moderation"]:
        raise HTTPException(status_code=400, detail="Некорректный статус")

    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    listing.status = new_status

    # Когда делаем active — обновляем время публикации
    if new_status == "active":
        listing.published_at = datetime.utcnow()

    session.add(listing)
    session.commit()
    session.refresh(listing)

    return ListingRead(
        id=listing.id,
        title=listing.title,
        price=listing.price,
        district=listing.district,
        year=listing.year,
        mileage=listing.mileage,
        desc=listing.desc,
        owner=listing.owner,
        seller_name=listing.seller_name,
        seller_photo_url=listing.seller_photo_url,
        status=listing.status,
        badge=listing.badge,
        photos=json.loads(listing.photos_json or "[]"),
        created_at=listing.created_at,
        published_at=listing.published_at,
        views_count=listing.views_count,
        shares_count=listing.shares_count,
        likes_count=listing.likes_count,
    )


@app.patch("/api/listings/{listing_id}", response_model=ListingRead)
def update_listing(
    listing_id: int,
    data: ListingUpdate = Body(...),
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    # Обновляем только те поля, которые реально пришли
    if data.title is not None:
        listing.title = data.title
    if data.price is not None:
        listing.price = data.price
    if data.district is not None:
        listing.district = data.district
    if data.year is not None:
        listing.year = data.year
    if data.mileage is not None:
        listing.mileage = data.mileage
    if data.desc is not None:
        listing.desc = data.desc
    if data.status is not None:
        listing.status = data.status
    if data.badge is not None:
        listing.badge = data.badge
    if data.photos is not None:
        listing.photos_json = json.dumps(data.photos)

    session.add(listing)
    session.commit()
    session.refresh(listing)

    return ListingRead(
        id=listing.id,
        title=listing.title,
        price=listing.price,
        district=listing.district,
        year=listing.year,
        mileage=listing.mileage,
        desc=listing.desc,
        owner=listing.owner,
        seller_name=listing.seller_name,
        seller_photo_url=listing.seller_photo_url,
        status=listing.status,
        badge=listing.badge,
        photos=json.loads(listing.photos_json or "[]"),
        created_at=listing.created_at,
        published_at=listing.published_at,
        views_count=listing.views_count,
        shares_count=listing.shares_count,
        likes_count=listing.likes_count,
    )


@app.delete("/api/listings/{listing_id}")
def delete_listing(
    listing_id: int,
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    session.delete(listing)
    session.commit()
    return {"ok": True}


@app.patch("/api/listings/{listing_id}/badge", response_model=ListingRead)
def update_listing_badge(
    listing_id: int,
    data: ListingBadgeUpdate = Body(...),
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    # допустимые значения плашки
    if data.badge not in (None, "top", "premium"):
        raise HTTPException(status_code=400, detail="Некорректная плашка")

    listing.badge = data.badge
    session.add(listing)
    session.commit()
    session.refresh(listing)

    return ListingRead(
        id=listing.id,
        title=listing.title,
        price=listing.price,
        district=listing.district,
        year=listing.year,
        mileage=listing.mileage,
        desc=listing.desc,
        owner=listing.owner,
        seller_name=listing.seller_name,
        seller_photo_url=listing.seller_photo_url,
        status=listing.status,
        badge=listing.badge,
        photos=json.loads(listing.photos_json or "[]"),
        created_at=listing.created_at,
        published_at=listing.published_at,
        views_count=listing.views_count,
        shares_count=listing.shares_count,
        likes_count=listing.likes_count,
    )


# ===== СЧЁТЧИКИ =====

class LikeDelta(BaseModel):
    delta: int = 1  # +1 или -1


@app.post("/api/listings/{listing_id}/views", response_model=ListingRead)
def increment_views(
    listing_id: int,
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.views_count = (listing.views_count or 0) + 1
    session.add(listing)
    session.commit()
    session.refresh(listing)

    return ListingRead(
        id=listing.id,
        title=listing.title,
        price=listing.price,
        district=listing.district,
        year=listing.year,
        mileage=listing.mileage,
        desc=listing.desc,
        owner=listing.owner,
        seller_name=listing.seller_name,
        seller_photo_url=listing.seller_photo_url,
        status=listing.status,
        badge=listing.badge,
        photos=json.loads(listing.photos_json or "[]"),
        created_at=listing.created_at,
        published_at=listing.published_at,
        views_count=listing.views_count,
        shares_count=listing.shares_count,
        likes_count=listing.likes_count,
    )


@app.post("/api/listings/{listing_id}/likes", response_model=ListingRead)
def update_likes(
    listing_id: int,
    payload: LikeDelta,
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    current = listing.likes_count or 0
    new_value = current + payload.delta
    if new_value < 0:
        new_value = 0

    listing.likes_count = new_value
    session.add(listing)
    session.commit()
    session.refresh(listing)

    return ListingRead(
        id=listing.id,
        title=listing.title,
        price=listing.price,
        district=listing.district,
        year=listing.year,
        mileage=listing.mileage,
        desc=listing.desc,
        owner=listing.owner,
        seller_name=listing.seller_name,
        seller_photo_url=listing.seller_photo_url,
        status=listing.status,
        badge=listing.badge,
        photos=json.loads(listing.photos_json or "[]"),
        created_at=listing.created_at,
        published_at=listing.published_at,
        views_count=listing.views_count,
        shares_count=listing.shares_count,
        likes_count=listing.likes_count,
    )


@app.post("/api/listings/{listing_id}/shares", response_model=ListingRead)
def increment_shares(
    listing_id: int,
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.shares_count = (listing.shares_count or 0) + 1
    session.add(listing)
    session.commit()
    session.refresh(listing)

    return ListingRead(
        id=listing.id,
        title=listing.title,
        price=listing.price,
        district=listing.district,
        year=listing.year,
        mileage=listing.mileage,
        desc=listing.desc,
        owner=listing.owner,
        seller_name=listing.seller_name,
        seller_photo_url=listing.seller_photo_url,
        status=listing.status,
        badge=listing.badge,
        photos=json.loads(listing.photos_json or "[]"),
        created_at=listing.created_at,
        published_at=listing.published_at,
        views_count=listing.views_count,
        shares_count=listing.shares_count,
        likes_count=listing.likes_count,
    )
@app.patch("/api/listings/{listing_id}/counters", response_model=ListingRead)
def update_counters(
    listing_id: int,
    data: ListingCountersUpdate = Body(...),
    session: Session = Depends(get_session),
):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # если поле не пришло — не трогаем
    if data.views_count is not None:
        listing.views_count = max(0, data.views_count)
    if data.shares_count is not None:
        listing.shares_count = max(0, data.shares_count)
    if data.likes_count is not None:
        listing.likes_count = max(0, data.likes_count)

    session.add(listing)
    session.commit()
    session.refresh(listing)

    return ListingRead(
        id=listing.id,
        title=listing.title,
        price=listing.price,
        district=listing.district,
        year=listing.year,
        mileage=listing.mileage,
        desc=listing.desc,
        owner=listing.owner,
        seller_name=listing.seller_name,
        seller_photo_url=listing.seller_photo_url,
        status=listing.status,
        badge=listing.badge,
        photos=json.loads(listing.photos_json or "[]"),
        created_at=listing.created_at,
        published_at=listing.published_at,
        views_count=listing.views_count,
        shares_count=listing.shares_count,
        likes_count=listing.likes_count,
    )