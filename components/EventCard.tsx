import React from "react";

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
  if (!start) return "TBA";

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const startISO = start.dateTime ?? (start.date ? `${start.date}T00:00:00` : undefined);
  const endISO = end?.dateTime ?? (end?.date ? `${end.date}T00:00:00` : undefined);

  if (!startISO) return "TBA";

  const sd = new Date(startISO);
  const ed = endISO ? new Date(endISO) : undefined;

  const isAllDay = !!start.date && !start.dateTime;

  if (isAllDay) {
    return sd.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: tz,
    });
  }

  const startStr = sd.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });

  if (ed) {
    const endStr = ed.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    });
    return `${startStr} – ${endStr}`;
  }
  return startStr;
}

/* ---------- 🧹 NEW HELPER TO CLEAN IMAGE URLs ---------- */
function cleanImageUrl(input?: string): string | undefined {
  if (!input) return undefined;

  // Decode common HTML entities
  const decoded = input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // If the string contains an <a href="..."> tag, extract the href
  const hrefMatch = decoded.match(/href=["']([^"']+)["']/i);
  if (hrefMatch) return hrefMatch[1];

  // Otherwise, grab the first http(s) URL
  const urlMatch = decoded.match(/https?:\/\/[^\s"'<>]+/i);
  return urlMatch ? urlMatch[0] : undefined;
}

/* ------------------------------------------------------- */

export default function EventCard({ event }: Props) {
  // Find an image: attachments, or first image URL in description
  const rawImage =
    event.attachments?.find((a) => (a.mimeType || "").startsWith("image/"))?.fileUrl ||
    (event.description &&
      event.description.match(/https?:[^\s)]+\.(?:png|jpg|jpeg|gif)/i)?.[0]) ||
    event.description ||
    undefined;

  const image = cleanImageUrl(rawImage);

  // Ticket link: first non-Google URL in description; else fallback to the Google event link
  const ticket =
    (event.description &&
      event.description.match(/https?:[^\s)"]+/gi)?.find(
        (u) => !u.includes("google.com")
      )) ||
    event.htmlLink;

  return (
    <article className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 hover:bg-white/10 transition">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={event.summary || ""}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="h-48 w-full bg-white/10 grid place-items-center text-white/50">
          No image
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-semibold leading-snug">
          {event.summary || "Untitled event"}
        </h3>
        <p className="mt-1 text-white/70 text-sm">
          {formatDateRange(event.start, event.end)}
        </p>
        {event.location && (
          <p className="mt-1 text-white/60 text-sm">{event.location}</p>
        )}
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
