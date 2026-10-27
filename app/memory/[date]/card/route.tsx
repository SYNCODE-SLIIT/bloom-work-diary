import { ImageResponse } from "next/og";
import { getSharedEntry, shareExcerpt } from "@/lib/shared-entry";
import { formatLongDate, parseLocalDate } from "@/lib/utils";
import { summaryLine } from "@/lib/work";

export const runtime = "nodejs";

// Rose and plum. Every text colour here is at least 4.5:1 on the surface it sits on.
const colors = {
  paper: "rgb(250, 236, 240)",
  paperDeep: "rgb(242, 214, 224)",
  surface: "rgb(255, 250, 251)",
  ink: "rgb(74, 37, 58)",
  muted: "rgb(122, 84, 102)",
  accent: "rgb(163, 58, 92)",
  line: "rgb(232, 208, 216)",
  sage: "rgb(108, 143, 118)",
  rose: "rgb(183, 85, 112)"
};

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const entry = await getSharedEntry(date);

  if (!entry) {
    return new Response("Page not found.", { status: 404 });
  }

  const title = entry.title.length > 90 ? `${entry.title.slice(0, 88).trim()}…` : entry.title;
  const longTitle = title.length > 40;
  const excerpt = shareExcerpt(entry.content, longTitle ? 95 : entry.images[0] ? 130 : 180);
  const dateLabel = formatLongDate(entry.date);
  const day = parseLocalDate(entry.date);
  const dayNumber = String(day.getDate());
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long" }).format(day).toUpperCase();
  const details = summaryLine(entry.workMode, entry.workBlocks);
  const cover = entry.images[0]?.dataUrl;

  const fontText = `${title}${excerpt}${dateLabel}${dayNumber}`;
  // Playfair has old-style figures ("30" reads like "3o"), so numbers and labels use DM Sans.
  const labelText = `BLOOM${details}${monthLabel}`;
  const [serifBold, serifRegular, sansBold] = await Promise.all([
    loadGoogleFont("Playfair Display", 600, fontText),
    loadGoogleFont("Playfair Display", 500, fontText),
    loadGoogleFont("DM Sans", 700, labelText)
  ]);
  const fonts = [
    serifBold && { name: "Playfair", data: serifBold, weight: 600 as const, style: "normal" as const },
    serifRegular && { name: "Playfair", data: serifRegular, weight: 500 as const, style: "normal" as const },
    sansBold && { name: "DM Sans", data: sansBold, weight: 700 as const, style: "normal" as const }
  ].filter((font) => font !== null);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 48,
          backgroundImage: `linear-gradient(135deg, ${colors.paper}, ${colors.paperDeep})`
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: 44,
            border: `1px solid ${colors.line}`,
            borderRadius: 18,
            padding: 44,
            background: colors.surface
          }}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "space-between",
              minWidth: 0
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  color: colors.accent,
                  fontFamily: "DM Sans",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 6
                }}
              >
                BLOOM
              </div>
              <div style={{ display: "flex", color: colors.muted, fontFamily: "Playfair", fontSize: 26, fontWeight: 500 }}>
                {dateLabel}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  display: "flex",
                  color: colors.ink,
                  fontFamily: "Playfair",
                  fontSize: longTitle ? 48 : cover ? 54 : 60,
                  fontWeight: 600,
                  lineHeight: 1.1
                }}
              >
                {title}
              </div>
              {excerpt ? (
                <div
                  style={{
                    display: "flex",
                    color: colors.muted,
                    fontFamily: "Playfair",
                    fontSize: 25,
                    fontWeight: 500,
                    lineHeight: 1.4
                  }}
                >
                  {excerpt}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderTop: `1px solid ${colors.line}`,
                paddingTop: 18,
                color: colors.muted,
                fontFamily: "DM Sans",
                fontSize: 22,
                fontWeight: 700
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 14,
                  height: 14,
                  borderRadius: 14,
                  background: entry.workMode === "onsite" ? colors.rose : colors.sage
                }}
              />
              <div style={{ display: "flex" }}>{details}</div>
            </div>
          </div>

          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              width={400}
              height={446}
              style={{ width: 400, height: 446, borderRadius: 14, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 300,
                borderRadius: 14,
                backgroundImage: `linear-gradient(160deg, rgb(250, 228, 236), rgb(238, 200, 214))`,
                border: `1px solid ${colors.line}`
              }}
            >
              <div
                style={{
                  display: "flex",
                  color: colors.ink,
                  fontFamily: "Playfair",
                  fontSize: 180,
                  fontWeight: 600,
                  lineHeight: 1
                }}
              >
                {dayNumber}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 30,
                  color: colors.ink,
                  fontFamily: "DM Sans",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 5
                }}
              >
                {monthLabel}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length ? fonts : undefined,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=600" }
    }
  );
}

async function loadGoogleFont(family: string, weight: number, text: string) {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const fontUrl = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!fontUrl) {
      return null;
    }

    const response = await fetch(fontUrl);
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}
