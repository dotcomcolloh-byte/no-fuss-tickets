import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, MapPin, CalendarDays, ArrowRight } from "lucide-react";
import { PublicShell, BottomNav } from "@/components/brand";
import { EventCard } from "@/components/event-card";
import { publicEventsQuery } from "@/lib/events";
import { CATEGORIES, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tumdo Kalenjin Connect — Events. Tickets. Memories." },
      { name: "description", content: "Buy tickets to concerts, festivals, comedy, sports and cultural events in Kenya. No account needed — pay with M-Pesa or card." },
      { property: "og:title", content: "Tumdo Kalenjin Connect — Events. Tickets. Memories." },
      { property: "og:description", content: "Kenya's event tickets in seconds. Pay with M-Pesa or card and get your QR ticket instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: events = [], isLoading } = useQuery(publicEventsQuery);
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const hero = events.find((e) => e.featured) ?? events[0];
  const list = events.filter((e) => cat === "All" || e.event_type === cat);

  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden md:mx-4 md:mt-4 md:rounded-3xl">
        <div className="relative h-[420px] md:h-[460px]">
          {hero?.cover_image_url && <img src={hero.cover_image_url} alt={hero.name} className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-hero-fade" />
          <div className="relative flex h-full flex-col justify-end gap-3 p-5 pb-16 text-primary-foreground md:p-10 md:pb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-90">Live Events · Unforgettable Moments</p>
            {hero ? (
              <div className="animate-fade-up space-y-2">
                <span className="inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase">{hero.event_type}</span>
                <h1 className="text-4xl font-black leading-[1.05] md:text-6xl">{hero.name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-95">
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmtDate(hero.event_date)}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{hero.venue}, {hero.location}</span>
                </div>
                <p className="line-clamp-2 max-w-lg text-sm opacity-90">{hero.description}</p>
                <Link
                  to="/events/$eventId"
                  params={{ eventId: hero.id }}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold shadow-red transition hover:scale-[1.03]"
                >
                  Get Tickets <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <h1 className="text-4xl font-black">Live Events,<br />Unforgettable Moments</h1>
            )}
          </div>
        </div>
      </section>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          nav({ to: "/events", search: { q } });
        }}
        className="relative z-10 mx-4 -mt-7 flex items-center gap-2 rounded-full border bg-card p-1.5 pl-4 shadow-card"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events, concerts, festivals, comedy, sports…"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
        />
        <button className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Categories */}
      <div className="mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition",
              cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="px-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Upcoming Events</h2>
          <Link to="/events" className="flex items-center gap-1 text-xs font-bold text-primary">
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : list.length === 0 ? (
          <p className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">No {cat.toLowerCase()} events yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {list.map((e) => <EventCard key={e.id} e={e} />)}
          </div>
        )}
      </section>
      <BottomNav />
    </PublicShell>
  );
}
