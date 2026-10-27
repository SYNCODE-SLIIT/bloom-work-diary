# Bloom

*Little days. Lovely work.*

Bloom is a private daily work diary. Each day gets a short story, a **Work from home / Onsite** switch, a timeline of time blocks ("9:00 – 11:30, client report"), and optional photos. Visitors can read the diary; only the owner can write, edit or delete.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, framer-motion, lucide-react, react-easy-crop and MongoDB.

## Setup

You need Node.js 20 or newer and a MongoDB database (a free MongoDB Atlas cluster is fine).

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` (see below), then start the app:

```bash
npm run dev
```

Open <http://localhost:3000>. Tap the lock icon, enter your dot pattern, and the writing tools appear.

Other scripts: `npm run typecheck`, `npm run lint`, `npm run build`, `npm start`.

## Environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string. Without it the app is read-only and falls back to this browser's storage. |
| `MONGODB_DB` | no | Database name. Defaults to `bloom-diary`. |
| `OWNER_PATTERN` | yes | The owner unlock pattern: the dots 1-9 in the order they are tapped, joined with dashes, at least four dots (for example `4-7-2-9`). Choose your own and keep it private. |

`.env.local` is git-ignored. Never commit real values.

## How it works

- **One day, one entry.** The calendar tints each day rose (onsite) or sage (work from home). Select a day to read it; the owner also gets *Write this day* and *Edit*.
- **Timeline.** Blocks use native time inputs (24-hour values, shown in the browser's own format). The end must be after the start or the day will not save. Blocks are tidied into start-time order, and the total counts overlapping time once, with a soft warning when blocks overlap.
- **Work mode.** New days start on the mode you used last time.
- **Photos.** Up to 8 per day, each cropped (Original, Square, 4:3, 3:4, 16:9, with zoom). Photos are stored in MongoDB and served from `/api/images/[id]` with immutable caching; re-cropping a photo gives it a new id.
- **Saving.** One entry per request (`POST /api/entries`, `DELETE /api/entries?id=`). The app never sends the whole diary in one request, so it stays under Vercel's request size limit (about 4.5 MB).
- **Sharing.** Every day has a public, read-only page at `/memory/YYYY-MM-DD` and a preview card at `/memory/YYYY-MM-DD/card`. The share menu uses the native share sheet on phones, and WhatsApp, Facebook, X, LinkedIn, Telegram, Copy link and *Save image for Instagram* on computers. Anyone with the link can read that day, so only share days you are happy to show.

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository. The Next.js preset needs no changes.
3. Under **Settings → Environment Variables**, add `MONGODB_URI`, `MONGODB_DB` and `OWNER_PATTERN` for Production (and Preview if you use it).
4. If you use MongoDB Atlas, open **Network Access** and allow connections from Vercel. Vercel uses changing IP addresses, so Atlas needs `0.0.0.0/0` (any address). Keep a strong database password.
5. Deploy. Open the site, unlock with your pattern and write your first day.

After changing environment variables, redeploy so they take effect.
