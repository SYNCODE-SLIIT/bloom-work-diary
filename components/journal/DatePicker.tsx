"use client";

import { Calendar } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <label className="date-picker">
      <Calendar size={17} />
      <span className="sr-only">Select diary date</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
