'use client';

import React from "react";

function cleanImageUrl(input?: string): string | undefined {
  if (!input) return undefined;

  // Decode common HTML entities
  const decoded = input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // If the string contains an anchor, pull the href value
  const hrefMatch = decoded.match(/href=["']([^"']+)["']/i);
  if (hrefMatch) return hrefMatch[1];

  // Otherwise, grab the first http(s) URL
  const urlMatch = decoded.match(/https?:\/\/[^\s"'<>]+/i);
  return urlMatch ? urlMatch[0] : undefined;
}

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

type Props = { event: GCalEvent };

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, '').trim();
}

function firstNonEmptyLine(s?: string) {
  if (!s) return undefined;
  const lines = stripHtml(s).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines[0];
}

function extractTagged(lineName: 'Title' | 'Image' | 'Tickets', s?: string) {
  if (!s) return undefined;
  const re = new RegExp(`(?:^|\\n)\\s*${lineName}\\s*:\\s*(.+)`, 'i');
  const m = s.match(re);
  return m?.[1]?.trim();
}

function getTitle(e: GCalEvent) {
  // Priority: explicit Title: in description > summary > first non-empty line of description > fallback
  const fromTag = extractTagged('Title', e.description);
  if (fromTag) return fromTag;
  if (e.summary && e.summary.trim()) return e.summary.trim();
  const fromDesc = firstNonEmptyLine(e.description);
  return fromDesc || 'Untitled event';
}

function isLikelyImageUrl(u: string) {
  // Accept .jpg/.png/etc OR known hosts that serve images without extensions (googleusercontent, ggpht, drive viewer redirects)
  if (/\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(u)) return true;
  if (/googleusercontent\.com|ggpht\.com/i.test(u)) return true;
  // allow anything that isn't obviously a calendar/google UI page
  return !/calendar\.google\.com/i.test(u);
}

function findImage(e: GCalEvent) {
  // 1) Attachment marked as image (best case)
  const att = e.attachments?.find(a => (a.mimeType || '').toLowerCase().startsWith('image/') && a.fileUrl);
  if (att?.fileUrl) return att.fileUrl;

  // 2) "Image: <url>" tag in description
  const tagged = extractTagged('Image', e.description);
  if (tagged && isLikelyImageUrl(tagged)) return tagged;

  // 3) First URL in description that looks usable as an image (no extension required)
  if (e.description) {
    const urls = e.description.match(/https?:\/\/[^\s)"]+/gi) || [];
    const candidate = urls.find(u => isLikelyImageUrl(u));
    if (candidate) return candidate;
  }

  return undefined;
}

function formatDateRange(start?: any, end?: any) {
  if (!start) return "TBA";

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // All-day events have `date` only; timed events have `dateTime`
  const startISO = start?.dateTime ?? (start?.date ? `${start.date}T00:00:00` : undefined);
  const endISO   = end?.dateTime ?? (end?.date ? `${end.date}T00:00:00` : undefined);
  if (!startISO) return "TBA";

  const sd = new Date(startISO);
  const ed = endISO ? new Date(endISO) : undefined;
  const isAllDay = !!start?.date && !start?.dateTime;

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

export default function EventCard({ event }: Props) {
  const title = getTitle(event);

  const image = findImage(event);

  // Ticket link: prefer "Tickets:" tag, else first non-Google URL, else HTML link to the event
  const taggedTickets = extractTagged('Tickets', event.description);
  const ticket =
    taggedTickets ||
    (event.description && (event.description.match(/https?:\/\/[^\s)"]+/gi) || []).find(u => !/google\.com/i.test(u))) ||
    event.htmlLink;

  return (
    <article className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 hover:bg-white/10 transition">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={title} className="h-48 w-full object-cover" />
      ) : (
        <div className="h-48 w-full bg-white/10 grid place-items-center text-white/50">No image</div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-semibold leading-snug">{title}</h3>
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
