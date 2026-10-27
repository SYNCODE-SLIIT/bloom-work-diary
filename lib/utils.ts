export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function toDateInputValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export function createId(prefix = "entry") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatLongDate(dateValue: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parseLocalDate(dateValue));
}

export function formatTimelineDate(dateValue: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric"
  }).format(parseLocalDate(dateValue));
}

export function formatWeekday(dateValue: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long" }).format(
    parseLocalDate(dateValue)
  );
}

export function parseLocalDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function monthKey(dateValue: string) {
  return dateValue.slice(0, 7);
}

export function yearKey(dateValue: string) {
  return dateValue.slice(0, 4);
}
