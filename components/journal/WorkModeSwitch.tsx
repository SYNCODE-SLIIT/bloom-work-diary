"use client";

import { KeyboardEvent, useId, useRef } from "react";
import { motion } from "framer-motion";
import { Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { workModeOptions } from "@/lib/work";
import type { WorkMode } from "@/types/diary";

interface WorkModeSwitchProps {
  value: WorkMode;
  onChange: (value: WorkMode) => void;
}

const icons = { remote: Home, onsite: Building2 } as const;

export function WorkModeSwitch({ value, onChange }: WorkModeSwitchProps) {
  const groupId = useId();
  const refs = useRef<Record<WorkMode, HTMLButtonElement | null>>({
    remote: null,
    onsite: null
  });

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = workModeOptions.findIndex((option) => option.mode === value);
    let nextIndex = index;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % workModeOptions.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + workModeOptions.length) % workModeOptions.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = workModeOptions.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const next = workModeOptions[nextIndex].mode;
    onChange(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="mode-switch" role="radiogroup" aria-labelledby={`${groupId}-label`}>
      <span id={`${groupId}-label`} className="field-label">
        Where did you work today?
      </span>
      <div className="mode-track">
        {workModeOptions.map(({ mode, label }) => {
          const Icon = icons[mode];
          const active = value === mode;

          return (
            <button
              key={mode}
              ref={(node) => {
                refs.current[mode] = node;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              className="mode-option"
              onClick={() => onChange(mode)}
              onKeyDown={handleKeyDown}
            >
              {active ? (
                <motion.span
                  layoutId={`${groupId}-highlight`}
                  className={cn("mode-highlight", mode)}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <Icon size={17} aria-hidden="true" />
              <span className="mode-label">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
