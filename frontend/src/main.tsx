import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'  // 👈 вот это важно

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;

  // фуллскрин
  tg.expand();

  // отключаем свайпы вниз
  tg.disableSwipeBack?.();
  tg.disableVerticalSwipes?.();
}