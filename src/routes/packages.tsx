import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shell, SectionLabel } from "@/components/site/shell";
import { packagesQuery, money } from "@/lib/studio-data";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { title: "Packages & Pricing — Rent-a-Content Studio" },
      {
        name: "description",
        content:
          "Hourly, half-day and full-day studio rental plus creator and business content packages. See exactly what each one includes.",
      },
      { property: "og:title", content: "Packages & Pricing — Rent-a-Content Studio" },
      {
        property: "og:description",
        content: "Transparent hourly, half-day, full-day, creator and business studio packages.",
      },
    ],
  }),
  component: PackagesPage,
});

function PackagesPage() {
  const { data: packages = [], isLoading } = useQuery(packagesQuery);

  return (
    <Shell>
      <section className="py-10">
        <SectionLabel>Packages &amp; pricing</SectionLabel>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Pay only for the hours you create</h1>
        <p className="mt-4 max-w-xl text-lg text-ink/60">
          Every package includes the room, lighting, backdrops and on-site support. No cleaning
          fees, no surprise add-ons.
        </p>
      </section>

      {isLoading ? <p className="text-sm text-ink/50">Loading packages…</p> : null}

      <section className="grid gap-5 pb-10 lg:grid-cols-3">
        {packages.map((p) => (
          <div
            key={p.id}
            className={`relative rounded-3xl p-7 ${
              p.highlight
                ? "glass-panel-strong shadow-2xl shadow-ink/10 ring-1 ring-brand/40"
                : "glass-panel"
            }`}
          >
            {p.highlight ? (
              <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                Most popular
              </span>
            ) : null}
            <h2 className="font-display text-lg font-semibold">{p.name}</h2>
            <p className="mt-3 font-display text-4xl font-bold">
              {money(p.price)}
              <span className="text-base font-medium text-ink/40">
                {p.duration_hours === 1 ? "/hr" : ` / ${p.duration_hours} hrs`}
              </span>
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink/70">
              {p.includes.map((i) => (
                <li key={i}>· {i}</li>
              ))}
            </ul>
            <Link
              to="/book"
              search={{ pkg: p.slug }}
              className={`mt-6 block rounded-full py-3 text-center text-sm font-semibold transition ${
                p.highlight
                  ? "bg-brand text-brand-foreground shadow-lg shadow-brand/30 hover:brightness-105"
                  : "glass-panel-strong text-ink hover:bg-white"
              }`}
            >
              Choose {p.name}
            </Link>
          </div>
        ))}
      </section>

      <section className="pb-10">
        <div className="rounded-[2rem] glass-panel p-8 sm:p-10">
          <h2 className="text-2xl font-bold">Good to know</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold">Cancellations</p>
              <p className="mt-1 text-sm text-ink/60">
                Free up to 24 hours before your slot. Inside 24 hours a 50% fee applies.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Overtime</p>
              <p className="mt-1 text-sm text-ink/60">
                Extend from your dashboard while the next slot is still free.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Payment</p>
              <p className="mt-1 text-sm text-ink/60">
                Reserve online now and settle on arrival — card payments online are coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
