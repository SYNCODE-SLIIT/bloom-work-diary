"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Moon, PenLine, Search, Sun, Unlock } from "lucide-react";
import { DiaryEditor } from "@/components/journal/DiaryEditor";
import { DiaryReader } from "@/components/journal/DiaryReader";
import { DiaryTimeline } from "@/components/journal/DiaryTimeline";
import { EmptyJournal } from "@/components/journal/EmptyJournal";
import { MemoryExplorer } from "@/components/journal/MemoryExplorer";
import { OwnerUnlock } from "@/components/journal/OwnerUnlock";
import {
  createEntry,
  deleteEntry,
  filterEntries,
  getEntryByDate,
  getMemoryStats,
  sortEntries,
  updateEntry
} from "@/lib/diary";
import { compressDiaryImages } from "@/lib/client-images";
import {
  LAST_WORK_MODE_KEY,
  OWNER_PATTERN_KEY,
  getEntries,
  saveEntries
} from "@/lib/storage";
import { formatHours, isWorkMode } from "@/lib/work";
import { deleteRemoteEntry, fetchRemoteEntries, saveRemoteEntry } from "@/lib/remote-storage";
import { formatLongDate, toDateInputValue } from "@/lib/utils";
import type { DiaryDraft, DiaryEntry, MemoryFilters, WorkMode } from "@/types/diary";

const sampleEntries: DiaryEntry[] = [
  {
    id: "sample-1",
    date: "2026-10-26",
    title: "Launch week, day one",
    content:
      "A busy, happy Monday at the office. We walked through the launch checklist as a team and I finally got the onboarding flow signed off. Lunch with the design crew helped me reset before the afternoon rush.",
    workMode: "onsite",
    workBlocks: [
      { id: "sample-1-a", start: "09:00", end: "10:30", task: "Launch checklist walkthrough", note: "Agreed owners for every open item" },
      { id: "sample-1-b", start: "10:45", end: "12:30", task: "Finished the onboarding flow copy", note: "Signed off by Priya" },
      { id: "sample-1-c", start: "13:30", end: "15:30", task: "Design review with the team" },
      { id: "sample-1-d", start: "15:45", end: "17:15", task: "Fixed three small bugs from QA" }
    ],
    images: [],
    createdAt: "2026-10-26T17:30:00.000Z",
    updatedAt: "2026-10-26T17:30:00.000Z"
  },
  {
    id: "sample-2",
    date: "2026-10-23",
    title: "A quiet day at home",
    content:
      "No meetings, a pot of tea, and a long stretch of focus. I made real progress on the quarterly report and cleared my inbox before it got out of hand.",
    workMode: "remote",
    workBlocks: [
      { id: "sample-2-a", start: "08:30", end: "11:00", task: "Drafted the quarterly report", note: "Numbers section is done" },
      { id: "sample-2-b", start: "11:15", end: "12:15", task: "Inbox clean-up and replies" },
      { id: "sample-2-c", start: "14:00", end: "16:30", task: "Reviewed the vendor contract" }
    ],
    images: [],
    createdAt: "2026-10-23T16:45:00.000Z",
    updatedAt: "2026-10-23T16:45:00.000Z"
  },
  {
    id: "sample-3",
    date: "2026-10-21",
    title: "Planning from the kitchen table",
    content:
      "Spent the day planning next month's workshop. Short calls in the morning, then deep work on the agenda. It is nice when the plan finally starts to look like something real.",
    workMode: "remote",
    workBlocks: [
      { id: "sample-3-a", start: "09:00", end: "09:45", task: "Sync call with the workshop team" },
      { id: "sample-3-b", start: "10:00", end: "12:00", task: "Built the workshop agenda", note: "Three sessions, two breaks" },
      { id: "sample-3-c", start: "13:00", end: "14:30", task: "Booked the venue and catering" }
    ],
    images: [],
    createdAt: "2026-10-21T15:20:00.000Z",
    updatedAt: "2026-10-21T15:20:00.000Z"
  }
];

export function JournalApp() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [notice, setNotice] = useState("");
  const [ownerPattern, setOwnerPattern] = useState("");
  const [lastWorkMode, setLastWorkMode] = useState<WorkMode>("remote");
  const [filters, setFilters] = useState<MemoryFilters>({
    query: "",
    workMode: "All",
    month: "",
    year: ""
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const localEntries = sortEntries(getEntries());
    let cancelled = false;
    const introTimer = window.setTimeout(() => setShowIntro(false), 2350);

    setEntries(localEntries);
    setLoaded(true);
    setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    const savedOwnerPattern = window.sessionStorage.getItem(OWNER_PATTERN_KEY) ?? "";
    setOwnerPattern(savedOwnerPattern);
    setLastWorkMode(readLastWorkMode() ?? localEntries[0]?.workMode ?? "remote");

    fetchRemoteEntries().then((result) => {
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        return;
      }

      if (result.entries.length) {
        const remoteEntries = sortEntries(result.entries);
        setEntries(remoteEntries);
        saveEntries(remoteEntries);
        return;
      }

      if (localEntries.length && savedOwnerPattern) {
        uploadLocalEntries(localEntries, savedOwnerPattern);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(introTimer);
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      saveEntries(entries);
    }
  }, [entries, loaded]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(""), 5200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const existingForDate = useMemo(
    () => getEntryByDate(entries, selectedDate),
    [entries, selectedDate]
  );
  const activeEntry = useMemo(
    () => entries.find((entry) => entry.id === activeEntryId) ?? null,
    [activeEntryId, entries]
  );
  const visibleEntries = useMemo(
    () => filterEntries(entries, filters),
    [entries, filters]
  );
  const stats = useMemo(() => getMemoryStats(entries), [entries]);
  const isOwner = Boolean(ownerPattern);

  function scrollToEditor() {
    if (!isOwner) {
      setShowUnlock(true);
      return;
    }

    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleUnlock(pattern: string) {
    window.sessionStorage.setItem(OWNER_PATTERN_KEY, pattern);
    setOwnerPattern(pattern);
    setShowUnlock(false);
    setNotice("Owner tools unlocked.");
  }

  function handleLock() {
    window.sessionStorage.removeItem(OWNER_PATTERN_KEY);
    setOwnerPattern("");
    setEditingEntry(null);
    setNotice("Owner tools locked.");
  }

  async function syncEntry(entry: DiaryEntry, successMessage: string) {
    if (!ownerPattern) {
      setNotice("Unlock owner tools before saving changes.");
      return;
    }

    const result = await saveRemoteEntry(entry, ownerPattern);
    if (result.ok) {
      // The server copy links to its photos, which keeps browser storage small.
      setEntries((current) =>
        current.map((item) => (item.id === result.entry.id ? result.entry : item))
      );
      setNotice(successMessage);
      return;
    }

    setNotice(`Saved on this device. MongoDB sync failed: ${result.reason}`);
  }

  async function syncDelete(id: string, successMessage: string) {
    if (!ownerPattern) {
      setNotice("Unlock owner tools before saving changes.");
      return;
    }

    const result = await deleteRemoteEntry(id, ownerPattern);
    setNotice(
      result.ok ? successMessage : `Deleted on this device. MongoDB sync failed: ${result.reason}`
    );
  }

  async function handleSave(draft: DiaryDraft) {
    if (!isOwner) {
      setShowUnlock(true);
      return;
    }

    let compressedDraft: DiaryDraft;

    try {
      compressedDraft = {
        ...draft,
        images: await compressDiaryImages(draft.images)
      };
    } catch {
      setNotice("Could not prepare the photo. Try removing it and adding it again.");
      return;
    }

    rememberWorkMode(compressedDraft.workMode);
    setLastWorkMode(compressedDraft.workMode);

    if (editingEntry) {
      const updated = updateEntry(editingEntry, compressedDraft);
      const nextEntries = sortEntries(
        entries.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      setEntries(nextEntries);
      saveEntries(nextEntries);
      setEditingEntry(null);
      setActiveEntryId(null);
      setNotice("Updated your diary. Syncing...");
      syncEntry(updated, "Updated and saved to your diary.");
      return;
    }

    const entry = createEntry(compressedDraft);
    const nextEntries = sortEntries([entry, ...entries]);
    setEntries(nextEntries);
    saveEntries(nextEntries);
    setActiveEntryId(entry.id);
    setNotice("Saved it to your diary. Syncing...");
    syncEntry(entry, "Saved it to your diary.");
    window.setTimeout(() => {
      storyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function handleDelete(id: string) {
    if (!isOwner) {
      setShowUnlock(true);
      return;
    }

    const nextEntries = deleteEntry(entries, id);
    setEntries(nextEntries);
    saveEntries(nextEntries);
    setActiveEntryId(null);
    setEditingEntry(null);
    setNotice("Day deleted. Syncing...");
    syncDelete(id, "Day deleted from your diary.");
  }

  function loadSamples() {
    setEntries(sortEntries(sampleEntries));
    setNotice("Sample days added.");
  }

  const todayLabel = formatLongDate(toDateInputValue());

  return (
    <main className="min-h-screen bg-paper text-ink transition-colors duration-500">
      <div className="paper-grain" aria-hidden="true" />
      <AnimatePresence>{showIntro ? <IntroOverlay todayLabel={todayLabel} /> : null}</AnimatePresence>
      <nav className="journal-nav" aria-label="Primary">
        <a href="#top" className="brand-mark">
          Bloom
        </a>
        <div className="nav-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={isOwner ? "Lock owner tools" : "Unlock owner tools"}
            title={isOwner ? "Lock owner tools" : "Unlock owner tools"}
            onClick={isOwner ? handleLock : () => setShowUnlock(true)}
          >
            {isOwner ? <Unlock size={18} /> : <Lock size={18} />}
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Explore your days"
            title="Explore your days"
            onClick={() => setShowExplorer((value) => !value)}
          >
            <Search size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={darkMode ? "Use daytime theme" : "Use late-night theme"}
            title={darkMode ? "Daytime theme" : "Late-night theme"}
            onClick={() => setDarkMode((value) => !value)}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      <section id="top" className="hero-section">
        <div className="opening-layout">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="hero-inner"
          >
            <p className="eyebrow">Your private work diary</p>
            <h1>Bloom</h1>
            <p className="hero-line">Little days. Lovely work.</p>
            <div className="today-block" aria-label={`Today is ${todayLabel}`}>
              <span>{new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date())}</span>
              <strong>
                {new Intl.DateTimeFormat("en", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                }).format(new Date())}
              </strong>
            </div>
            <p className="hero-question">What did you work on today?</p>
            <button className="primary-button" type="button" onClick={scrollToEditor}>
              {isOwner ? <PenLine size={18} /> : <Lock size={18} />}
              {isOwner ? "Start writing" : "Owner unlock"}
            </button>
          </motion.div>

          {isOwner ? (
            <div ref={editorRef} className="quick-editor-frame">
              <DiaryEditor
                key={editingEntry?.id ?? selectedDate}
                selectedDate={selectedDate}
                existingEntry={editingEntry ? null : existingForDate}
                editingEntry={editingEntry}
                defaultWorkMode={lastWorkMode}
                onDateChange={(date) => {
                  setSelectedDate(date);
                  setEditingEntry(null);
                }}
                onSave={handleSave}
                onViewEntry={(entry) => setActiveEntryId(entry.id)}
                onEditEntry={(entry) => {
                  setEditingEntry(entry);
                  setSelectedDate(entry.date);
                }}
              />
            </div>
          ) : (
            <div ref={editorRef} className="quick-editor-frame">
              <section className="diary-page locked-owner-panel">
                <Lock size={22} />
                <p className="eyebrow">Read only</p>
                <h2>This diary is protected.</h2>
                <p>Unlock owner tools to write, edit, or delete diary pages.</p>
                <button className="primary-button" type="button" onClick={() => setShowUnlock(true)}>
                  <Lock size={18} />
                  Owner unlock
                </button>
              </section>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {notice ? (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="status"
          >
            {notice}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showUnlock ? (
          <OwnerUnlock onClose={() => setShowUnlock(false)} onUnlock={handleUnlock} />
        ) : null}
      </AnimatePresence>

      <section className="reflection-strip" aria-label="Diary totals">
        <div>
          <strong>{stats.days}</strong>
          <span>days written</span>
        </div>
        <div>
          <strong>{formatHours(stats.minutes)}</strong>
          <span>hours logged</span>
        </div>
        <div>
          <strong>{stats.onsiteDays}</strong>
          <span>onsite days</span>
        </div>
      </section>

      <AnimatePresence>
        {showExplorer ? (
          <MemoryExplorer
            entries={entries}
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowExplorer(false)}
          />
        ) : null}
      </AnimatePresence>

      <div ref={storyRef} className="section-shell story-shell">
        {entries.length === 0 ? (
          <EmptyJournal onWrite={scrollToEditor} onLoadSamples={loadSamples} canWrite={isOwner} />
        ) : (
          <DiaryTimeline
            entries={visibleEntries}
            totalEntries={entries.length}
            onOpen={(entry) => setActiveEntryId(entry.id)}
            onEdit={(entry) => {
              setEditingEntry(entry);
              setSelectedDate(entry.date);
              window.setTimeout(scrollToEditor, 80);
            }}
            onWrite={(date) => {
              setEditingEntry(null);
              setSelectedDate(date);
              window.setTimeout(scrollToEditor, 80);
            }}
            canManage={isOwner}
          />
        )}
      </div>

      <AnimatePresence>
        {activeEntry ? (
          <DiaryReader
            entry={activeEntry}
            entries={entries}
            onClose={() => setActiveEntryId(null)}
            onEdit={(entry) => {
              setActiveEntryId(null);
              setEditingEntry(entry);
              setSelectedDate(entry.date);
              window.setTimeout(scrollToEditor, 80);
            }}
            onDelete={handleDelete}
            onNavigate={(entry) => setActiveEntryId(entry.id)}
            canManage={isOwner}
          />
        ) : null}
      </AnimatePresence>

      <footer className="journal-footer">
        <span>Bloom. Little days. Lovely work.</span>
      </footer>
    </main>
  );
}

async function uploadLocalEntries(entries: DiaryEntry[], ownerPattern: string) {
  // One memory per request keeps each upload well under the server's size limit.
  for (const entry of entries) {
    // The sample days are only a preview; they never go into the real diary.
    if (entry.id.startsWith("sample-")) {
      continue;
    }

    await saveRemoteEntry(entry, ownerPattern);
  }
}

function readLastWorkMode(): WorkMode | null {
  try {
    const value = window.localStorage.getItem(LAST_WORK_MODE_KEY);
    return isWorkMode(value) ? value : null;
  } catch {
    return null;
  }
}

function rememberWorkMode(mode: WorkMode) {
  try {
    window.localStorage.setItem(LAST_WORK_MODE_KEY, mode);
  } catch {
    // Not remembered; the editor falls back to the latest entry.
  }
}

function IntroOverlay({ todayLabel }: { todayLabel: string }) {
  const lines = ["Bloom", "Little days. Lovely work.", todayLabel];

  return (
    <motion.div
      className="intro-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <div>
        {lines.map((line, index) => (
          <motion.span
            key={line}
            className={index === 0 ? "intro-title" : "intro-line"}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: index * 0.34, ease: "easeOut" }}
          >
            {line}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
