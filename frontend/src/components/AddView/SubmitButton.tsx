// src/components/AddView/SubmitButton.tsx
import React from "react";

type SubmitButtonProps = {
  isSubmitting: boolean;
};

export const SubmitButton: React.FC<SubmitButtonProps> = ({ isSubmitting }) => {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`
        w-full mt-1
        py-3 rounded-2xl
        bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.25),transparent_60%),rgba(8,16,32,0.98)]
        border border-cyan-300/50
        text-[14px] font-semibold text-sky-50
        shadow-[0_0_0_1px_rgba(15,23,42,1),0_0_26px_rgba(56,189,248,0.65)]
        transition
        ${isSubmitting ? "opacity-60 cursor-wait" : "active:scale-[0.98]"}
      `}
    >
      {isSubmitting ? "Отправка объявления…" : "Опубликовать объявление"}
    </button>
  );
};