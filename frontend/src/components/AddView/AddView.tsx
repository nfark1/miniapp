// src/components/AddView/AddView.tsx
import React, { useState } from "react";
import { AddForm } from "./AddForm";

export type AddFormData = {
  brand: string;
  model: string;
  price: number;
  year?: number;
  mileage?: number;
  district: string;
  desc?: string;
};

export type LocalPhoto = {
  file: File | null;
  preview: string;
};

type AddViewProps = {
  onBack: () => void;
  onSubmit: (data: AddFormData, files: File[]) => void | Promise<void>;
};

export const AddView: React.FC<AddViewProps> = ({ onBack, onSubmit }) => {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [price, setPrice] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");
  const [district, setDistrict] = useState("");
  const [desc, setDesc] = useState("");

  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReorderPhotos = (fromIndex: number, toIndex: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  // загрузка фото
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const next: LocalPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      next.push({ file, preview });
    }

    setPhotos((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
  setPhotos((prev) => {
    const copy = [...prev];
    const p = copy[index];
    if (p && p.file && p.preview.startsWith("blob:")) {
      URL.revokeObjectURL(p.preview);
    }
    copy.splice(index, 1);
    return copy;
  });
};

  // отправка формы
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const priceNum = Number(price.replace(/\s+/g, ""));
    const yearNum = year ? Number(year) : undefined;
    const mileageNum = mileage ? Number(mileage.replace(/\s+/g, "")) : undefined;

    if (!brand && !model) {
      alert("Укажи хотя бы марку или модель");
      return;
    }
    if (!priceNum || priceNum <= 0) {
      alert("Укажи корректную цену");
      return;
    }
    if (!district.trim()) {
      alert("Укажи район");
      return;
    }

    const formData: AddFormData = {
      brand: brand.trim(),
      model: model.trim(),
      price: priceNum,
      year: yearNum,
      mileage: mileageNum,
      district: district.trim(),
      desc: desc.trim() || undefined,
    };

        try {
          setIsSubmitting(true);

          const files: File[] = photos
            .map((p) => p.file)
            .filter((f): f is File => !!f); // 👈 убираем null

          await onSubmit(formData, files);
        } finally {
          setIsSubmitting(false);
        }
  };

  return (
    <div className="max-w-xl mx-auto px-0 pb-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="
            px-3 py-1.5 rounded-xl text-xs font-medium
            bg-slate-900/80 border border-slate-600/70
            active:scale-95
          "
        >
          ← Назад
        </button>
        <h1 className="text-[17px] font-semibold text-slate-50">
          Добавить объявление
        </h1>
      </div>

      <AddForm
        brand={brand}
        setBrand={setBrand}
        model={model}
        setModel={setModel}
        price={price}
        setPrice={setPrice}
        year={year}
        setYear={setYear}
        mileage={mileage}
        setMileage={setMileage}
        district={district}
        setDistrict={setDistrict}
        desc={desc}
        setDesc={setDesc}
        photos={photos}
        onPhotoChange={handlePhotoChange}
        onRemovePhoto={removePhoto}
        onReorderPhotos={handleReorderPhotos}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
};