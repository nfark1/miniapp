import asyncio
import logging
from aiogram import Bot, Dispatcher, Router, types
from aiogram.filters import CommandStart

API_TOKEN = "8512563352:AAF2kpCfPnXf705r_8zwYFYwnSSDJlWw6E4"

logging.basicConfig(level=logging.INFO)

router = Router()

@router.message(CommandStart())
async def cmd_start(message: types.Message):
    await message.answer("Бот запущен! Добро пожаловать.")

async def main():
    bot = Bot(token=API_TOKEN)
    dp = Dispatcher()
    dp.include_router(router)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
