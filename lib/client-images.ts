import type { DiaryImage } from "@/types/diary";

const MAX_IMAGE_EDGE = 1400;
const IMAGE_QUALITY = 0.72;

export async function compressDiaryImages(images: DiaryImage[]) {
  return Promise.all(
    images.map(async (image) => ({
      ...image,
      // Photos already on the server are links; they were compressed when first saved.
      dataUrl: image.dataUrl.startsWith("data:")
        ? await cropImageToDataUrl(image.dataUrl)
        : image.dataUrl
    }))
  );
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropImageToDataUrl(src: string, area?: CropArea): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const source = area ?? { x: 0, y: 0, width: image.width, height: image.height };
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(source.width, source.height));
      const width = Math.max(1, Math.round(source.width * scale));
      const height = Math.max(1, Math.round(source.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Could not prepare photo"));
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(
        image,
        source.x,
        source.y,
        source.width,
        source.height,
        0,
        0,
        width,
        height
      );
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    image.onerror = () => reject(new Error("Could not read photo"));
    image.src = src;
  });
}
