
import { Suspense } from "react";
import EventsList from "./view";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-semibold">Upcoming events</h1>
      <p className="mt-2 text-white/70">Data pulled from Google Calendar.</p>
      <div className="mt-8">
       <Suspense fallback={<div className='opacity-70'>Loading events…</div>}>
  <EventsList />
</Suspense>
        </Suspense>
      </div>
    </section>
  );
}
