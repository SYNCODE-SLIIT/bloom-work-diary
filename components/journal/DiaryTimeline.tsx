"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, PenLine, Pencil, X } from "lucide-react";
import Image from "next/image";
import { ShareMemory } from "@/components/journal/ShareMemory";
import { WorkSummary, WorkTimeline } from "@/components/journal/WorkDisplay";
import { cn, formatLongDate, monthKey, parseLocalDate, toDateInputValue } from "@/lib/utils";
import { workModeLabel } from "@/lib/work";
import type { DiaryEntry } from "@/types/diary";

interface DiaryTimelineProps {
  entries: DiaryEntry[];
  totalEntries: number;
  onOpen: (entry: DiaryEntry) => void;
  onEdit: (entry: DiaryEntry) => void;
  onWrite: (date: string) => void;
  canManage: boolean;
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DiaryTimeline({
  entries,
  totalEntries,
  onOpen,
  onEdit,
  onWrite,
  canManage
}: DiaryTimelineProps) {
  const today = toDateInputValue();
  const [viewMonth, setViewMonth] = useState(() => monthKey(entries[0]?.date ?? today));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const storyRef = useRef<HTMLElement>(null);

  const entriesByDate = useMemo(
    () => new Map(entries.map((entry) => [entry.date, entry])),
    [entries]
  );
  const { leadingBlanks, days } = useMemo(() => buildMonth(viewMonth), [viewMonth]);
  const selectedEntry = selectedDate ? entriesByDate.get(selectedDate) ?? null : null;
  const emptySelectedDate = canManage && selectedDate && !selectedEntry ? selectedDate : null;
  const monthCount = days.filter((day) => entriesByDate.has(day)).length;

  if (entries.length === 0) {
    return (
      <section className="timeline-empty">
        <p>No day matches this search.</p>
        <span>Try another word, a different work mode, or another month.</span>
      </section>
    );
  }

  function selectDate(date: string) {
    if (date === selectedDate) {
      setSelectedDate(null);
      return;
    }

    setSelectedDate(date);

    if (window.matchMedia("(max-width: 820px)").matches) {
      window.setTimeout(() => {
        storyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }

  return (
    <section className="timeline" aria-labelledby="story-heading">
      <div className="section-heading">
        <p className="eyebrow">Your work diary</p>
        <h2 id="story-heading">Your days, one block at a time.</h2>
        <span>
          Showing {entries.length} of {totalEntries} {totalEntries === 1 ? "day" : "days"}
        </span>
      </div>

      <div className="calendar-stage">
        <motion.div
          layout="position"
          className="memory-calendar"
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="calendar-head">
            <button
              className="icon-button"
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
            >
              <ChevronLeft size={17} />
            </button>
            <h3 aria-live="polite">{formatMonth(viewMonth)}</h3>
            <button
              className="icon-button"
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {days.map((day) => {
              const entry = entriesByDate.get(day);
              const canWrite = canManage && !entry && day <= today;

              return (
                <button
                  key={day}
                  type="button"
                  className={cn(
                    "calendar-day",
                    entry && "has-memory",
                    entry && `mode-${entry.workMode}`,
                    canWrite && "can-write",
                    day === today && "today",
                    day === selectedDate && "selected"
                  )}
                  disabled={!entry && !canWrite}
                  aria-pressed={entry || canWrite ? day === selectedDate : undefined}
                  aria-label={
                    entry
                      ? `${formatLongDate(day)}: ${entry.title}, ${workModeLabel(entry.workMode)}`
                      : formatLongDate(day)
                  }
                  title={entry?.title}
                  onClick={() => selectDate(day)}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>

          <div className="calendar-foot">
            <span>
              {monthCount === 0
                ? "No days logged this month"
                : `${monthCount} ${monthCount === 1 ? "day" : "days"} logged this month`}
            </span>
            {monthCount === 0 ? (
              <button type="button" onClick={() => setViewMonth(monthKey(entries[0].date))}>
                Latest day
              </button>
            ) : null}
          </div>

          <div className="calendar-legend" aria-label="Calendar colours">
            <span>
              <i className="remote" aria-hidden="true" />
              Work from home
            </span>
            <span>
              <i className="onsite" aria-hidden="true" />
              Onsite
            </span>
          </div>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {selectedEntry ? (
            <motion.article
              key={selectedEntry.id}
              ref={storyRef}
              className="calendar-story"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <button
                className="reader-close"
                type="button"
                aria-label="Close day"
                onClick={() => setSelectedDate(null)}
              >
                <X size={20} />
              </button>

              <time dateTime={selectedEntry.date}>{formatLongDate(selectedEntry.date)}</time>
              <h3>{selectedEntry.title}</h3>
              <WorkSummary mode={selectedEntry.workMode} blocks={selectedEntry.workBlocks} />

              {selectedEntry.images[0] ? (
                <div className="reader-cover">
                  <Image
                    src={selectedEntry.images[0].dataUrl}
                    alt={selectedEntry.images[0].alt}
                    fill
                    sizes="(min-width: 820px) 560px, 100vw"
                    unoptimized
                  />
                </div>
              ) : null}

              {selectedEntry.images.length > 1 ? (
                <div className="calendar-story-photos">
                  {selectedEntry.images.slice(1).map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      aria-label="Open full page to see this photo"
                      onClick={() => onOpen(selectedEntry)}
                    >
                      <Image src={image.dataUrl} alt={image.alt} fill sizes="90px" unoptimized />
                    </button>
                  ))}
                </div>
              ) : null}

              <WorkTimeline mode={selectedEntry.workMode} blocks={selectedEntry.workBlocks} />

              {selectedEntry.content ? (
                <div className="calendar-story-text">
                  {selectedEntry.content.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              <div className="calendar-story-actions">
                <button
                  className="primary-button small"
                  type="button"
                  onClick={() => onOpen(selectedEntry)}
                >
                  <BookOpen size={16} />
                  Open full page
                </button>
                <ShareMemory entry={selectedEntry} buttonClassName="quiet-button" />
                {canManage ? (
                  <button
                    className="quiet-button"
                    type="button"
                    onClick={() => onEdit(selectedEntry)}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                ) : null}
              </div>
            </motion.article>
          ) : emptySelectedDate ? (
            <motion.article
              key={`empty-${emptySelectedDate}`}
              ref={storyRef}
              className="calendar-story calendar-story-empty"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <button
                className="reader-close"
                type="button"
                aria-label="Close"
                onClick={() => setSelectedDate(null)}
              >
                <X size={20} />
              </button>

              <time dateTime={emptySelectedDate}>{formatLongDate(emptySelectedDate)}</time>
              <h3>Nothing written for this day yet.</h3>
              <p>Write it now and it will appear here on the calendar.</p>
              <button
                className="primary-button small"
                type="button"
                onClick={() => onWrite(emptySelectedDate)}
              >
                <PenLine size={16} />
                Write this day
              </button>
            </motion.article>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function buildMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();
  const dayCount = new Date(year, monthNumber, 0).getDate();

  return {
    leadingBlanks: (firstWeekday + 6) % 7,
    days: Array.from(
      { length: dayCount },
      (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`
    )
  };
}

function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return toDateInputValue(new Date(year, monthNumber - 1 + delta, 1)).slice(0, 7);
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    parseLocalDate(`${month}-01`)
  );
}
