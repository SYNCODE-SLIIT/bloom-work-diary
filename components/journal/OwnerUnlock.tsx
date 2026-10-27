"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Lock, RotateCcw, X } from "lucide-react";
import { verifyOwnerPattern } from "@/lib/remote-storage";

interface OwnerUnlockProps {
  onClose: () => void;
  onUnlock: (pattern: string) => void;
}

const dots = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function OwnerUnlock({ onClose, onUnlock }: OwnerUnlockProps) {
  const [pattern, setPattern] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [checking, setChecking] = useState(false);

  function addDot(dot: string) {
    setStatus("");
    setPattern((current) => (current.includes(dot) ? current : [...current, dot]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pattern.length < 4 || checking) {
      setStatus("Use at least four dots.");
      return;
    }

    setChecking(true);
    const value = pattern.join("-");
    const result = await verifyOwnerPattern(value);
    setChecking(false);

    if (!result.ok) {
      setStatus(result.reason);
      setPattern([]);
      return;
    }

    onUnlock(value);
  }

  return (
    <motion.div
      className="unlock-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-title"
    >
      <motion.form
        className="unlock-panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
      >
        <button className="reader-close" type="button" aria-label="Close unlock" onClick={onClose}>
          <X size={20} />
        </button>
        <Lock size={22} />
        <h2 id="unlock-title">Owner unlock</h2>
        <p>Tap your pattern to open writing tools.</p>
        <div className="pattern-dots" aria-label="Unlock pattern">
          {dots.map((dot) => (
            <button
              key={dot}
              className={pattern.includes(dot) ? "pattern-dot active" : "pattern-dot"}
              type="button"
              aria-label={`Pattern dot ${dot}`}
              onClick={() => addDot(dot)}
            >
              <span>{dot}</span>
            </button>
          ))}
        </div>
        <div className="pattern-actions">
          <button
            className="quiet-button"
            type="button"
            onClick={() => {
              setPattern([]);
              setStatus("");
            }}
          >
            <RotateCcw size={16} />
            Clear
          </button>
          <button className="primary-button" type="submit" disabled={checking}>
            {checking ? "Checking..." : "Unlock"}
          </button>
        </div>
        {status ? <p className="form-error">{status}</p> : null}
      </motion.form>
    </motion.div>
  );
}
