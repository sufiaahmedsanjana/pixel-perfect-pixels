import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shell, SectionLabel } from "@/components/site/shell";
import { useAuth } from "@/hooks/use-auth";
import {
  studiosQuery,
  packagesQuery,
  slotHours,
  formatHour,
  money,
  toDateInput,
  CLOSE_HOUR,
} from "@/lib/studio-data";

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>) => ({
    studio: typeof search["studio"] === "string" ? (search["studio"] as string) : undefined,
    pkg: typeof search["pkg"] === "string" ? (search["pkg"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book the Studio — Rent-a-Content Studio" },
      {
        name: "description",
        content:
          "Choose a room, a package and a time slot. Live availability, instant confirmation and no double bookings.",
      },
      { property: "og:title", content: "Book the Studio — Rent-a-Content Studio" },
      {
        property: "og:description",
        content: "Pick your date and time and reserve the studio online in under a minute.",
      },
    ],
  }),
  component: BookPage,
});

type Busy = { starts_at: string; ends_at: string };

function BookPage() {
  const { studio: studioSlug, pkg: pkgSlug } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const { data: studios = [] } = useQuery(studiosQuery);
  const { data: packages = [] } = useQuery(packagesQuery);

  const [studioId, setStudioId] = useState<string>("");
  const [packageId, setPackageId] = useState<string>("");
  const [date, setDate] = useState<string>(toDateInput(new Date()));
  const [hour, setHour] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ reference: string; when: string } | null>(
    null,
  );

  // Preselect from query string / first available option.
  useEffect(() => {
    if (!studioId && studios.length) {
      setStudioId(studios.find((s) => s.slug === studioSlug)?.id ?? studios[0].id);
    }
  }, [studios, studioSlug, studioId]);

  useEffect(() => {
    if (!packageId && packages.length) {
      setPackageId(packages.find((p) => p.slug === pkgSlug)?.id ?? packages[0].id);
    }
  }, [packages, pkgSlug, packageId]);

  // Prefill contact details from the signed-in profile.
  useEffect(() => {
    if (!user) return;
    setEmail((prev) => prev || user.email || "");
    void supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setName((prev) => prev || data.full_name!);
        if (data?.phone) setPhone((prev) => prev || data.phone!);
      });
  }, [user]);

  const selectedPackage = packages.find((p) => p.id === packageId);
  const duration = selectedPackage?.duration_hours ?? 1;

  const { data: busy = [] } = useQuery({
    queryKey: ["busy", studioId, date],
    enabled: Boolean(studioId && date),
    queryFn: async (): Promise<Busy[]> => {
      const { data, error } = await supabase.rpc("get_busy_ranges", {
        _studio_id: studioId,
        _day: date,
      });
      if (error) throw error;
      return (data ?? []) as Busy[];
    },
  });

  /** A slot is bookable when its whole duration is free and inside opening hours. */
  const availability = useMemo(() => {
    const now = new Date();
    return slotHours().map((h) => {
      const start = new Date(`${date}T${String(h).padStart(2, "0")}:00:00`);
      const end = new Date(start.getTime() + duration * 3600_000);
      const pastClosing = h + duration > CLOSE_HOUR;
      const inPast = start.getTime() < now.getTime();
      const overlaps = busy.some((b) => {
        const bs = new Date(b.starts_at).getTime();
        const be = new Date(b.ends_at).getTime();
        return start.getTime() < be && end.getTime() > bs;
      });
      return { hour: h, available: !pastClosing && !inPast && !overlaps };
    });
  }, [busy, date, duration]);

  useEffect(() => {
    // Drop a selected hour that stopped being available (e.g. package changed).
    if (hour !== null && !availability.find((a) => a.hour === hour)?.available) setHour(null);
  }, [availability, hour]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to complete your booking.");
      void navigate({ to: "/auth" });
      return;
    }
    if (!studioId || !packageId || hour === null) {
      toast.error("Pick a studio, a package and a time slot.");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Name, email and phone number are required.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("That email address doesn't look right.");
      return;
    }

    const start = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
    const end = new Date(start.getTime() + duration * 3600_000);

    setSubmitting(true);
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        studio_id: studioId,
        package_id: packageId,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        notes: notes.trim() || null,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        total_price: selectedPackage?.price ?? 0,
      })
      .select("reference, starts_at")
      .single();
    setSubmitting(false);

    if (error) {
      // The database enforces non-overlapping bookings per studio.
      if (error.message.includes("bookings_no_overlap") || error.code === "23P01") {
        toast.error("That slot was just taken. Please choose another time.");
        void queryClient.invalidateQueries({ queryKey: ["busy", studioId, date] });
        setHour(null);
      } else {
        toast.error("We couldn't save your booking. Please try again.");
      }
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["busy", studioId, date] });
    setConfirmation({
      reference: data.reference,
      when: new Date(data.starts_at).toLocaleString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    });
    setHour(null);
    setNotes("");
  }

  if (confirmation) {
    return (
      <Shell>
        <section className="py-16">
          <div className="mx-auto max-w-lg rounded-[2rem] glass-panel-strong p-10 text-center shadow-2xl shadow-ink/10">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/15 text-2xl">
              ✅
            </div>
            <h1 className="mt-5 text-3xl font-bold">Booking confirmed</h1>
            <p className="mt-3 text-ink/60">
              We've reserved the studio for <strong>{confirmation.when}</strong>.
            </p>
            <p className="mt-4 rounded-2xl glass-panel px-4 py-3 font-display text-lg font-bold tracking-wide">
              Ref {confirmation.reference}
            </p>
            <p className="mt-4 text-sm text-ink/50">
              Payment is settled on arrival. You'll get your door code 24 hours before the shoot.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard"
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                View my bookings
              </Link>
              <button
                onClick={() => setConfirmation(null)}
                className="rounded-full glass-panel px-5 py-2.5 text-sm font-semibold text-ink"
              >
                Book another slot
              </button>
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="py-10">
        <SectionLabel>Booking</SectionLabel>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Pick a date &amp; time</h1>
        <p className="mt-4 max-w-xl text-lg text-ink/60">
          Availability updates live. Unavailable slots are already booked or blocked for
          maintenance.
        </p>
      </section>

      <form onSubmit={submit} className="grid gap-6 pb-12 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[2rem] glass-panel p-6 sm:p-8">
          {/* Studio */}
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Studio</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {studios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStudioId(s.id)}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  studioId === s.id
                    ? "bg-ink font-semibold text-primary-foreground"
                    : "glass-field font-medium text-ink/60"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Package */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink/40">Package</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {packages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPackageId(p.id)}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  packageId === p.id
                    ? "bg-brand font-semibold text-brand-foreground shadow-lg shadow-brand/30"
                    : "glass-field font-medium text-ink/60"
                }`}
              >
                {p.name} · {money(p.price)}
              </button>
            ))}
          </div>

          {/* Date */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink/40">Date</p>
          <input
            type="date"
            value={date}
            min={toDateInput(new Date())}
            onChange={(e) => {
              setDate(e.target.value);
              setHour(null);
            }}
            className="mt-3 w-full rounded-xl glass-field px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-64"
          />

          {/* Slots */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink/40">
            Available times — {duration} hr {duration === 1 ? "slot" : "block"}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {availability.map((slot) => (
              <button
                key={slot.hour}
                type="button"
                disabled={!slot.available}
                onClick={() => setHour(slot.hour)}
                className={`rounded-xl py-2.5 text-sm transition ${
                  hour === slot.hour
                    ? "bg-brand font-semibold text-brand-foreground shadow-lg shadow-brand/30"
                    : slot.available
                      ? "glass-field font-medium text-ink/70 hover:bg-white"
                      : "cursor-not-allowed bg-ink/5 font-medium text-ink/30 line-through"
                }`}
              >
                {formatHour(slot.hour)}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="rounded-[2rem] glass-panel p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold">Your details</h2>
          {!authLoading && !user ? (
            <p className="mt-3 rounded-xl bg-brand/10 px-4 py-3 text-sm text-ink/70">
              <Link to="/auth" className="font-semibold text-brand">
                Sign in
              </Link>{" "}
              to confirm a booking and manage it later.
            </p>
          ) : null}
          <div className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl glass-field px-4 py-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className="w-full rounded-xl glass-field px-4 py-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full rounded-xl glass-field px-4 py-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What are you shooting? Any gear you're bringing?"
              className="w-full rounded-xl glass-field px-4 py-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mt-5 rounded-2xl glass-panel-strong p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink/60">Selected</span>
              <span className="font-semibold">
                {hour === null ? "No slot yet" : `${date} · ${formatHour(hour)}`}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-ink/60">Total</span>
              <span className="font-display text-lg font-bold">
                {money(selectedPackage?.price ?? 0)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-full bg-ink py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Reserving…" : "Confirm booking"}
          </button>
          <p className="mt-3 text-xs text-ink/50">
            Free cancellation up to 24 hours before your slot.
          </p>
        </div>
      </form>
    </Shell>
  );
}
