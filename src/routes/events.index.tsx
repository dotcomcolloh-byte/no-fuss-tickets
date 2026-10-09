import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { z } from "zod";
import { PublicShell, BottomNav } from "@/components/brand";
import { EventCard } from "@/components/event-card";
import { publicEventsQuery } from "@/lib/events";
import { CATEGORIES } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events/")({
  validateSearch: z.object({ q: z.string().optional(), view: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Browse Events — Tumdo Kalenjin Connect" },
      { name: "description", content: "Search concerts, festivals, comedy, sports, conferences and cultural events across Kenya." },
      { property: "og:title", content: "Browse Events — Tumdo Kalenjin Connect" },
      { property: "og:description", content: "Find your next event and get tickets in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Browse,
});

function Browse() {
  const sp = Route.useSearch();
  const [q, setQ] = useState(sp.q ?? "");
  const [cat, setCat] = useState("All");
  const { data: events = [] } = useQuery(publicEventsQuery);
  const s = q.trim().toLowerCase();
  const list = events.filter(
    (e) =>
      (cat === "All" || e.event_type === cat) &&
      (!s || [e.name, e.event_type, e.venue, e.location].some((x) => x.toLowerCase().includes(s))),
  );
  return (
    <PublicShell>
      <div className="px-4 pt-5">
        <h1 className="text-2xl font-black">Browse Events</h1>
        <div className="mt-3 flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 shadow-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, concerts, festivals, comedy, sports…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn("shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold", cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card")}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{list.length} event{list.length === 1 ? "" : "s"}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
          {list.map((e) => <EventCard key={e.id} e={e} />)}
        </div>
      </div>
      <BottomNav />
    </PublicShell>
  );
}
