export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    [key: string]: any;
  };

  expand: () => void;
  close: () => void;
  ready: () => void;

  disableSwipeBack?: () => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;

  openTelegramLink?: (url: string) => void;
}

// ⛔️ важно — нужен экспорт, чтобы TS видел модуль
export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}