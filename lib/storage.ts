import type { DiaryEntry, WorkBlock } from "@/types/diary";
import {
  MAX_NOTE_LENGTH,
  MAX_TASK_LENGTH,
  MAX_WORK_BLOCKS,
  isValidTime,
  isWorkMode,
  sortBlocks
} from "@/lib/work";

export const STORAGE_KEY = "bloom-entries";
export const OWNER_PATTERN_KEY = "bloom-owner-pattern";
export const LAST_WORK_MODE_KEY = "bloom-last-work-mode";

export function getEntries(): DiaryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeEntries(parsed);
  } catch {
    return [];
  }
}

export function saveEntries(entries: DiaryEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Browser storage is full; MongoDB still holds the diary.
  }
}

export function getEntryByDate(date: string) {
  return getEntries().find((entry) => entry.date === date) ?? null;
}

export function getEntryById(id: string) {
  return getEntries().find((entry) => entry.id === id) ?? null;
}

export function normalizeEntries(value: unknown): DiaryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeEntry).filter(Boolean) as DiaryEntry[];
}

export function normalizeEntry(value: unknown): DiaryEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybe = value as Partial<DiaryEntry>;
  if (
    typeof maybe.id !== "string" ||
    typeof maybe.date !== "string" ||
    typeof maybe.title !== "string" ||
    typeof maybe.content !== "string"
  ) {
    return null;
  }

  return {
    id: maybe.id,
    date: maybe.date,
    title: maybe.title,
    content: maybe.content,
    workMode: isWorkMode(maybe.workMode) ? maybe.workMode : "remote",
    workBlocks: normalizeBlocks(maybe.workBlocks),
    images: Array.isArray(maybe.images)
      ? maybe.images.filter(
          (image) =>
            image &&
            typeof image.id === "string" &&
            typeof image.dataUrl === "string" &&
            typeof image.name === "string"
        )
      : [],
    createdAt:
      typeof maybe.createdAt === "string" ? maybe.createdAt : new Date().toISOString(),
    updatedAt:
      typeof maybe.updatedAt === "string" ? maybe.updatedAt : new Date().toISOString()
  };
}

function normalizeBlocks(value: unknown): WorkBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const blocks = value.flatMap((item): WorkBlock[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const maybe = item as Partial<WorkBlock>;
    if (
      typeof maybe.id !== "string" ||
      typeof maybe.start !== "string" ||
      typeof maybe.end !== "string" ||
      typeof maybe.task !== "string" ||
      !isValidTime(maybe.start) ||
      !isValidTime(maybe.end)
    ) {
      return [];
    }

    const note = typeof maybe.note === "string" ? maybe.note.trim().slice(0, MAX_NOTE_LENGTH) : "";
    return [
      {
        id: maybe.id,
        start: maybe.start,
        end: maybe.end,
        task: maybe.task.slice(0, MAX_TASK_LENGTH),
        ...(note ? { note } : {})
      }
    ];
  });

  return sortBlocks(blocks).slice(0, MAX_WORK_BLOCKS);
}
