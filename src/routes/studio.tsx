import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shell, SectionLabel } from "@/components/site/shell";
import { studiosQuery, studioImage, money } from "@/lib/studio-data";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio & Facilities — Rent-a-Content Studio" },
      {
        name: "description",
        content:
          "Tour our rentable rooms: seamless paper cyclorama, treated sound room and chroma bay, with lighting, cameras, microphones and backdrops included.",
      },
      { property: "og:title", content: "Studio & Facilities — Rent-a-Content Studio" },
      {
        property: "og:description",
        content: "Rooms, equipment and hourly rates for our content creation studio.",
      },
    ],
  }),
  component: StudioPage,
});

const amenities = [
  "Free guest Wi-Fi (1 Gbps)",
  "Makeup and changing corner",
  "Kitchenette with coffee",
  "Street-level loading access",
  "Client lounge seating",
  "Two free parking bays",
];

function StudioPage() {
  const { data: studios = [], isLoading } = useQuery(studiosQuery);

  return (
    <Shell>
      <section className="py-10">
        <SectionLabel>Studio &amp; facilities</SectionLabel>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Rooms, gear and everything between</h1>
        <p className="mt-4 max-w-xl text-lg text-ink/60">
          Every room comes lit and ready. Rates below are the walk-in hourly price — packages bring
          it down for longer shoots.
        </p>
      </section>

      <section className="space-y-6 pb-8">
        {isLoading ? <p className="text-sm text-ink/50">Loading setups…</p> : null}
        {studios.map((s, i) => (
          <article
            key={s.id}
            className={`grid gap-6 overflow-hidden rounded-3xl glass-panel p-3 lg:grid-cols-2 ${
              i % 2 === 1 ? "lg:[&>img]:order-2" : ""
            }`}
          >
            <img
              src={studioImage(s.image_key)}
              alt={s.name}
              loading="lazy"
              width={1024}
              height={768}
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
            <div className="p-4 lg:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl font-bold">{s.name}</h2>
                <span className="font-display text-xl font-bold text-brand">
                  {money(s.hourly_rate)}
                  <span className="text-sm font-medium text-ink/40">/hr</span>
                </span>
              </div>
              <p className="mt-3 text-sm text-ink/60">{s.description}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
                Included equipment
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {s.equipment.map((e) => (
                  <li
                    key={e}
                    className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
                  >
                    {e}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink/50">Fits up to {s.capacity} people</p>
              <Link
                to="/book"
                search={{ studio: s.slug }}
                className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Book {s.name.split("—")[0].trim()}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="py-10">
        <div className="rounded-[2rem] glass-panel p-8 sm:p-10">
          <SectionLabel>On site</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold">Extras that come with every booking</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((a) => (
              <li key={a} className="rounded-2xl glass-panel-strong px-4 py-3 text-sm text-ink/70">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Shell>
  );
}
