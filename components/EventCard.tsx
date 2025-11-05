
type Props = {
  event: {
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    htmlLink?: string;
    start?: { dateTime?: string; date?: string; timeZone?: string };
    end?: { dateTime?: string; date?: string; timeZone?: string };
    attachments?: { fileUrl?: string; title?: string; mimeType?: string }[];
  };
};

function formatDateRange(start?: any, end?: any) {
  const s = start?.dateTime || start?.date;
  const e = end?.dateTime || end?.date;
  if (!s) return "TBA";
  const sd = new Date(s);
  const ed = e ? new Date(e) : undefined;
  const date = sd.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (ed) {
    const endTime = ed.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${date} – ${endTime}`;
  }
  return date;
}

export default function EventCard({ event }: Props) {
  const image =
    event.attachments?.find((a) => (a.mimeType || "").startsWith("image/"))?.fileUrl ||
    (event.description && event.description.match(/https?:[^\s)]+\.(?:png|jpg|jpeg|gif)/i)?.[0]) ||
    undefined;

  const ticket =
    (event.description && event.description.match(/https?:[^\s)"]+/gi)?.find(u => !u.includes("google.com"))) ||
    event.htmlLink;

  return (
    <article className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 hover:bg-white/10 transition">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={event.summary || ""} className="h-48 w-full object-cover" />
      ) : (
        <div className="h-48 w-full bg-white/10 grid place-items-center text-white/50">No image</div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-semibold leading-snug">{event.summary || "Untitled event"}</h3>
        <p className="mt-1 text-white/70 text-sm">{formatDateRange(event.start, event.end)}</p>
        {event.location && <p className="mt-1 text-white/60 text-sm">{event.location}</p>}
        <div className="mt-4">
          <a
            href={ticket}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl bg-brand px-4 py-2 text-sm font-medium hover:bg-brand-dark"
          >
            Get tickets
          </a>
        </div>
      </div>
    </article>
  );
}
