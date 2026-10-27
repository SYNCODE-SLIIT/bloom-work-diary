import { timingSafeEqual } from "crypto";

export function verifyOwnerPattern(value: string) {
  const expected = normalizePattern(process.env.OWNER_PATTERN ?? "");
  const incoming = normalizePattern(value);

  if (!expected || !incoming) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const incomingBuffer = Buffer.from(incoming);

  if (expectedBuffer.length !== incomingBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, incomingBuffer);
}

function normalizePattern(value: string) {
  return value.replace(/\D/g, "");
}
