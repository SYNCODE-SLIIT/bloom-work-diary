import { getEntriesCollection } from "@/lib/entries-db";
import { hasMongoConfig } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!hasMongoConfig()) {
    return new Response("MongoDB is not configured.", { status: 503 });
  }

  try {
    const collection = await getEntriesCollection();
    const entry = await collection.findOne(
      { "images.id": id },
      { projection: { _id: 0, images: { $elemMatch: { id } } } }
    );
    const match = entry?.images[0]?.dataUrl.match(/^data:([^;,]+);base64,(.+)$/);

    if (!match) {
      return new Response("Photo not found.", { status: 404 });
    }

    // A photo's id changes whenever it is replaced or re-cropped, so its bytes never change.
    return new Response(Buffer.from(match[2], "base64"), {
      headers: {
        "Content-Type": match[1],
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new Response("Could not load the photo.", { status: 500 });
  }
}
