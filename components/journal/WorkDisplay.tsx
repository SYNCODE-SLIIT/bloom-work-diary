import { Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  formatTimeRange,
  taskCountLabel,
  totalMinutes,
  workModeLabel
} from "@/lib/work";
import type { WorkBlock, WorkMode } from "@/types/diary";

export function ModeBadge({ mode, className }: { mode: WorkMode; className?: string }) {
  const Icon = mode === "onsite" ? Building2 : Home;

  return (
    <span className={cn("mode-badge", mode, className)}>
      <Icon size={15} aria-hidden="true" />
      {workModeLabel(mode)}
    </span>
  );
}

/** Mode badge plus total hours, shown above the timeline. */
export function WorkSummary({ mode, blocks }: { mode: WorkMode; blocks: WorkBlock[] }) {
  const minutes = totalMinutes(blocks);

  return (
    <div className="work-summary">
      <ModeBadge mode={mode} />
      {minutes > 0 ? (
        <span className="work-total">
          <strong>{formatDuration(minutes)}</strong> logged · {taskCountLabel(blocks.length)}
        </span>
      ) : null}
    </div>
  );
}

/** The day as a vertical line with a dot per time block. */
export function WorkTimeline({ mode, blocks }: { mode: WorkMode; blocks: WorkBlock[] }) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <ol className={cn("work-timeline", mode)} aria-label="Work timeline">
      {blocks.map((block) => (
        <li key={block.id}>
          <span className="work-time">{formatTimeRange(block)}</span>
          <span className="work-task">{block.task}</span>
          {block.note ? <span className="work-note">{block.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}
