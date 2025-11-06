
import EventCard from "@/components/EventCard";

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

async function getEvents(): Promise<GCalEvent[]> {
  const res = await fetch(`/api/events`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load events");
  const data = await res.json();
  return data?.items ?? [];
}

export default async function EventsList() {
  const events = await getEvents();
  if (!events?.length) {
    return <div className="text-white/70">No upcoming events found.</div>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => (
        <EventCard key={e.id} event={e as any} />
      ))}
    </div>
  );
}
