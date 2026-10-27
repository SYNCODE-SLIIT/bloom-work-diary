"use client";

import { BookOpen, Sparkles } from "lucide-react";

interface EmptyJournalProps {
  onWrite: () => void;
  onLoadSamples: () => void;
  canWrite: boolean;
}

export function EmptyJournal({ onWrite, onLoadSamples, canWrite }: EmptyJournalProps) {
  return (
    <section className="empty-journal" aria-labelledby="empty-title">
      <Sparkles size={24} />
      <h2 id="empty-title">Your first page starts here.</h2>
      <p>Jot down what you worked on today and watch the days add up.</p>
      {canWrite ? (
        <div>
          <button className="primary-button" type="button" onClick={onWrite}>
            <BookOpen size={18} />
            Write your first day
          </button>
          <button className="quiet-button" type="button" onClick={onLoadSamples}>
            See sample pages
          </button>
        </div>
      ) : null}
    </section>
  );
}
