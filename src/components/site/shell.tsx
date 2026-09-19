import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

/** Soft coloured light blooms that sit behind every page. */
function Blooms() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-16 h-96 w-96 rounded-full bg-brand/40 blur-3xl" />
      <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
    </div>
  );
}

const nav = [
  { to: "/studio", label: "Studio" },
  { to: "/packages", label: "Packages" },
  { to: "/book", label: "Book" },
  { to: "/contact", label: "Contact" },
] as const;

function Header() {
  const { user, isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
      <Link to="/" className="flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-xl bg-ink font-display text-primary-foreground">
          R
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">Rent-a-Content</span>
      </Link>

      <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`transition hover:text-ink ${pathname === item.to ? "text-ink" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {isAdmin ? (
          <Link
            to="/admin"
            className="hidden rounded-full glass-panel px-4 py-2 text-sm font-medium text-ink/80 transition hover:bg-glass-strong sm:block"
          >
            Admin
          </Link>
        ) : null}
        <Link
          to={user ? "/dashboard" : "/auth"}
          className="hidden rounded-full glass-panel px-4 py-2 text-sm font-medium text-ink/80 transition hover:bg-glass-strong sm:block"
        >
          {user ? "Dashboard" : "Sign in"}
        </Link>
        <Link
          to="/book"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-ink/20 transition hover:opacity-90"
        >
          Book a slot
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 mt-10 border-t border-white/40 bg-white/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-ink font-display text-primary-foreground">
            R
          </div>
          <span className="font-display text-sm font-semibold">Rent-a-Content Studio</span>
        </div>
        <p className="text-sm text-ink/50">
          © {new Date().getFullYear()} Rent-a-Content Studio · Booked by the hour, built for
          creators.
        </p>
      </div>
    </footer>
  );
}

/** Page frame: blooms, header, content column and footer. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Blooms />
      <Header />
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24">{children}</main>
      <Footer />
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand">{children}</p>
  );
}
