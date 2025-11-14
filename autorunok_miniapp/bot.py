# bot.py
import asyncio, os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo

BOT_TOKEN = "8512563352:AAF2kpCfPnXf705r_8zwYFYwnSSDJlWw6E4"
APP_URL = "https://acrogenously-eximious-danita.ngrok-free.dev/webapp/?ngrok_skip_browser_warning=1"
APP_URL = APP_URL.strip()
assert APP_URL.startswith("https://"), f"APP_URL must start with https://, got: {APP_URL!r}"

dp = Dispatcher()

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import Command

APP_URL = os.getenv("APP_URL", "https://YOUR_PUBLIC/webapp/?ngrok_skip_browser_warning=1")

@dp.message(Command("profile"))
async def profile(m):
    url = APP_URL.replace("/webapp/", "/webapp/profile")
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="👤 Профиль", web_app=WebAppInfo(url=url))]
    ])
    await m.answer("Открой профиль:", reply_markup=kb)

@dp.message(Command("admin"))
async def admin(m):
    url = APP_URL.replace("/webapp/", "/webapp/admin")
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛡 Админ-панель", web_app=WebAppInfo(url=url))]
    ])
    await m.answer("Админ-панель:", reply_markup=kb)
    
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

@dp.message(CommandStart())
async def start(msg: types.Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🚘 Открыть Авторынок", web_app=WebAppInfo(url=APP_URL))
    ]])
    await msg.answer("Открой мини-приложение 👇", reply_markup=kb)

async def main():
    bot = Bot(BOT_TOKEN)
    me = await bot.get_me()
    print("✅ Бот запущен как", me.username)
    print("🔗 APP_URL =", repr(APP_URL))
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())