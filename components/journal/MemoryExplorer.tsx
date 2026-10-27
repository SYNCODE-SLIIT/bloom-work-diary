"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { monthKey, parseLocalDate, yearKey } from "@/lib/utils";
import { workModeOptions } from "@/lib/work";
import type { DiaryEntry, MemoryFilters } from "@/types/diary";

interface MemoryExplorerProps {
  entries: DiaryEntry[];
  filters: MemoryFilters;
  onChange: (filters: MemoryFilters) => void;
  onClose: () => void;
}

export function MemoryExplorer({
  entries,
  filters,
  onChange,
  onClose
}: MemoryExplorerProps) {
  const months = Array.from(new Set(entries.map((entry) => monthKey(entry.date)))).sort().reverse();
  const years = Array.from(new Set(entries.map((entry) => yearKey(entry.date)))).sort().reverse();

  return (
    <motion.section
      className="memory-explorer"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      aria-label="Explore your days"
    >
      <div className="explorer-heading">
        <span>
          <SlidersHorizontal size={17} />
          Explore your days
        </span>
        <button type="button" className="icon-button" aria-label="Close explorer" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="explorer-grid">
        <label>
          <span>Search</span>
          <input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Title, story, task"
          />
        </label>
        <label>
          <span>Work mode</span>
          <select
            value={filters.workMode}
            onChange={(event) =>
              onChange({ ...filters, workMode: event.target.value as MemoryFilters["workMode"] })
            }
          >
            <option value="All">All</option>
            {workModeOptions.map((option) => (
              <option key={option.mode} value={option.mode}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Month</span>
          <select
            value={filters.month}
            onChange={(event) => onChange({ ...filters, month: event.target.value })}
          >
            <option value="">Any month</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {new Intl.DateTimeFormat("en", {
                  month: "long",
                  year: "numeric"
                }).format(parseLocalDate(`${month}-01`))}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Year</span>
          <select
            value={filters.year}
            onChange={(event) => onChange({ ...filters, year: event.target.value })}
          >
            <option value="">Any year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>
    </motion.section>
  );
}
