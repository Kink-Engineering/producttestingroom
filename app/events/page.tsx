'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
    const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID!;
    const timeMin = new Date().toISOString();

    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set('key', key);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('maxResults', '24');

    url.searchParams.set(
  'fields',
  'items(id,summary,description,location,htmlLink,start,end,attachments(fileUrl,mimeType,title))'
);

    fetch(url.toString())
      .then(r => r.ok ? r.json() : r.text().then(t => { throw new Error(t); }))
      .then(data => setItems(data.items ?? []))
      .catch(e => setErr(e.message || 'Failed to load'));
  }, []);

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
            {items.map(e => <EventCard key={e.id} event={e as any} />)}
          </div>
        )}
      </div>
    </section>
  );
}
