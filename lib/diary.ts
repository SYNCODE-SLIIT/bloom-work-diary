import type { DiaryDraft, DiaryEntry, WorkMode } from "@/types/diary";
import { createId, monthKey, yearKey } from "@/lib/utils";
import {
  MAX_NOTE_LENGTH,
  MAX_TASK_LENGTH,
  MAX_WORK_BLOCKS,
  isWorkMode,
  sortBlocks,
  totalMinutes
} from "@/lib/work";

export function createEntry(draft: DiaryDraft): DiaryEntry {
  const now = new Date().toISOString();

  return {
    ...sanitizeDraft(draft),
    id: createId(),
    createdAt: now,
    updatedAt: now
  };
}

export function updateEntry(entry: DiaryEntry, draft: DiaryDraft): DiaryEntry {
  return {
    ...entry,
    ...sanitizeDraft(draft),
    updatedAt: new Date().toISOString()
  };
}

export function deleteEntry(entries: DiaryEntry[], id: string) {
  return entries.filter((entry) => entry.id !== id);
}

export function getEntryByDate(entries: DiaryEntry[], date: string) {
  return entries.find((entry) => entry.date === date) ?? null;
}

export function getEntryById(entries: DiaryEntry[], id: string) {
  return entries.find((entry) => entry.id === id) ?? null;
}

export function sortEntries(entries: DiaryEntry[]) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function filterEntries(
  entries: DiaryEntry[],
  filters: {
    query: string;
    workMode: "All" | WorkMode;
    month: string;
    year: string;
  }
) {
  const query = filters.query.trim().toLowerCase();

  return sortEntries(entries).filter((entry) => {
    const searchable = [entry.title, entry.content, ...entry.workBlocks.map((block) => block.task)]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || searchable.includes(query);
    const matchesMode = filters.workMode === "All" || entry.workMode === filters.workMode;
    const matchesMonth = !filters.month || monthKey(entry.date) === filters.month;
    const matchesYear = !filters.year || yearKey(entry.date) === filters.year;

    return matchesQuery && matchesMode && matchesMonth && matchesYear;
  });
}

export function getMemoryStats(entries: DiaryEntry[]) {
  return {
    days: entries.length,
    minutes: entries.reduce((sum, entry) => sum + totalMinutes(entry.workBlocks), 0),
    onsiteDays: entries.filter((entry) => entry.workMode === "onsite").length
  };
}

export function sanitizeDraft(draft: DiaryDraft): DiaryDraft {
  return {
    date: draft.date,
    title: draft.title.trim() || "Untitled day",
    content: draft.content.trim(),
    workMode: isWorkMode(draft.workMode) ? draft.workMode : "remote",
    workBlocks: sanitizeBlocks(draft.workBlocks),
    images: draft.images
  };
}

export function sanitizeBlocks(blocks: DiaryDraft["workBlocks"]) {
  return sortBlocks(
    blocks
      .map((block) => {
        const note = block.note?.trim().slice(0, MAX_NOTE_LENGTH);
        return {
          id: block.id,
          start: block.start,
          end: block.end,
          task: block.task.trim().slice(0, MAX_TASK_LENGTH),
          ...(note ? { note } : {})
        };
      })
      .filter((block) => block.task)
  ).slice(0, MAX_WORK_BLOCKS);
}
