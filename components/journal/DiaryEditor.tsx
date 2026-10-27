"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Save } from "lucide-react";
import { motion } from "framer-motion";
import { PhotoUploader } from "@/components/journal/PhotoUploader";
import { DatePicker } from "@/components/journal/DatePicker";
import { WorkModeSwitch } from "@/components/journal/WorkModeSwitch";
import { WorkTimelineEditor, hasBlockErrors } from "@/components/journal/WorkTimelineEditor";
import { formatLongDate, formatWeekday, toDateInputValue } from "@/lib/utils";
import { sortBlocks } from "@/lib/work";
import type { DiaryDraft, DiaryEntry, DiaryImage, WorkBlock, WorkMode } from "@/types/diary";

interface DiaryEditorProps {
  selectedDate: string;
  existingEntry: DiaryEntry | null;
  editingEntry: DiaryEntry | null;
  /** The mode she used last time; new days start on it. */
  defaultWorkMode: WorkMode;
  onDateChange: (date: string) => void;
  onSave: (draft: DiaryDraft) => void;
  onViewEntry: (entry: DiaryEntry) => void;
  onEditEntry: (entry: DiaryEntry) => void;
}

export function DiaryEditor({
  selectedDate,
  existingEntry,
  editingEntry,
  defaultWorkMode,
  onDateChange,
  onSave,
  onViewEntry,
  onEditEntry
}: DiaryEditorProps) {
  const initial = editingEntry;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [workMode, setWorkMode] = useState<WorkMode>(initial?.workMode ?? defaultWorkMode);
  const [workBlocks, setWorkBlocks] = useState<WorkBlock[]>(initial?.workBlocks ?? []);
  const [images, setImages] = useState<DiaryImage[]>(initial?.images ?? []);
  const [detailsOpen, setDetailsOpen] = useState(
    Boolean(initial && (initial.workBlocks.length > 0 || initial.images.length > 0))
  );
  const [showBlockErrors, setShowBlockErrors] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  const canSave = content.trim().length > 0 || title.trim().length > 0;
  const blockErrors = hasBlockErrors(workBlocks);
  const dateLabel = useMemo(() => formatLongDate(selectedDate), [selectedDate]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || existingEntry) {
      return;
    }

    if (blockErrors) {
      // Keep the day on screen until the time blocks are fixed.
      setShowBlockErrors(true);
      setDetailsOpen(true);
      window.setTimeout(() => {
        drawerRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus({ preventScroll: false });
      }, 280);
      return;
    }

    onSave({
      date: selectedDate,
      title,
      content,
      workMode,
      workBlocks: sortBlocks(workBlocks),
      images
    });

    if (!editingEntry) {
      setTitle("");
      setContent("");
      setWorkBlocks([]);
      setImages([]);
      setDetailsOpen(false);
      setShowBlockErrors(false);
    }
  }

  return (
    <motion.section
      className="diary-page"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55 }}
      aria-labelledby="editor-heading"
    >
      <div className="editor-date-row">
        <div>
          <p className="eyebrow">
            {editingEntry
              ? "Revisiting"
              : selectedDate === toDateInputValue()
                ? "Today's page"
                : "Earlier page"}
          </p>
          <h2 id="editor-heading">{dateLabel}</h2>
          <span>{formatWeekday(selectedDate)}</span>
        </div>
        <DatePicker value={selectedDate} onChange={onDateChange} />
      </div>

      {existingEntry ? (
        <div className="duplicate-note" role="status">
          <CalendarDays size={20} />
          <div>
            <strong>You already have an entry for this day.</strong>
            <p>Open it as a story, or edit the page you wrote earlier.</p>
          </div>
          <div className="duplicate-actions">
            <button type="button" className="quiet-button" onClick={() => onViewEntry(existingEntry)}>
              View entry
            </button>
            <button type="button" className="primary-button small" onClick={() => onEditEntry(existingEntry)}>
              Edit entry
            </button>
          </div>
        </div>
      ) : (
        <form className="editor-form" onSubmit={handleSubmit} noValidate>
          <label className="field-label" htmlFor="entry-title">
            How did your day go?
          </label>
          <input
            id="entry-title"
            className="title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="A short title"
          />

          <label className="sr-only" htmlFor="entry-content">
            Diary entry
          </label>
          <textarea
            id="entry-content"
            className="story-textarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Today I..."
            rows={10}
          />

          <WorkModeSwitch value={workMode} onChange={setWorkMode} />

          <section className="details-drawer" ref={drawerRef}>
            <button
              className="details-toggle"
              type="button"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((value) => !value)}
            >
              <span>Add work timeline &amp; photos</span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>

            {detailsOpen ? (
              <motion.div
                className="details-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.24 }}
              >
                <WorkTimelineEditor
                  blocks={workBlocks}
                  onChange={setWorkBlocks}
                  showErrors={showBlockErrors}
                />

                <PhotoUploader images={images} onChange={setImages} />
              </motion.div>
            ) : null}
          </section>

          {blockErrors && showBlockErrors ? (
            <p className="form-error" role="alert">
              A few time blocks need a look before this day can be saved.
            </p>
          ) : null}

          <button className="save-button" type="submit" disabled={!canSave}>
            <Save size={18} />
            {editingEntry ? "Update this day" : "Save this day"}
          </button>
        </form>
      )}
    </motion.section>
  );
}
