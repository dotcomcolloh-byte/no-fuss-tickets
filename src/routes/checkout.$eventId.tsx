import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, UserRound, Lock, CreditCard, Smartphone, Wallet, Loader2 } from "lucide-react";
import { PublicShell } from "@/components/brand";
import { publicEventQuery } from "@/lib/events";
import { ksh, fmtDate } from "@/lib/format";
import { createOrderAndPay, FEE_RATE } from "@/lib/checkout.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout/$eventId")({
  validateSearch: z.object({ sel: z.string().default("") }),
  head: () => ({
    meta: [
      { title: "Checkout — Tumdo Kalenjin Connect" },
      { name: "description", content: "Enter your details and pay securely with M-Pesa or card. No account needed." },
      { property: "og:title", content: "Checkout — Tumdo Kalenjin Connect" },
      { property: "og:description", content: "Secure guest checkout for event tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^\+?[0-9 ]{9,15}$/, "Enter a valid phone, e.g. +254 712 345 678"),
});

const METHODS = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone },
  { id: "card", label: "Card (Visa / Mastercard)", icon: CreditCard },
  { id: "mobile_money", label: "Mobile Money", icon: Wallet },
] as const;

function Checkout() {
  const { eventId } = Route.useParams();
  const { sel } = Route.useSearch();
  const { data: e } = useQuery(publicEventQuery(eventId));
  const nav = useNavigate();
  const pay = useServerFn(createOrderAndPay);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", nationalId: "" });
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("mpesa");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const idem = useMemo(() => crypto.randomUUID(), []);

  const items = sel.split(",").filter(Boolean).map((p) => { const [id, q] = p.split(":"); return { ticketTypeId: id, quantity: Number(q) }; });
  const lines = e ? items.map((i) => ({ ...i, t: e.ticket_types.find((t) => t.id === i.ticketTypeId) })).filter((l) => l.t) : [];
  const subtotal = lines.reduce((s, l) => s + l.quantity * Number(l.t?.price ?? 0), 0);
  const fees = Math.round(subtotal * FEE_RATE);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    const r = formSchema.safeParse(form);
    const errs: Record<string, string> = {};
    if (!r.success) r.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
    if (e?.require_id && !form.nationalId.trim()) errs["nationalId"] = "Required by the organiser";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await pay({ data: { eventId, items, ...form, method, idempotencyKey: idem } });
      if (res.redirectUrl) window.location.href = res.redirectUrl;
      else nav({ to: "/pay/$token", params: { token: res.orderToken } });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Payment could not be started");
      setBusy(false);
    }
  }

  if (!e) return <PublicShell><div className="m-4 h-72 animate-pulse rounded-2xl bg-muted" /></PublicShell>;
  if (!lines.length)
    return <PublicShell><div className="p-10 text-center"><p>No tickets selected.</p><Link to="/events/$eventId" params={{ eventId }} className="text-primary underline">Choose tickets</Link></div></PublicShell>;

  const field = (k: keyof typeof form, label: string, type = "text", ph = "") => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={form[k]}
        placeholder={ph}
        onChange={(x) => setForm({ ...form, [k]: x.target.value })}
        className={cn("mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary", errors[k] && "border-destructive")}
      />
      {errors[k] && <span className="text-xs text-destructive">{errors[k]}</span>}
    </label>
  );

  return (
    <PublicShell>
      <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Link to="/events/$eventId" params={{ eventId }} className="text-primary"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-lg font-bold">Checkout</h1>
        </div>

        <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-bold"><UserRound className="h-4 w-4 text-primary" />Customer Details</h2>
          {field("fullName", "Full Name", "text", "John Kamau")}
          {field("email", "Email Address", "email", "john@example.com")}
          {field("phone", "Phone Number", "tel", "+254 712 345 678")}
          {e.require_id && field("nationalId", "National ID / Passport number")}
          <p className="text-[11px] text-muted-foreground">Your ticket will be sent to this email. No account needed.</p>
        </section>

        <section className="space-y-2 rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Lock className="h-4 w-4 text-primary" />Payment Method</h2>
          {METHODS.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={cn("h-auto w-full justify-start gap-3 rounded-xl border p-3 text-left text-sm transition", method === m.id && "border-primary bg-accent")}
            >
              <span className={cn("grid h-4 w-4 place-items-center rounded-full border-2", method === m.id ? "border-primary" : "border-input")}>
                {method === m.id && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <m.icon className="h-5 w-5 text-primary" />
              {m.label}
            </Button>
          ))}
        </section>

        <section className="space-y-2 rounded-2xl border bg-card p-4 text-sm shadow-card">
          <h2 className="font-bold">Order Summary</h2>
          <p className="font-semibold">{e.name}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(e.event_date)} · {e.venue}</p>
          {lines.map((l) => (
            <div key={l.ticketTypeId} className="flex justify-between">
              <span>{l.t?.name} · {l.quantity} × {ksh(l.t?.price ?? 0)}</span>
              <span>{ksh(l.quantity * Number(l.t?.price ?? 0))}</span>
            </div>
          ))}
          <div className="flex justify-between text-muted-foreground"><span>Fees</span><span>{ksh(fees)}</span></div>
          <div className="flex justify-between border-t pt-2 text-base font-black"><span>Total</span><span>{ksh(subtotal + fees)}</span></div>
        </section>

        {serverError && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p>}

        <Button type="submit" disabled={busy} className="h-12 w-full rounded-full font-bold shadow-red">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} {busy ? "Connecting to Paystack…" : "Pay with Paystack"} · {ksh(subtotal + fees)}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" /> Your payment is securely processed and verified before your ticket is issued.
        </p>
      </form>
    </PublicShell>
  );
}
