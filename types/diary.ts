export type WorkMode = "remote" | "onsite";

export interface WorkBlock {
  id: string;
  start: string; // "HH:MM", 24-hour
  end: string; // "HH:MM", 24-hour
  task: string;
  note?: string;
}

export interface DiaryImage {
  id: string;
  dataUrl: string;
  name: string;
  alt: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  workMode: WorkMode;
  workBlocks: WorkBlock[];
  images: DiaryImage[];
  createdAt: string;
  updatedAt: string;
}

export interface DiaryDraft {
  date: string;
  title: string;
  content: string;
  workMode: WorkMode;
  workBlocks: WorkBlock[];
  images: DiaryImage[];
}

export interface MemoryFilters {
  query: string;
  workMode: "All" | WorkMode;
  month: string;
  year: string;
}
