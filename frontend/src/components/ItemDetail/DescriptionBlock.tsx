import React from "react";

type Props = {
  desc?: string;
};

export const DescriptionBlock: React.FC<Props> = ({ desc }) => {
  const text =
    desc && desc.trim()
      ? desc
      : "Продавец ещё не добавил подробное описание автомобиля.";

  return (
    <section
      className="
        rounded-3xl
        border border-slate-800/80
        bg-slate-950/90
        px-4 py-3.5
        shadow-[0_14px_35px_rgba(0,0,0,0.85)]
        space-y-2
      "
    >
      <h2 className="text-sm font-semibold text-slate-100">Описание</h2>
      <p className="text-[13px] leading-relaxed text-slate-300 whitespace-pre-line">
        {text}
      </p>
    </section>
  );
};