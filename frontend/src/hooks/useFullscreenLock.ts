// src/hooks/useFullscreenLock.ts
import { useEffect } from "react";

export const useFullscreenLock = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    // 1) Блокируем скролл body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 2) Ловим touchmove и не даём тянуть страницу
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener("touchmove", preventScroll, {
      passive: false,
    });

    // 3) Отключаем вертикальный свайп Телеграма (если метод есть)
    try {
      // @ts-ignore — в типах может не быть
      window.Telegram?.WebApp?.disableVerticalSwipe?.();
    } catch (_) {}

    return () => {
      // Восстанавливаем всё обратно
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("touchmove", preventScroll);

      try {
        // @ts-ignore
        window.Telegram?.WebApp?.enableVerticalSwipe?.();
      } catch (_) {}
    };
  }, [enabled]);
};
