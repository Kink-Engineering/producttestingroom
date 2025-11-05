
export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-10 lg:grid-cols-2 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Real-world product testing events.
          </h1>
          <p className="mt-5 text-white/80">
            Discover hands-on sessions and demos. All event data is pulled directly from our Google Calendar.
          </p>
          <div className="mt-8 flex gap-4">
            <a href="/events" className="inline-flex items-center rounded-2xl bg-brand px-5 py-3 font-medium hover:bg-brand-dark transition">
              View upcoming events
            </a>
            <a href="#about" className="inline-flex items-center rounded-2xl border border-white/15 px-5 py-3 font-medium hover:bg-white/5 transition">
              Learn more
            </a>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 p-6">
          <div className="aspect-video w-full rounded-2xl bg-white/5 grid place-items-center text-white/60">
            Hero image / video placeholder
          </div>
        </div>
      </div>

      <div id="about" className="mt-24 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="font-semibold">Easy scheduling</h3>
          <p className="mt-2 text-white/70">Edit your Google Calendar; the site updates automatically.</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="font-semibold">Ticketing anywhere</h3>
          <p className="mt-2 text-white/70">Each event links out to your preferred ticketing provider.</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="font-semibold">Brand-ready</h3>
          <p className="mt-2 text-white/70">Colors, fonts, and logos are easy to customize.</p>
        </div>
      </div>
    </section>
  )
}
