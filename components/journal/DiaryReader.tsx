"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { ShareMemory } from "@/components/journal/ShareMemory";
import { WorkSummary, WorkTimeline } from "@/components/journal/WorkDisplay";
import { sortEntries } from "@/lib/diary";
import { formatLongDate, formatWeekday } from "@/lib/utils";
import type { DiaryEntry } from "@/types/diary";

interface DiaryReaderProps {
  entry: DiaryEntry;
  entries: DiaryEntry[];
  onClose: () => void;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
  onNavigate: (entry: DiaryEntry) => void;
  canManage: boolean;
}

export function DiaryReader({
  entry,
  entries,
  onClose,
  onEdit,
  onDelete,
  onNavigate,
  canManage
}: DiaryReaderProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const orderedEntries = useMemo(() => sortEntries(entries), [entries]);
  const currentIndex = orderedEntries.findIndex((item) => item.id === entry.id);
  const previous = orderedEntries[currentIndex + 1] ?? null;
  const next = orderedEntries[currentIndex - 1] ?? null;
  const [coverImage, ...extraImages] = entry.images;

  return (
    <motion.div
      className="reader-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-title"
    >
      <motion.article
        className="reader-page"
        initial={{ opacity: 0, y: 30, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.985 }}
        transition={{ duration: 0.35 }}
      >
        <button className="reader-close" type="button" aria-label="Close reader" onClick={onClose}>
          <X size={20} />
        </button>

        <section className="reader-hero">
          <div className="reader-hero-copy">
            <header className="reader-header">
              <time dateTime={entry.date}>{formatLongDate(entry.date)}</time>
              <span>{formatWeekday(entry.date)}</span>
              <h2 id="reader-title">{entry.title}</h2>
              <WorkSummary mode={entry.workMode} blocks={entry.workBlocks} />
            </header>
          </div>

          {coverImage ? (
            <div className="reader-cover">
              <Image src={coverImage.dataUrl} alt={coverImage.alt} fill sizes="(min-width: 900px) 520px, 100vw" unoptimized />
            </div>
          ) : null}
        </section>

        {extraImages.length ? (
          <div className="reader-gallery">
            {extraImages.map((image) => (
              <div key={image.id}>
                <Image src={image.dataUrl} alt={image.alt} fill sizes="280px" unoptimized />
              </div>
            ))}
          </div>
        ) : null}

        {entry.workBlocks.length ? (
          <div className="work-section">
            <WorkTimeline mode={entry.workMode} blocks={entry.workBlocks} />
          </div>
        ) : null}

        <div className="reader-story">
          {entry.content.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <footer className="reader-footer">
          <div className="reader-stepper">
            <button type="button" disabled={!previous} onClick={() => previous && onNavigate(previous)}>
              <ChevronLeft size={17} />
              Previous day
            </button>
            <button type="button" disabled={!next} onClick={() => next && onNavigate(next)}>
              Next day
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="reader-actions">
            <ShareMemory entry={entry} align="end" />
            {canManage ? (
              <>
                <button type="button" onClick={() => onEdit(entry)}>
                  <Pencil size={16} />
                  Edit
                </button>
                <button type="button" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </footer>

        {confirmingDelete ? (
          <div className="confirm-delete" role="alertdialog" aria-labelledby="delete-title">
            <div>
              <h3 id="delete-title">Delete this day?</h3>
              <p>This day will be removed from your diary.</p>
            </div>
            <div>
              <button type="button" className="quiet-button" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={() => onDelete(entry.id)}>
                Delete day
              </button>
            </div>
          </div>
        ) : null}
      </motion.article>
    </motion.div>
  );
}
