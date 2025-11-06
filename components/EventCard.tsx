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

  const startISO = start?.dateTime ?? (start?.date ? `${start.date}T00:00:00` : undefined);
  const endISO = end?.dateTime ?? (end?.date ? `${end.date}T00:00:00` : undefined);
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
  let prev = s;
  for (let i = 0; i < 3; i++) {
    const next = decodeHtmlEntitiesOnce(prev);
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

function decodeUriDeep(s: string): string {
  let prev = s;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(prev);
      if (next === prev) break;
      prev = next;
    } catch {
      break;
    }
  }
  return prev;
}

/** Remove all HTML tags and collapse whitespace/newlines. */
function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Unwrap known redirector URLs (Google /url, /imgres; Facebook l.php, etc.). */
function unwrapKnownRedirect(u: string): string {
  try {
    const url = new URL(u);
    const host = url.hostname.toLowerCase();
    const path = url.pathname;

    // Google redirectors
    if (host.endsWith("google.com")) {
      if (path === "/url") {
        // typical: https://www.google.com/url?q=TARGET
        const q = url.searchParams.get("q") || url.searchParams.get("url");
        if (q) return q;
      }
      if (path === "/imgres") {
        // image search redirect: ...&imgurl=TARGET
        const img = url.searchParams.get("imgurl");
        if (img) return img;
      }
    }

    // Facebook/Messenger redirector
    if (
      host.endsWith("l.facebook.com") ||
      host.endsWith("lm.facebook.com") ||
      host.endsWith("l.messenger.com")
    ) {
      const uParam = url.searchParams.get("u");
      if (uParam) return uParam;
    }

    // Add other redirectors as needed

    return u;
  } catch {
    return u;
  }
}

/** Repeatedly unwrap redirectors until stable (max 3 hops). */
function unwrapRedirectsDeep(u: string): string {
  let prev = u;
  for (let i = 0; i < 3; i++) {
    const next = unwrapKnownRedirect(prev);
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

/**
 * Extract the first plausible http(s) URL from messy/encoded text.
 * - Handles HTML entities, percent encodings, redirector URLs.
 * - Prefers image URLs (jpg/png/gif/webp/svg), but accepts known CDNs w/o extension.
 */
function extractFirstUrl(input: string): string | undefined {
  if (!input) return undefined;

  // Decode entity & URI encodings repeatedly
  let decoded = decodeHtmlEntitiesDeep(input);
  decoded = decodeUriDeep(decoded);

  // Try to capture href/src first, before stripping tags
  const href = decoded.match(/href=["']([^"']+)["']/i)?.[1];
  const srcAttr = decoded.match(/src=["']([^"']+)["']/i)?.[1];
  let candidate = href || srcAttr;

  // If none, strip tags and scan the plain text
  if (!candidate) {
    const text = stripTags(decoded);
    const anyUrl = text.match(/https?:\/\/[^\s"'<>)\]]+/i)?.[0];
    candidate = anyUrl || undefined;
  }

  if (!candidate) return undefined;

  // Final cleanup of wrapper punctuation
  candidate = candidate.replace(/^[("'\[]+/, "").replace(/[)"'\]]+$/, "");

  // Decode again & unwrap redirectors
  candidate = unwrapRedirectsDeep(decodeUriDeep(decodeHtmlEntitiesDeep(candidate)));

  // Prefer obvious image URLs
  const isImageExt = /\.(?:png|jpe?g|gif|webp|svg)(?:\?.*)?$/i.test(candidate);
  if (isImageExt) return candidate;

  // Accept known CDNs even without extensions
  const okCdns = /(cdn\.shopify\.com|kinkstore\.com|images\.unsplash\.com|lh3\.googleusercontent\.com)/i;
  if (okCdns.test(candidate)) return candidate;

  // Fallback: return whatever we found
  return candidate;
}

function cleanImageUrl(input?: string): string | undefined {
  if (!input) return undefined;
  return extractFirstUrl(input);
}

/* ------------------------------------------------------------------- */

export default function EventCard({ event }: Props) {
  // 1) Attachment image (preferred when available)
  const rawFromAttachment =
    event.attachments?.find((a) => (a.mimeType || "").startsWith("image/"))?.fileUrl;

  // 2) Image-looking URL inside description
  const explicitImgInDesc =
    event.description?.match(
      /https?:[^\s)"'<>\]]+?\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s"')\]]*)?/i
    )?.[0];

  // 3) Fallback to any URL in the description (the cleaner will decide)
  const anyUrlInDesc = event.description;

  const image = cleanImageUrl(rawFromAttachment || explicitImgInDesc || anyUrlInDesc);

  // Ticket link: first non-Google final URL in description; else fallback to the Google event link
  const ticket =
    (event.description &&
      (event.description.match(/https?:[^\s)"]+/gi) || [])
        .map((u) => unwrapRedirectsDeep(decodeUriDeep(decodeHtmlEntitiesDeep(u))))
        .find((u) => !/google\.com/i.test(new URL(u).hostname))) ||
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
          title={image}
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
