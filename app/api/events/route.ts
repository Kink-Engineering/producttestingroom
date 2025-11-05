
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.GOOGLE_API_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!key || !calendarId) {
    return NextResponse.json({ items: [], error: "Missing GOOGLE_API_KEY or GOOGLE_CALENDAR_ID" }, { status: 200 });
  }

  const timeMin = new Date().toISOString();
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("key", key);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("maxResults", "24");

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ items: [], error: text }, { status: 200 });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
