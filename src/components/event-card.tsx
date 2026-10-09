import { Link } from "@tanstack/react-router";
import { MapPin, CalendarDays, ArrowRight } from "lucide-react";
import { ksh, fmtDate } from "@/lib/format";
import { minPrice, remaining, type PublicEvent } from "@/lib/events";

export function EventCard({ e }: { e: PublicEvent }) {
  const left = remaining(e);
  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: e.id }}
      className="group animate-fade-up overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-1"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={e.cover_image_url ?? ""} alt={e.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
          {e.event_type}
        </span>
        {left > 0 && left < 100 && (
          <span className="absolute right-2 top-2 rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
            {left} left
          </span>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-1 text-sm font-extrabold">{e.name}</h3>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {e.venue} · {e.location}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          {fmtDate(e.event_date)}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs">
            From <b className="text-primary">{ksh(minPrice(e))}</b>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">
            {left === 0 ? "Sold out" : "Get Tickets"} <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
