import { NextResponse } from "next/server";
import { verifyOwnerPattern } from "@/lib/owner-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pattern?: unknown };
    const pattern = typeof body.pattern === "string" ? body.pattern : "";

    if (!process.env.OWNER_PATTERN) {
      return NextResponse.json(
        { message: "Owner pattern is not configured." },
        { status: 503 }
      );
    }

    if (!verifyOwnerPattern(pattern)) {
      return NextResponse.json({ message: "Pattern did not match." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Could not check unlock pattern." }, { status: 400 });
  }
}
