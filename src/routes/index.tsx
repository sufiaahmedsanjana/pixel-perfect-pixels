import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shell, SectionLabel } from "@/components/site/shell";
import { packagesQuery, studiosQuery, studioImage, money } from "@/lib/studio-data";
import heroImage from "@/assets/studio-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rent-a-Content Studio — Your Space. Your Story. Your Content." },
      {
        name: "description",
        content:
          "Rent a fully-lit, sound-treated content studio by the hour or day. Pro cameras, lighting and backdrops included. Book your slot online.",
      },
      {
        property: "og:title",
        content: "Rent-a-Content Studio — Your Space. Your Story. Your Content.",
      },
      {
        property: "og:description",
        content:
          "A creator-ready studio you can rent by the hour or day, with pro gear and instant online booking.",
      },
    ],
  }),
  component: Home,
});

const facilities = [
  {
    icon: "🎥",
    title: "Camera bay",
    body: "Two Sony FX3 mirrorless bodies, 24–70mm & 70–200mm glass, plus a 3-axis gimbal and wireless mics.",
    tint: "bg-brand/15",
  },
  {
    icon: "💡",
    title: "Lighting & grip",
    body: "Three LED panels, a softbox kit, backdrop stands, and a full C-stand set for any setup you need.",
    tint: "bg-accent/15",
  },
  {
    icon: "🔊",
    title: "Sound room",
    body: "Acoustically treated booth with a Neumann mic, pop filter, and a clean 48V interface for crisp audio.",
    tint: "bg-sky-400/15",
  },
];

function Home() {
  const { data: studios = [] } = useQuery(studiosQuery);
  const { data: packages = [] } = useQuery(packagesQuery);
  const featured = packages.slice(0, 3);

  return (
    <Shell>
      {/* Hero */}
      <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full glass-panel px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-brand">
            Book by the hour
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-[1.02] sm:text-6xl">
            Your Space. Your Story. Your Content.
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink/60">
            Rent a fully-lit, sound-treated production space with pro camera and lighting gear.
            Pick a package, grab a slot, and walk in ready to shoot.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/book"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition hover:brightness-105"
            >
              Book Now
            </Link>
            <Link
              to="/packages"
              className="rounded-full glass-panel px-6 py-3 text-sm font-semibold text-ink transition hover:bg-glass-strong"
            >
              View Packages
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-8">
            <div>
              <p className="font-display text-2xl font-bold">1,200+</p>
              <p className="text-sm text-ink/50">creators hosted</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">4.9</p>
              <p className="text-sm text-ink/50">average rating</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">24/7</p>
              <p className="text-sm text-ink/50">keypad access</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl glass-panel p-3 shadow-2xl shadow-ink/10">
            <img
              src={heroImage}
              alt="Bright content studio with softbox lighting and a camera on a tripod"
              width={1024}
              height={1280}
              className="aspect-[4/5] w-full rounded-2xl object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 w-52 rounded-2xl glass-panel-strong p-4 shadow-xl shadow-ink/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Now booking</p>
            <p className="mt-1 text-sm font-semibold">Open 9:00 AM – 9:00 PM</p>
            <p className="mt-1 text-sm font-medium text-brand">Same-day slots available</p>
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-14">
        <SectionLabel>Studio &amp; facilities</SectionLabel>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Everything you need, already set up</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {facilities.map((f) => (
            <div key={f.title} className="rounded-3xl glass-panel p-6">
              <div className={`grid size-11 place-items-center rounded-xl text-lg ${f.tint}`}>
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured setups */}
      <section className="py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel>Featured setups</SectionLabel>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Three rooms, endless looks</h2>
          </div>
          <Link to="/studio" className="text-sm font-medium text-brand">
            See all facilities
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {studios.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-3xl glass-panel">
              <img
                src={studioImage(s.image_key)}
                alt={s.name}
                loading="lazy"
                width={1024}
                height={768}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                  <span className="text-sm font-medium text-brand">{money(s.hourly_rate)}/hr</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-ink/60">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-14">
        <SectionLabel>Packages &amp; pricing</SectionLabel>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Pay only for the hours you create</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {featured.map((p) => (
            <div key={p.id} className="rounded-3xl glass-panel p-7">
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
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
                className="mt-6 block rounded-full glass-panel-strong py-3 text-center text-sm font-semibold text-ink transition hover:bg-white"
              >
                Choose {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
