"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Cropper, { type Area } from "react-easy-crop";
import { Crop, ImageIcon, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCropperProps {
  src: string;
  heading: string;
  busy: boolean;
  dismissLabel: string;
  onCrop: (area: Area) => void;
  onUseFull: () => void;
  onDismiss: () => void;
}

const ratios = [
  { label: "Original", value: null },
  { label: "Square", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 }
];

export function ImageCropper({
  src,
  heading,
  busy,
  dismissLabel,
  onCrop,
  onUseFull,
  onDismiss
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState<number | null>(null);
  const [mediaRatio, setMediaRatio] = useState(4 / 3);
  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onDismiss();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [busy, onDismiss]);

  return (
    <motion.div
      className="crop-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-heading"
    >
      <motion.div
        className="crop-panel"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="crop-head">
          <Crop size={18} />
          <h3 id="crop-heading">{heading}</h3>
        </div>

        <div className="crop-area">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={ratio ?? mediaRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
            onMediaLoaded={(media) => setMediaRatio(media.naturalWidth / media.naturalHeight)}
          />
        </div>

        <div className="crop-ratios" role="group" aria-label="Crop shape">
          {ratios.map((option) => (
            <button
              key={option.label}
              type="button"
              className={cn("tag-chip", option.value === ratio && "active")}
              aria-pressed={option.value === ratio}
              onClick={() => setRatio(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="crop-zoom">
          <ZoomIn size={16} />
          <span className="sr-only">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        <div className="crop-actions">
          <button className="quiet-button" type="button" disabled={busy} onClick={onDismiss}>
            {dismissLabel}
          </button>
          <button className="quiet-button" type="button" disabled={busy} onClick={onUseFull}>
            <ImageIcon size={16} />
            Whole photo
          </button>
          <button
            className="primary-button small"
            type="button"
            disabled={busy || !area}
            onClick={() => area && onCrop(area)}
          >
            <Crop size={16} />
            {busy ? "Preparing..." : "Crop photo"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
