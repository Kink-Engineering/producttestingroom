
import "./globals.css";
import type { Metadata } from "next";
import { clsx } from "clsx";

export const metadata: Metadata = {
  title: "Product Testing Room",
  description: "Events powered by Google Calendar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={clsx("min-h-screen antialiased bg-black text-white")}>
        <header className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
            <a href="/" className="text-xl font-semibold tracking-tight">Product Testing Room</a>
            <nav className="text-sm opacity-80">
              <a href="/events" className="hover:opacity-100">Events</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm opacity-70">
            © {new Date().getFullYear()} Product Testing Room
          </div>
        </footer>
      </body>
    </html>
  );
}
