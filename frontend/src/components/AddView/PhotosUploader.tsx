// src/components/AddView/PhotosUploader.tsx
import React from "react";
import type { LocalPhoto } from "./AddView";

import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type PhotosUploaderProps = {
  photos: LocalPhoto[];
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onReorderPhotos: (fromIndex: number, toIndex: number) => void;
};

export const PhotosUploader: React.FC<PhotosUploaderProps> = ({
  photos,
  onPhotoChange,
  onRemovePhoto,
  onReorderPhotos,
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const ids = photos.map((p) => p.preview);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorderPhotos(oldIndex, newIndex);
  };

  return (
    <div className="space-y-2.5">
      <label className="block text-[12px] text-slate-300">
        Фотографии
      </label>

      {photos.length > 0 && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-5 gap-2">
              {photos.map((p, i) => (
                <SortablePhoto
                  key={p.preview}
                  id={p.preview}
                  index={i}
                  photo={p}
                  onRemove={() => onRemovePhoto(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <label
        className="
          block w-full mt-1
          py-3 rounded-2xl text-center
          bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.25),transparent_60%),rgba(8,16,32,0.98)]
          border border-cyan-300/50
          text-[14px] font-semibold text-sky-50
          shadow-[0_0_0_1px_rgba(15,23,42,1),0_0_22px_rgba(56,189,248,0.6)]
          active:scale-[0.98]
          transition cursor-pointer
        "
      >
        📸 Добавить фото
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onPhotoChange}
          className="hidden"
        />
      </label>
    </div>
  );
};

type SortablePhotoProps = {
  id: string;
  index: number;
  photo: LocalPhoto;
  onRemove: () => void;
};

const SortablePhoto: React.FC<SortablePhotoProps> = ({
  id,
  photo,
  onRemove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="
        relative
        w-full aspect-square
        rounded-xl overflow-hidden
        border border-slate-700/70
        bg-slate-900
        shadow-[0_8px_24px_rgba(0,0,0,0.8)]
      "
    >
      {/* слой для DnD */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-10"
        style={{ touchAction: "none" }}
      />

      <img
        src={photo.preview}
        alt="preview"
        className="w-full h-full object-cover"
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="
          absolute top-1 right-1 z-20
          w-6 h-6 rounded-full
          bg-black/70 text-white text-xs
          flex items-center justify-center
          shadow-[0_0_10px_rgba(0,0,0,0.9)]
          active:scale-95
        "
      >
        ×
      </button>
    </div>
  );
};