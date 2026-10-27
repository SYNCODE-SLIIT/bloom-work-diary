"use client";

import { useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, CircleAlert, Info, Plus, Trash2 } from "lucide-react";
import { cn, createId } from "@/lib/utils";
import {
  MAX_NOTE_LENGTH,
  MAX_TASK_LENGTH,
  MAX_WORK_BLOCKS,
  findOverlappingIds,
  formatDuration,
  getTimeProblem,
  minutesToTime,
  sortBlocks,
  timeToMinutes,
  totalMinutes
} from "@/lib/work";
import type { WorkBlock } from "@/types/diary";

interface WorkTimelineEditorProps {
  blocks: WorkBlock[];
  onChange: (blocks: WorkBlock[]) => void;
  /** Turns on the "say what you worked on" prompts once she has tried to save. */
  showErrors: boolean;
}

const timeMessages = {
  "missing-time": "Pick both a start and an end time.",
  "end-before-start": "The end time needs to come after the start time."
} as const;

/** True when any block would stop the day from being saved. */
export function hasBlockErrors(blocks: WorkBlock[]) {
  return blocks.some((block) => getTimeProblem(block) !== null || !block.task.trim());
}

export function WorkTimelineEditor({ blocks, onChange, showErrors }: WorkTimelineEditorProps) {
  const baseId = useId();
  const addRef = useRef<HTMLButtonElement>(null);
  const startAtFocus = useRef<Record<string, string>>({});

  const overlapping = findOverlappingIds(blocks);
  const minutes = totalMinutes(blocks);

  function updateBlock(id: string, patch: Partial<WorkBlock>) {
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  }

  function addBlock() {
    const lastEnd = blocks.length ? timeToMinutes(blocks[blocks.length - 1].end) : null;
    const startMinutes = lastEnd ?? 9 * 60;
    const start = minutesToTime(startMinutes);
    const end = minutesToTime(Math.min(startMinutes + 60, 23 * 60 + 59));

    onChange([...blocks, { id: createId("block"), start, end, task: "" }]);
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((block) => block.id !== id));
    addRef.current?.focus();
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) {
      return;
    }

    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  // Once a start time is settled, tidy the rows into time order.
  function settleStart(id: string, value: string) {
    if (startAtFocus.current[id] === value) {
      return;
    }

    const sorted = sortBlocks(blocks);
    if (sorted.some((block, index) => block.id !== blocks[index].id)) {
      onChange(sorted);
    }
  }

  return (
    <section className="timeline-editor" aria-labelledby={`${baseId}-heading`}>
      <div className="timeline-head">
        <h3 id={`${baseId}-heading`}>My work timeline</h3>
        {blocks.length > 0 && minutes > 0 ? (
          <span className="timeline-total" role="status">
            Total {formatDuration(minutes)}
          </span>
        ) : null}
      </div>

      {blocks.length === 0 ? (
        <p className="timeline-hint">
          Add the stretches of your day, like 9:00 to 11:30 on the client report.
        </p>
      ) : null}

      <ul className="block-list">
        <AnimatePresence initial={false}>
          {blocks.map((block, index) => {
            const problem = getTimeProblem(block);
            const taskMissing = showErrors && !block.task.trim();
            const overlaps = overlapping.has(block.id);
            const messageId = `${baseId}-${block.id}-message`;
            const hasMessage = problem !== null || taskMissing || overlaps;

            return (
              <motion.li
                key={block.id}
                layout="position"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: -10 }}
                transition={{ duration: 0.2 }}
                className={cn("block-row", overlaps && "has-overlap")}
              >
                <div className="block-times">
                  <label className="time-field">
                    <span>Start</span>
                    <input
                      className="block-input"
                      type="time"
                      step={60}
                      value={block.start}
                      aria-invalid={problem !== null}
                      aria-describedby={hasMessage ? messageId : undefined}
                      onFocus={() => {
                        startAtFocus.current[block.id] = block.start;
                      }}
                      onChange={(event) => updateBlock(block.id, { start: event.target.value })}
                      onBlur={(event) => settleStart(block.id, event.target.value)}
                    />
                  </label>
                  <label className="time-field">
                    <span>End</span>
                    <input
                      className="block-input"
                      type="time"
                      step={60}
                      value={block.end}
                      aria-invalid={problem !== null}
                      aria-describedby={hasMessage ? messageId : undefined}
                      onChange={(event) => updateBlock(block.id, { end: event.target.value })}
                    />
                  </label>
                </div>

                <div className="block-actions">
                  <button
                    type="button"
                    aria-label={`Move block ${index + 1} up`}
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => moveBlock(index, -1)}
                  >
                    <ArrowUp size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move block ${index + 1} down`}
                    title="Move down"
                    disabled={index === blocks.length - 1}
                    onClick={() => moveBlock(index, 1)}
                  >
                    <ArrowDown size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove block ${index + 1}`}
                    title="Remove"
                    onClick={() => removeBlock(block.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="block-fields">
                  <label className="sr-only" htmlFor={`${baseId}-${block.id}-task`}>
                    What did you work on? (block {index + 1})
                  </label>
                  <input
                    id={`${baseId}-${block.id}-task`}
                    className="block-input"
                    value={block.task}
                    maxLength={MAX_TASK_LENGTH}
                    placeholder="What did you work on?"
                    aria-invalid={taskMissing}
                    aria-describedby={hasMessage ? messageId : undefined}
                    onChange={(event) => updateBlock(block.id, { task: event.target.value })}
                  />
                  <label className="sr-only" htmlFor={`${baseId}-${block.id}-note`}>
                    Short note, optional (block {index + 1})
                  </label>
                  <input
                    id={`${baseId}-${block.id}-note`}
                    className="block-input"
                    value={block.note ?? ""}
                    maxLength={MAX_NOTE_LENGTH}
                    placeholder="A short note (optional)"
                    onChange={(event) => updateBlock(block.id, { note: event.target.value })}
                  />
                </div>

                {hasMessage ? (
                  <p
                    id={messageId}
                    className={cn("block-message", (problem !== null || taskMissing) && "error")}
                    role={problem !== null || taskMissing ? "alert" : undefined}
                  >
                    {problem !== null || taskMissing ? (
                      <CircleAlert size={15} aria-hidden="true" />
                    ) : (
                      <Info size={15} aria-hidden="true" />
                    )}
                    <span>
                      {problem !== null
                        ? timeMessages[problem]
                        : taskMissing
                          ? "Add a few words about what you worked on."
                          : "This overlaps another block. That is fine, the overlap is only counted once in your total."}
                    </span>
                  </p>
                ) : null}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <button
        ref={addRef}
        type="button"
        className="quiet-button add-block-button"
        disabled={blocks.length >= MAX_WORK_BLOCKS}
        onClick={addBlock}
      >
        <Plus size={16} />
        Add time block
      </button>
    </section>
  );
}
