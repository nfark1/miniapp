import asyncio
import logging

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    WebAppInfo,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)

# 🔑 ВСТАВЬ СВОЙ РЕАЛЬНЫЙ ТОКЕН БОТА
BOT_TOKEN = "хуй тебе в нос"

# 👑 ТВОЙ ID (только ты можешь отправлять новости)
ADMIN_ID = 415254917

# 📣 Канал, куда бот будет слать новости
CHANNEL_ID = "@avtorynokperm"   # при необходимости поменяй на свой


# === Клавиатура с кнопкой "Открыть площадку" ===
def get_main_keyboard() -> ReplyKeyboardMarkup:
    webapp_url = "https://autorunok59.ru/"  # наш миниапп

    keyboard = [
        [
            KeyboardButton(
                text="🚗 Открыть площадку",
                web_app=WebAppInfo(url=webapp_url),
            )
        ],
    ]

    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,
        input_field_placeholder="Выберите действие",
    )


# === Инициализация диспетчера ===
dp = Dispatcher()


# === Хендлер /start ===
@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    text = (
        "👋 Привет! Это бот площадки *Авторынок Пермь*.\n\n"
        "Здесь ты можешь:\n"
        "• Разместить объявление о продаже автомобиля\n"
        "• Посмотреть свежие объявления по Перми и краю\n"
        "• Связаться с продавцом напрямую\n\n"
        "Нажми кнопку «🚗 Открыть площадку» внизу, чтобы запустить приложение."
    )

    await message.answer(
        text,
        reply_markup=get_main_keyboard(),
        parse_mode="Markdown",
    )


# === Клавиатура под новостным постом в канал ===
def get_news_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚗 Открыть площадку",
                    url="https://autorunok59.ru/",
                )
            ]
        ]
    )


# === Хендлер /news — отправка новости в канал (только для ADMIN_ID) ===
@dp.message(Command("news"))
async def send_news(message: types.Message):
    # Проверяем, что команду вызвал только админ (ты)
    if message.from_user.id != ADMIN_ID:
        await message.answer("❌ У тебя нет прав для отправки новостей.")
        return

    text = (
        "🚀 <b>Обновление от Авторынок Пермь!</b>\n\n"
        "Теперь все объявления можно публиковать напрямую через наше приложение "
        "в Telegram — быстро, удобно и бесплатно 🚗🔥\n\n"
        "В приложении ты можешь:\n"
        "• Разместить своё авто за пару минут\n"
        "• Загрузить фотографии\n"
        "• Заполнить характеристики\n"
        "• Отправить объявление на модерацию\n"
        "• Получить публикацию после одобрения\n\n"
        "Мы продолжаем тестирование — заходите, проверяйте, "
        "оставляйте обратную связь ❤️"
    )

    await message.bot.send_message(
        chat_id=CHANNEL_ID,
        text=text,
        reply_markup=get_news_keyboard(),
        parse_mode="HTML",
    )

    await message.answer("✅ Новость отправлена в канал.")


async def main():
    logging.basicConfig(level=logging.INFO)
    bot = Bot(BOT_TOKEN)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
