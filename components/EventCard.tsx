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

/* ------------------ Robust URL sanitation helpers ------------------ */

function decodeHtmlEntitiesOnce(s: string): string {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;/gi, "/");
}

function decodeHtmlEntitiesDeep(s: string): string {
  // Some descriptions are double-encoded; decode up to 3 times until stable.
  let prev = s;
  for (let i = 0; i < 3; i++) {
    const next = decodeHtmlEntitiesOnce(prev);
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

/**
 * Extract the first plausible http(s) URL in a messy/encoded string.
 * - Prefers typical image URLs (jpg, jpeg, png, gif, webp, svg) but will fall back to any http(s) URL.
 * - Strips wrapping HTML like <a href="..."> or <img src="..."> and trims trailing quotes, parens, or angle brackets.
 */
function extractFirstUrl(input: string): string | undefined {
  const decoded = decodeHtmlEntitiesDeep(input);

  // If it's an anchor or img tag, try to grab href/src directly
  const href = decoded.match(/href=["']([^"']+)["']/i)?.[1];
  const srcAttr = decoded.match(/src=["']([^"']+)["']/i)?.[1];
  let candidate = href || srcAttr;

  // If not found, regex the first http(s) URL
  if (!candidate) {
    const anyUrl = decoded.match(/https?:\/\/[^\s"'<>)]*/i)?.[0];
    candidate = anyUrl || undefined;
  }

  if (!candidate) return undefined;

  // Trim common trailing junk
  candidate = candidate.replace(/[)"'>]+$/g, "").replace(/^["'(]+/g, "");

  // If there are nested encodings again inside candidate, decode once more
  candidate = decodeHtmlEntitiesDeep(candidate);

  // Final quick sanity check: keep obvious image URLs first, otherwise allow any http(s)
  const imageLike = candidate.match(/\.(?:png|jpe?g|gif|webp|svg)(\?.*)?$/i);
  if (imageLike) return candidate;

  // Some CDNs (e.g., Shopify) serve images without extension; allow known hosts
  const okHost = /(?:cdn\.shopify\.com|kinkstore\.com|images\.unsplash\.com|lh3\.googleusercontent\.com)/i.test(
    candidate
  );
  if (okHost) return candidate;

  // Fallback: return candidate anyway (better to attempt render than show "No image")
  return candidate;
}

function cleanImageUrl(input?: string): string | undefined {
  if (!input) return undefined;
  return extractFirstUrl(input);
}

/* ------------------------------------------------------------------- */

export default function EventCard({ event }: Props) {
  // Build a raw image source from attachments or description, then sanitize.
  const rawImageFromAttachment =
    event.attachments?.find((a) => (a.mimeType || "").startsWith("image/"))?.fileUrl;

  const rawImageFromDescription =
    (event.description &&
      // Prefer explicit image-like URLs in description
      event.description.match(/https?:[^\s)'"<>]+?\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s"')<>]*)?/i)?.[0]) ||
    event.description;

  const image = cleanImageUrl(rawImageFromAttachment || rawImageFromDescription);

  // Ticket link: first non-Google URL in description; else fallback to the Google event link
  const ticket =
    (event.description &&
      event.description
        .match(/https?:[^\s)"]+/gi)
        ?.map((u) => decodeHtmlEntitiesDeep(u))
        .find((u) => !/google\.com/i.test(u))) ||
    event.htmlLink;

  return (
    <article className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 hover:bg-white/10 transition">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={event.summary || ""}
          className="h-48 w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
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
