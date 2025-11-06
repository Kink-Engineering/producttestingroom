
'use client';

import React from 'react';
import MonthCalendar from '@/components/MonthCalendar';

export default function CalendarPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-semibold">Calendar</h1>
      <p className="mt-2 text-white/70">Month view of events from Google Calendar.</p>
      <div className="mt-8">
        <MonthCalendar />
      </div>
    </section>
  );
}
