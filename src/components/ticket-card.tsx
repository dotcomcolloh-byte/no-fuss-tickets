import { CalendarDays, MapPin, Clock, Crown, UserRound, Mail } from "lucide-react";
import { Logo, QrCode } from "@/components/brand";
import { fmtDate, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TicketView = {
  token: string;
  ticket_code: string;
  status: string;
  ticket_type: string;
  customer?: { full_name: string; email: string } | null;
  event: { name: string; event_type: string; event_date: string; start_time: string | null; venue: string; location: string; cover_image_url: string | null };
};

const STATUS: Record<string, string> = {
  valid: "bg-success text-success-foreground",
  used: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
  refunded: "bg-destructive text-destructive-foreground",
};

export function TicketCard({ t }: { t: TicketView }) {
  return (
    <div className="animate-fade-up mx-auto w-full max-w-sm overflow-hidden rounded-3xl border bg-card shadow-card print:shadow-none">
      <div className="flex items-center justify-between bg-brand px-4 py-3">
        <Logo />
        <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase", STATUS[t.status])}>{t.status}</span>
      </div>
      {t.event.cover_image_url && <img src={t.event.cover_image_url} alt={t.event.name} className="aspect-[16/8] w-full object-cover" />}
      <div className="space-y-1.5 p-4 text-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t.event.event_type}</p>
        <h3 className="text-xl font-black">{t.event.name}</h3>
        <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{fmtDate(t.event.event_date)}</p>
        <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{fmtTime(t.event.start_time)}</p>
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{t.event.venue}, {t.event.location}</p>
        <p className="flex items-center gap-2 font-bold"><Crown className="h-4 w-4 text-primary" />{t.ticket_type}</p>
        {t.customer && (
          <>
            <p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" />{t.customer.full_name}</p>
            <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 text-primary" />{t.customer.email}</p>
          </>
        )}
      </div>
      <div className="relative border-t-2 border-dashed">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
      </div>
      <div className="flex flex-col items-center gap-2 p-5">
        <div className={cn("rounded-xl bg-card p-2 ring-1 ring-border", t.status !== "valid" && "opacity-40")}>
          <QrCode value={t.token} size={170} />
        </div>
        <p className="font-mono text-xs font-bold">Ticket ID: {t.ticket_code}</p>
        <p className="text-[11px] text-muted-foreground">Present this QR code at the entrance.</p>
      </div>
    </div>
  );
}
