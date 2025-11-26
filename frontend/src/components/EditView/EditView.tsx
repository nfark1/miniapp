// src/components/EditView/EditView.tsx
import React, { useMemo, useState } from "react";
import { AddForm } from "../AddView/AddForm";
import type { Listing } from "../../types/types";
import type { AddFormData, LocalPhoto } from "../AddView/AddView";

type EditViewProps = {
  item: Listing;
  onBack: () => void;
  onSubmit: (data: AddFormData, photos: LocalPhoto[]) => void | Promise<void>;
};

export const EditView: React.FC<EditViewProps> = ({ item, onBack, onSubmit }) => {
  // 🧠 Разбираем title на "марку" и "модель"
  const [initialBrand, initialModel] = useMemo(() => {
    if (!item.title) return ["", ""];
    const parts = item.title.split(" ");
    if (parts.length === 1) return [parts[0], ""];
    return [parts[0], parts.slice(1).join(" ")];
  }, [item.title]);

  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [price, setPrice] = useState<string>(item.price.toString());
  const [year, setYear] = useState<string>(item.year ? String(item.year) : "");
  const [mileage, setMileage] = useState<string>(
    item.mileage != null ? String(item.mileage) : "",
  );
  const [district, setDistrict] = useState<string>(item.district ?? "");
  const [desc, setDesc] = useState<string>(item.desc ?? "");

  // 👇 стартуем с уже существующими фотками
  const initialPhotos: LocalPhoto[] = useMemo(
    () =>
      (item.photos || []).map((url) => ({
        file: null,
        preview: url,
      })),
    [item.photos],
  );

  const [photos, setPhotos] = useState<LocalPhoto[]>(initialPhotos);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // добавление новых фото
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

  // удалить фото
  const handleRemovePhoto = (index: number) => {
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

  // перетаскивание фото
  const handleReorderPhotos = (fromIndex: number, toIndex: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      // 👇 отдаём родителю форму + ВСЕ фотки с порядком
      await onSubmit(formData, photos);
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
          Редактировать объявление
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
        onRemovePhoto={handleRemovePhoto}
        onReorderPhotos={handleReorderPhotos}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default EditView;