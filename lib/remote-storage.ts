import type { DiaryEntry } from "@/types/diary";

export type RemoteStorageResult =
  | { ok: true; entries: DiaryEntry[] }
  | { ok: false; reason: string };

export type RemoteSaveResult =
  | { ok: true }
  | { ok: false; reason: string };

export type RemoteEntryResult =
  | { ok: true; entry: DiaryEntry }
  | { ok: false; reason: string };

export type OwnerVerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function fetchRemoteEntries(): Promise<RemoteStorageResult> {
  try {
    const response = await fetch("/api/entries", { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, reason: "MongoDB is not connected yet." };
    }

    const data = (await response.json()) as { entries?: DiaryEntry[] };
    return { ok: true, entries: Array.isArray(data.entries) ? data.entries : [] };
  } catch {
    return { ok: false, reason: "Using this browser as your journal home." };
  }
}

export async function verifyOwnerPattern(pattern: string): Promise<OwnerVerifyResult> {
  try {
    const response = await fetch("/api/owner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pattern })
    });

    if (response.ok) {
      return { ok: true };
    }

    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    return { ok: false, reason: data?.message ?? "Unlock failed." };
  } catch {
    return { ok: false, reason: "Could not check unlock pattern." };
  }
}

export async function saveRemoteEntry(
  entry: DiaryEntry,
  ownerPattern: string
): Promise<RemoteEntryResult> {
  const result = await sendOwnerRequest("/api/entries", "POST", ownerPattern, { entry });
  if (!result.ok) {
    return result;
  }

  const saved = (result.data as { entry?: DiaryEntry } | null)?.entry;
  return saved ? { ok: true, entry: saved } : { ok: false, reason: "MongoDB did not return the memory." };
}

export async function deleteRemoteEntry(
  id: string,
  ownerPattern: string
): Promise<RemoteSaveResult> {
  const result = await sendOwnerRequest(
    `/api/entries?id=${encodeURIComponent(id)}`,
    "DELETE",
    ownerPattern
  );
  return result.ok ? { ok: true } : result;
}

async function sendOwnerRequest(
  url: string,
  method: "POST" | "DELETE",
  ownerPattern: string,
  body?: unknown
): Promise<{ ok: true; data: unknown } | { ok: false; reason: string }> {
  const controller = new AbortController();
  // Photos upload with the memory, so give slow phone connections time.
  const timeout = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-owner-pattern": ownerPattern
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;

    if (response.ok) {
      return { ok: true, data };
    }

    if (response.status === 413) {
      return { ok: false, reason: "The photos are too large to upload. Try fewer photos." };
    }

    return { ok: false, reason: data?.message ?? "Could not sync with MongoDB." };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, reason: "MongoDB sync timed out." };
    }

    return { ok: false, reason: "Could not reach MongoDB sync." };
  } finally {
    window.clearTimeout(timeout);
  }
}
