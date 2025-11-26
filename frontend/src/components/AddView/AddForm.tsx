// src/components/AddView/AddForm.tsx
import React from "react";
import type { LocalPhoto } from "./AddView";
import { PhotosUploader } from "./PhotosUploader";
import { SubmitButton } from "./SubmitButton";

type AddFormProps = {
  brand: string;
  setBrand: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  mileage: string;
  setMileage: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;

  photos: LocalPhoto[];
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onReorderPhotos: (fromIndex: number, toIndex: number) => void;

  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export const AddForm: React.FC<AddFormProps> = ({
  brand,
  setBrand,
  model,
  setModel,
  price,
  setPrice,
  year,
  setYear,
  mileage,
  setMileage,
  district,
  setDistrict,
  desc,
  setDesc,
  photos,
  onPhotoChange,
  onRemovePhoto,
  onReorderPhotos,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="
        rounded-3xl
        border border-slate-700/80
        bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.22),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.2),transparent_60%),rgba(2,6,23,0.98)]
        shadow-[0_18px_45px_rgba(0,0,0,0.95)]
        px-4 py-4
        space-y-4
      "
    >
      {/* марка/модель */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] text-slate-300 mb-1">
            Марка
          </label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Lada / Toyota / BMW"
            className="
              w-full rounded-xl bg-slate-950/70
              border border-slate-600/70
              px-3 py-2 text-sm text-slate-50
              outline-none
              focus:border-cyan-400 focus:shadow-[0_0_0_1px_rgba(8,145,178,0.9)]
            "
          />
        </div>
        <div>
          <label className="block text-[12px] text-slate-300 mb-1">
            Модель
          </label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Granta / Camry / 320i"
            className="
              w-full rounded-xl bg-slate-950/70
              border border-slate-600/70
              px-3 py-2 text-sm text-slate-50
              outline-none
              focus:border-cyan-400 focus:shadow-[0_0_0_1px_rgba(8,145,178,0.9)]
            "
          />
        </div>
      </div>

      {/* год / цена */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] text-slate-300 mb-1">
            Год
          </label>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            type="number"
            inputMode="numeric"
            min={1950}
            max={2100}
            placeholder="2015"
            className="
              w-full rounded-xl bg-slate-950/70
              border border-slate-600/70
              px-3 py-2 text-sm text-slate-50
              outline-none
              focus:border-cyan-400 focus:shadow-[0_0_0_1px_rgba(8,145,178,0.9)]
            "
          />
        </div>
        <div>
          <label className="block text-[12px] text-slate-300 mb-1">
            Цена, ₽
          </label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            placeholder="750000"
            className="
              w-full rounded-xl bg-slate-950/70
              border border-slate-600/70
              px-3 py-2 text-sm text-slate-50
              outline-none
              focus:border-cyan-400 focus:shadow-[0_0_0_1px_rgba(8,145,178,0.9)]
            "
          />
        </div>
      </div>

      {/* пробег / район */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] text-slate-300 mb-1">
            Пробег, км
          </label>
          <input
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            inputMode="numeric"
            placeholder="150000"
            className="
              w-full rounded-xl bg-slate-950/70
              border border-slate-600/70
              px-3 py-2 text-sm text-slate-50
              outline-none
              focus:border-cyan-400 focus:shadow-[0_0_0_1px_rgba(8,145,178,0.9)]
            "
          />
        </div>
        <div>
          <label className="block text-[12px] text-slate-300 mb-1">
            Район
          </label>
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Пермь, Свердловский"
            className="
              w-full rounded-xl bg-slate-950/70
              border border-slate-600/70
              px-3 py-2 text-sm text-slate-50
              outline-none
              focus:border-cyan-400 focus:shadow-[0_0_0_1px_rgба(8,145,178,0.9)]
            "
          />
        </div>
      </div>

      {/* описание */}
      <div>
        <label className="block text-[12px] text-slate-300 mb-1">
          Описание
        </label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          placeholder="Состояние, комплектация, владельцы, что делали по машине…"
          className="
            w-full rounded-xl bg-slate-950/70
            border border-slate-600/70
            px-3 py-2 text-sm text-slate-50
            outline-none resize-none
            focus:border-cyan-400 focus:shadow-[0_0_0_1px_rgба(8,145,178,0.9)]
          "
        />
      </div>

      {/* фото с drag&drop */}
      <PhotosUploader
        photos={photos}
        onPhotoChange={onPhotoChange}
        onRemovePhoto={onRemovePhoto}
        onReorderPhotos={onReorderPhotos}
      />

      {/* кнопка */}
      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
};