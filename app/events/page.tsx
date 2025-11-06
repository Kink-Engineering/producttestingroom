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
  const [status, setStatus] = useState<string | null>(null);

  const KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
  const CAL = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || '';

  const gcalUrl = useMemo(() => {
    try {
      const timeMin = new Date().toISOString();
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CAL)}/events`);
      url.searchParams.set('key', KEY);
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('timeMin', timeMin);
      url.searchParams.set('maxResults', '24');
      url.searchParams.set(
        'fields',
        'items(id,summary,description,location,htmlLink,start,end,attachments(fileUrl,mimeType,title))'
      );
      return url.toString();
    } catch {
      return '';
    }
  }, [KEY, CAL]);

  useEffect(() => {
    if (!KEY || !CAL) {
      setErr('Missing NEXT_PUBLIC_GOOGLE_API_KEY or NEXT_PUBLIC_GOOGLE_CALENDAR_ID');
      return;
    }
    fetch(gcalUrl)
      .then(async (r) => {
        setStatus(`${r.status} ${r.statusText}`);
        if (!r.ok) {
          const text = await r.text().catch(() => '');
          throw new Error(`${r.status} ${r.statusText} — ${text.slice(0, 300)}`);
        }
        return r.json();
      })
      .then((data) => {
        setItems(data?.items ?? []);
        setErr(null);
      })
      .catch((e: any) => {
        setErr(e?.message || 'Failed to load');
      });
  }, [gcalUrl, KEY, CAL]);

  const maskedKey = KEY ? KEY.slice(0, 6) + '…' + KEY.slice(-4) : '(none)';

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-semibold">Upcoming events</h1>
      <p className="mt-2 text-white/70">Data pulled from Google Calendar.</p>

      {/* Always-on debug box (temporary) */}
      <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4 text-sm">
        <div><b>DEBUG</b></div>
        <div>Has NEXT_PUBLIC_GOOGLE_API_KEY: {KEY ? 'yes' : 'no'} ({maskedKey})</div>
        <div>Has NEXT_PUBLIC_GOOGLE_CALENDAR_ID: {CAL ? 'yes' : 'no'} ({CAL || '(none)'})</div>
        <div className="break-all">URL: {gcalUrl || '(invalid)'} </div>
        {status && <div>Status: {status}</div>}
        {err && <div className="text-red-400 mt-2">Error: {err}</div>}
        {items && <div className="text-green-400 mt-2">Items: {items.length}</div>}
      </div>

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
