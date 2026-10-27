import { cache } from "react";
import { getDatabaseName, getMongoClient, hasMongoConfig } from "@/lib/mongodb";
import { normalizeEntry } from "@/lib/storage";
import type { DiaryEntry } from "@/types/diary";

export const getSharedEntry = cache(async (date: string): Promise<DiaryEntry | null> => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !hasMongoConfig()) {
    return null;
  }

  try {
    const client = await getMongoClient();
    const entry = await client
      .db(getDatabaseName())
      .collection("entries")
      .findOne({ date }, { projection: { _id: 0 } });

    return normalizeEntry(entry);
  } catch {
    return null;
  }
});

export function shareExcerpt(content: string, maxLength = 160) {
  const text = content.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text
    .slice(0, maxLength)
    .replace(/\s+\S*$/, "")
    .replace(/[\s.,;:!?—-]+$/, "")}…`;
}
