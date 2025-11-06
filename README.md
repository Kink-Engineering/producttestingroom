
# Product Testing Room — Next.js Starter :)

Next.js (App Router) + Tailwind site that pulls **upcoming events** from **Google Calendar** and lists them on `/events` with a "Get tickets" button from the event description.

## Quick start

```bash
npm install
npm run dev
```

### Environment variables

Create `.env.local` with:

```
GOOGLE_API_KEY=your_public_api_key
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

On **Vercel**, set these in Project → Settings → Environment Variables. Set
`NEXT_PUBLIC_BASE_URL` to your deployed URL (e.g., `https://producttestingroom.vercel.app`).

> For **private calendars**, switch to OAuth 2.0 (server-side) and request `calendar.readonly`.
> This starter uses an **API key** for a **public** calendar for simplicity.

## How it works

- `/api/events` calls Google Calendar v3 with `singleEvents=true` and `orderBy=startTime` starting from `timeMin=now`.
- `/events` fetches from the API route on each request and renders a responsive card grid.
- Image & ticket link heuristics:
  - First image attachment wins; else first image URL in `description`.
  - "Get tickets" links to the first non-Google URL in `description` (fallback to `htmlLink`).

## Branding

- Colors: `tailwind.config.ts` (`theme.extend.colors.brand`).
- Layout: `app/layout.tsx`.
- Global CSS: `app/globals.css`.


Testing Git push from WSL!
