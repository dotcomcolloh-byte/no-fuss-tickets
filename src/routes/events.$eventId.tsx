import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CalendarDays, Clock, MapPin, Minus, Plus, ArrowRight, Building2 } from "lucide-react";
import { PublicShell } from "@/components/brand";
import { publicEventQuery } from "@/lib/events";
import { ksh, fmtDate, fmtTime } from "@/lib/format";
import { FEE_RATE } from "@/lib/checkout.functions";

export const Route = createFileRoute("/events/$eventId")({
  head: () => ({
    meta: [
      { title: "Event Tickets — Tumdo Kalenjin Connect" },
      { name: "description", content: "Choose your tickets — General, VIP or VVIP — and check out in seconds." },
      { property: "og:title", content: "Event Tickets — Tumdo Kalenjin Connect" },
      { property: "og:description", content: "Choose your tickets and check out in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventDetails,
});

function EventDetails() {
  const { eventId } = Route.useParams();
  const { data: e, isLoading } = useQuery(publicEventQuery(eventId));
  const [qty, setQty] = useState<Record<string, number>>({});
  const nav = useNavigate();

  if (isLoading) return <PublicShell><div className="m-4 h-72 animate-pulse rounded-2xl bg-muted" /></PublicShell>;
  if (!e)
    return (
      <PublicShell>
        <div className="p-10 text-center">
          <p className="font-bold">Event not found</p>
          <Link to="/" className="mt-3 inline-block text-primary underline">Back to events</Link>
        </div>
      </PublicShell>
    );

  const subtotal = e.ticket_types.reduce((s, t) => s + (qty[t.id] ?? 0) * Number(t.price), 0);
  const fees = Math.round(subtotal * FEE_RATE);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const set = (id: string, n: number, max: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(n, max, 20)) }));

  return (
    <PublicShell>
      <div className="pb-44 md:grid md:grid-cols-[1fr_360px] md:gap-6 md:p-4 md:pb-8">
        <div>
          <div className="flex items-center gap-2 px-4 py-3 md:px-0">
            <Link to="/" className="text-primary"><ArrowLeft className="h-5 w-5" /></Link>
            <span className="font-bold">Event Details</span>
          </div>
          <div className="mx-4 overflow-hidden rounded-2xl shadow-card md:mx-0">
            <img src={e.cover_image_url ?? ""} alt={e.name} className="aspect-[16/10] w-full object-cover" />
          </div>
          <div className="space-y-2 px-4 pt-4 md:px-0">
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase text-accent-foreground">{e.event_type}</span>
            <h1 className="pt-1 text-2xl font-black">{e.name}</h1>
            <p className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-primary" />{fmtDate(e.event_date)}</p>
            <p className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" />{fmtTime(e.start_time)}{e.end_time && ` – ${fmtTime(e.end_time)}`}</p>
            <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />{e.venue}, {e.location}</p>
            <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border bg-card p-3">
              <Building2 className="h-8 w-8 rounded-lg bg-accent p-1.5 text-primary" />
              <div className="text-xs"><p className="text-muted-foreground">Organised by</p><p className="font-bold">Tumdo Kalenjin Connect</p></div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-6 md:px-0">
          <h2 className="mb-3 text-lg font-extrabold">Select Ticket Type</h2>
          <div className="space-y-3">
            {e.ticket_types.map((t) => {
              const left = t.quantity - t.sold;
              const n = qty[t.id] ?? 0;
              return (
                <div key={t.id} className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-card">
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="font-black text-primary">{ksh(t.price)}</p>
                    <p className="text-[11px] text-muted-foreground">{left > 0 ? `${left} remaining` : "Sold out"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button aria-label={`Fewer ${t.name}`} disabled={n === 0} onClick={() => set(t.id, n - 1, left)} className="grid h-8 w-8 place-items-center rounded-full border border-primary text-primary disabled:opacity-30">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-5 text-center font-bold">{n}</span>
                    <button aria-label={`More ${t.name}`} disabled={n >= left || n >= 20} onClick={() => set(t.id, n + 1, left)} className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-30">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card p-4 shadow-card md:static md:mt-4 md:rounded-2xl md:border">
            <div className="mx-auto max-w-md space-y-1 text-sm">
              {e.ticket_types.filter((t) => qty[t.id]).map((t) => (
                <div key={t.id} className="flex justify-between text-muted-foreground"><span>{qty[t.id]} × {t.name}</span><span>{ksh(qty[t.id] * Number(t.price))}</span></div>
              ))}
              {fees > 0 && <div className="flex justify-between text-muted-foreground"><span>Fees</span><span>{ksh(fees)}</span></div>}
              <div className="flex justify-between pt-1 text-base font-black"><span>Total</span><span>{ksh(subtotal + fees)}</span></div>
              <button
                disabled={count === 0}
                onClick={() =>
                  nav({
                    to: "/checkout/$eventId",
                    params: { eventId: e.id },
                    search: { sel: Object.entries(qty).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(",") },
                  })
                }
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-bold text-primary-foreground shadow-red transition disabled:opacity-40"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
