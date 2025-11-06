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

export default function EventsListClient() {
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

    fetch(url.toString())
      .then(r => r.ok ? r.json() : r.text().then(t => { throw new Error(t); }))
      .then(data => setItems(data.items ?? []))
      .catch(e => setErr(e.message || 'Failed to load'));
  }, []);

  if (err) return <div className="text-red-400">Error: {err}</div>;
  if (!items) return <div className="opacity-70">Loading events…</div>;
  if (!items.length) return <div className="text-white/70">No upcoming events found.</div>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(e => <EventCard key={e.id} event={e as any} />)}
    </div>
  );
}
