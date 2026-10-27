import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import type { DiaryEntry } from "@/types/diary";

const IMAGE_ROUTE = "/api/images/";

export async function getEntriesCollection() {
  const client = await getMongoClient();
  return client.db(getDatabaseName()).collection<DiaryEntry>("entries");
}

export function getImageUrl(imageId: string) {
  return `${IMAGE_ROUTE}${encodeURIComponent(imageId)}`;
}

// Photos live in MongoDB as data URLs; clients get a link per photo instead,
// so loading or saving one memory never carries every photo in the diary.
export function withImageUrls(entry: DiaryEntry): DiaryEntry {
  return {
    ...entry,
    images: entry.images.map((image) => ({ ...image, dataUrl: getImageUrl(image.id) }))
  };
}

export function isStoredImageUrl(value: string) {
  return value.startsWith(IMAGE_ROUTE);
}
