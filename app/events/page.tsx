'use client';

import React, { useEffect, useMemo, useState } from 'react';
import EventCard from '@/components/EventCard';

type GCalEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attachments?: { fileUrl?: string; title?: string; mimeType?: string }[];
};

export default function EventsPage() {
  const [items, setItems] = useState<GCalEvent[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
  const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID!;

  const gcalUrl = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // include yesterday
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set('key', key);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeMin', start.toISOString());
    url.searchParams.set('maxResults', '24');
    url.searchParams.set(
      'fields',
      'items(id,summary,description,location,htmlLink,start,end,attachments(fileUrl,mimeType,title))'
    );
    return url.toString();
  }, [key, calendarId]);

  useEffect(() => {
    fetch(gcalUrl)
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text().catch(() => '');
          throw new Error(`${r.status} ${r.statusText} — ${text.slice(0, 200)}`);
        }
        return r.json();
      })
      .then((data) => setItems(data?.items ?? []))
      .catch((e: any) => setErr(e?.message || 'Failed to load'));
  }, [gcalUrl]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-semibold">Upcoming events</h1>
      <p className="mt-2 text-white/70">Data pulled from Google Calendar.</p>

      <div className="mt-8">
        {err && <div className="text-red-400">Error: {err}</div>}
        {!err && !items && <div className="opacity-70">Loading events…</div>}
        {!err && items && !items.length && <div className="text-white/70">No upcoming events found.</div>}
        {!err && items && items.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <EventCard key={e.id} event={e as any} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
