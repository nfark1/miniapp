import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// === MINI APP FULLSCREEN ===
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;

  // говорим Telegram «я загрузился»
  tg.ready();

  // раскрыть мини-апп на весь экран
  tg.expand();

  // отключить свайпы вниз (чтобы не закрывалось)
  tg.disableSwipeBack?.();
  tg.disableVerticalSwipes?.();
}