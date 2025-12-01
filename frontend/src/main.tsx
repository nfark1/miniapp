import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Телеграм-интеграция
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;

  // Сообщаем Telegram, что всё загрузилось
  tg.ready();

  // Разворачиваем максимально по высоте
  tg.expand();

  // Пытаемся включить настоящий fullscreen (если клиент поддерживает)
  try {
    (tg as any).requestFullscreen?.();
  } catch (e) {
    console.warn("requestFullscreen failed", e);
  }

  // Блокируем свайпы назад/вниз
  (tg as any).disableSwipeBack?.();
  (tg as any).disableVerticalSwipes?.();
}