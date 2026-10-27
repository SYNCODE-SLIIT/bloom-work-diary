"use client";

import { ChangeEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Crop, ImagePlus, Star, X } from "lucide-react";
import NextImage from "next/image";
import { ImageCropper } from "@/components/journal/ImageCropper";
import { cropImageToDataUrl, type CropArea } from "@/lib/client-images";
import { createId } from "@/lib/utils";
import type { DiaryImage } from "@/types/diary";

const MAX_PHOTOS = 8;

interface PhotoUploaderProps {
  images: DiaryImage[];
  onChange: (images: DiaryImage[]) => void;
}

interface PendingPhoto {
  src: string;
  name: string;
  isObjectUrl: boolean;
  replaceId?: string;
}

export function PhotoUploader({ images, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<PendingPhoto[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openSlots = MAX_PHOTOS - images.length;
  const current = queue[0];

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );
    event.target.value = "";
    setError("");

    if (files.length > openSlots) {
      setError(`A memory can hold ${MAX_PHOTOS} photos, so only the first ${openSlots} were added.`);
    }

    const pending = files.slice(0, Math.max(0, openSlots)).map((file) => ({
      src: URL.createObjectURL(file),
      name: file.name,
      isObjectUrl: true
    }));

    if (pending.length) {
      setQueue(pending);
      setQueueTotal(pending.length);
    }
  }

  function recrop(image: DiaryImage) {
    setError("");
    setQueue([{ src: image.dataUrl, name: image.name, isObjectUrl: false, replaceId: image.id }]);
    setQueueTotal(1);
  }

  function makeCover(id: string) {
    const cover = images.find((image) => image.id === id);
    if (cover) {
      onChange([cover, ...images.filter((image) => image.id !== id)]);
    }
  }

  function finishCurrent() {
    if (current?.isObjectUrl) {
      URL.revokeObjectURL(current.src);
    }
    setQueue((items) => items.slice(1));
  }

  async function addCurrent(area?: CropArea) {
    if (!current) {
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await cropImageToDataUrl(current.src, area);
      // A new id on every crop, so cached copies of the old photo are never shown.
      const image: DiaryImage = {
        id: createId("image"),
        dataUrl,
        name: current.name,
        alt: `Memory photo named ${current.name}`
      };

      onChange(
        current.replaceId
          ? images.map((item) => (item.id === current.replaceId ? image : item))
          : [...images, image]
      );
    } catch {
      setError(`"${current.name}" could not be added.`);
    } finally {
      setBusy(false);
      finishCurrent();
    }
  }

  return (
    <section className="photo-panel" aria-labelledby="photos-heading">
      <div className="photo-panel-head">
        <div>
          <span id="photos-heading">Photos</span>
          <p>
            {images.length
              ? `${images.length} of ${MAX_PHOTOS} photos. The first one is the cover.`
              : `Add up to ${MAX_PHOTOS} photos and crop each one.`}
          </p>
        </div>
        <div className="photo-actions">
          <button
            className="quiet-button"
            type="button"
            disabled={openSlots <= 0}
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={17} />
            Take photo
          </button>
          <button
            className="quiet-button"
            type="button"
            disabled={openSlots <= 0}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={17} />
            Add photos
          </button>
        </div>
      </div>
      <input
        ref={cameraInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFiles}
      />
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {images.length ? (
        <div className="photo-grid">
          {images.map((image, index) => (
            <figure key={image.id}>
              <NextImage src={image.dataUrl} alt={image.alt} fill sizes="180px" unoptimized />
              {index === 0 ? <span className="photo-cover-badge">Cover</span> : null}
              <div className="photo-tools">
                {index > 0 ? (
                  <button
                    type="button"
                    aria-label={`Make ${image.name} the cover`}
                    title="Make cover"
                    onClick={() => makeCover(image.id)}
                  >
                    <Star size={15} />
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={`Crop ${image.name}`}
                  title="Crop"
                  onClick={() => recrop(image)}
                >
                  <Crop size={15} />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${image.name}`}
                  title="Remove"
                  onClick={() => onChange(images.filter((item) => item.id !== image.id))}
                >
                  <X size={15} />
                </button>
              </div>
            </figure>
          ))}
        </div>
      ) : null}

      {current
        ? createPortal(
          <ImageCropper
            key={current.src}
            src={current.src}
            heading={
              current.replaceId
                ? "Crop photo"
                : `Crop photo ${queueTotal - queue.length + 1} of ${queueTotal}`
            }
            busy={busy}
            dismissLabel={current.replaceId ? "Cancel" : "Skip photo"}
            onCrop={(area) => addCurrent(area)}
            onUseFull={() => addCurrent()}
            onDismiss={finishCurrent}
          />,
          document.body
        )
        : null}
    </section>
  );
}
