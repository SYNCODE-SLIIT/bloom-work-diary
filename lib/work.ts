import type { WorkBlock, WorkMode } from "@/types/diary";

export const MAX_WORK_BLOCKS = 30;
export const MAX_TASK_LENGTH = 200;
export const MAX_NOTE_LENGTH = 400;

export const workModeOptions: Array<{ mode: WorkMode; label: string }> = [
  { mode: "remote", label: "Work from home" },
  { mode: "onsite", label: "Onsite" }
];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isWorkMode(value: unknown): value is WorkMode {
  return value === "remote" || value === "onsite";
}

export function workModeLabel(mode: WorkMode) {
  return mode === "onsite" ? "Onsite" : "Work from home";
}

export function isValidTime(value: string) {
  return TIME_PATTERN.test(value);
}

export function timeToMinutes(value: string) {
  const match = TIME_PATTERN.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function minutesToTime(minutes: number) {
  const clamped = Math.min(Math.max(Math.round(minutes), 0), 23 * 60 + 59);
  const hours = String(Math.floor(clamped / 60)).padStart(2, "0");
  const mins = String(clamped % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

// "13:05" -> "1:05 PM". Done by hand so server and browser always agree.
export function formatClock(value: string) {
  const minutes = timeToMinutes(value);
  if (minutes === null) {
    return value;
  }

  const hours = Math.floor(minutes / 60);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(block: Pick<WorkBlock, "start" | "end">) {
  return `${formatClock(block.start)} – ${formatClock(block.end)}`;
}

/** Length of one block in minutes, or 0 when its times are missing or end is not after start. */
export function blockMinutes(block: Pick<WorkBlock, "start" | "end">) {
  const start = timeToMinutes(block.start);
  const end = timeToMinutes(block.end);
  return start !== null && end !== null && end > start ? end - start : 0;
}

export type BlockProblem = "missing-time" | "end-before-start";

/** Time problems only; a blank task is checked separately so it can wait until she saves. */
export function getTimeProblem(block: Pick<WorkBlock, "start" | "end">): BlockProblem | null {
  const start = timeToMinutes(block.start);
  const end = timeToMinutes(block.end);

  if (start === null || end === null) {
    return "missing-time";
  }

  return end > start ? null : "end-before-start";
}

export function sortBlocks<T extends Pick<WorkBlock, "start" | "end">>(blocks: T[]) {
  return [...blocks].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
  );
}

/** Ids of blocks whose time overlaps another block. Back-to-back blocks do not overlap. */
export function findOverlappingIds(blocks: WorkBlock[]) {
  const timed = blocks
    .map((block) => ({
      id: block.id,
      start: timeToMinutes(block.start),
      end: timeToMinutes(block.end)
    }))
    .filter(
      (block): block is { id: string; start: number; end: number } =>
        block.start !== null && block.end !== null && block.end > block.start
    );

  const overlapping = new Set<string>();
  for (let i = 0; i < timed.length; i += 1) {
    for (let j = i + 1; j < timed.length; j += 1) {
      if (timed[i].start < timed[j].end && timed[j].start < timed[i].end) {
        overlapping.add(timed[i].id);
        overlapping.add(timed[j].id);
      }
    }
  }

  return overlapping;
}

/** Total worked minutes. Overlapping time is only counted once. */
export function totalMinutes(blocks: Array<Pick<WorkBlock, "start" | "end">>) {
  const ranges = blocks
    .map((block) => ({ start: timeToMinutes(block.start), end: timeToMinutes(block.end) }))
    .filter(
      (range): range is { start: number; end: number } =>
        range.start !== null && range.end !== null && range.end > range.start
    )
    .sort((a, b) => a.start - b.start);

  let total = 0;
  let currentEnd = -1;
  for (const range of ranges) {
    const from = Math.max(range.start, currentEnd);
    if (range.end > from) {
      total += range.end - from;
      currentEnd = range.end;
    }
  }

  return total;
}

/** 450 -> "7h 30m", 45 -> "45m", 120 -> "2h". */
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

/** Hours with at most one decimal for the stats strip: 2250 -> "37.5". */
export function formatHours(minutes: number) {
  return String(Number((minutes / 60).toFixed(1)));
}

export function taskCountLabel(count: number) {
  return `${count} ${count === 1 ? "task" : "tasks"}`;
}

/** The bottom line of the share card, e.g. "Onsite · 7h 30m · 4 tasks". */
export function summaryLine(mode: WorkMode, blocks: WorkBlock[]) {
  const parts: string[] = [workModeLabel(mode)];
  const minutes = totalMinutes(blocks);

  if (minutes > 0) {
    parts.push(formatDuration(minutes));
  }
  if (blocks.length > 0) {
    parts.push(taskCountLabel(blocks.length));
  }

  return parts.join(" · ");
}
