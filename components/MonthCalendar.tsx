'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type GCalEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
};

function startOfMonth(d: Date) {
  const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x;
}
function endOfMonth(d: Date) {
  const x = new Date(d); x.setMonth(x.getMonth()+1, 0); x.setHours(23,59,59,999); return x;
}
function startOfWeek(d: Date, weekStartsOn = 0) { // 0=Sun
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0,0,0,0);
  return x;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function sameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function toISODate(d: Date) { return d.toISOString().slice(0,10); }

function normalizeEventTimes(e: GCalEvent) {
  // All-day events come as date; timed as dateTime. Normalize to Date.
  const sISO = e.start?.dateTime ?? (e.start?.date ? `${e.start.date}T00:00:00` : undefined);
  const eISO = e.end?.dateTime ?? (e.end?.date ? `${e.end.date}T00:00:00` : undefined);
  return { s: sISO ? new Date(sISO) : undefined, e: eISO ? new Date(eISO) : undefined };
}

function eventSpansDay(date: Date, e: GCalEvent) {
  const { s, e: ee } = normalizeEventTimes(e);
  if (!s) return false;
  const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);
  const startInRange = s <= dayEnd;
  const endInRange = ee ? ee >= dayStart : true;
  return startInRange && endInRange;
}

function timeLabel(e: GCalEvent) {
  const { s, e: ee } = normalizeEventTimes(e);
  const isAllDay = !!(e.start?.date && !e.start?.dateTime);
  if (isAllDay || !s) return 'All day';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const startStr = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: tz });
  if (ee) {
    const endStr = ee.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: tz });
    return `${startStr} – ${endStr}`;
  }
  return startStr;
}

export default function MonthCalendar() {
  // Allow ?m=YYYY-MM override; default to current month
  const urlMonth = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const m = new URLSearchParams(window.location.search).get('m');
    return m && /^\d{4}-\d{2}$/.test(m) ? m : null;
  }, []);

  const initial = urlMonth ? new Date(`${urlMonth}-01T00:00:00`) : new Date();
  const [viewDate, setViewDate] = useState<Date>(new Date(initial));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, 0); // Sunday-start grid
  const gridDays = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)); // 6 weeks

  const KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
  const CAL = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID!;

  // Fetch events for [gridStart, gridEnd]
  const gridEnd = addDays(gridStart, 42);
  const gcalUrl = useMemo(() => {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CAL)}/events`);
    url.searchParams.set('key', KEY);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeMin', gridStart.toISOString());
    url.searchParams.set('timeMax', gridEnd.toISOString());
    url.searchParams.set('maxResults', '2500');
    url.searchParams.set(
      'fields',
      'items(id,summary,description,location,htmlLink,start,end)'
    );
    return url.toString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [KEY, CAL, toISODate(gridStart), toISODate(gridEnd)]);

  const [items, setItems] = useState<GCalEvent[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setItems(null); setErr(null);
    fetch(gcalUrl)
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${(await r.text()).slice(0,200)}`);
        return r.json();
      })
      .then(data => setItems(data?.items ?? []))
      .catch(e => setErr(e.message || 'Failed to load'));
  }, [gcalUrl]);

  const isToday = (d: Date) => sameDay(d, new Date());
  const inMonth = (d: Date) => d.getMonth() === monthStart.getMonth();

  function prevMonth() {
    const x = new Date(monthStart); x.setMonth(x.getMonth()-1); setViewDate(x);
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `/calendar?m=${x.toISOString().slice(0,7)}`);
  }
  function nextMonth() {
    const x = new Date(monthStart); x.setMonth(x.getMonth()+1); setViewDate(x);
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `/calendar?m=${x.toISOString().slice(0,7)}`);
  }
  function monthLabel(d: Date) {
    return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-semibold">{monthLabel(monthStart)}</div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="rounded-xl border border-white/15 px-3 py-1.5 hover:bg-white/10">← Prev</button>
          <button onClick={() => { const x = new Date(); setViewDate(x); if (typeof window !== 'undefined') window.history.replaceState(null,'', `/calendar?m=${x.toISOString().slice(0,7)}`); }} className="rounded-xl border border-white/15 px-3 py-1.5 hover:bg-white/10">Today</button>
          <button onClick={nextMonth} className="rounded-xl border border-white/15 px-3 py-1.5 hover:bg-white/10">Next →</button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 text-xs uppercase tracking-wide text-white/60">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="px-2 py-2">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-1 grid grid-cols-7 gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/10">
        {gridDays.map((d, i) => {
          const dayEvents = (items ?? []).filter(e => eventSpansDay(d, e));
          return (
            <div
              key={i}
              className={`min-h-[110px] bg-black/40 p-2 ${inMonth(d) ? 'opacity-100' : 'opacity-50'}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className={`text-sm ${isToday(d) ? 'bg-brand text-black px-2 py-0.5 rounded-md' : 'text-white/80'}`}>
                  {d.getDate()}
                </div>
              </div>

              {/* Events (up to 3, then +N more) */}
              <div className="space-y-1">
                {dayEvents.slice(0,3).map(ev => (
                  <a
                    key={ev.id}
                    href={ev.htmlLink || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                    title={ev.summary || ''}
                  >
                    <span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand align-middle" />
                    <span className="align-middle">{ev.summary || 'Untitled'}</span>
                    <span className="ml-1 text-white/50">· {timeLabel(ev)}</span>
                  </a>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-white/60">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Link back to list view */}
      <div className="mt-6 text-sm text-white/70">
        Prefer a list? <Link className="underline hover:text-white" href="/events">See upcoming events</Link>
      </div>

      {err && <div className="mt-4 text-red-400">Error: {err}</div>}
      {!items && !err && <div className="mt-4 opacity-70">Loading…</div>}
    </div>
  );
}
