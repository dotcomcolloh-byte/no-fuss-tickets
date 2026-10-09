import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Ticket, Loader2 } from "lucide-react";
import { PublicShell, BottomNav } from "@/components/brand";
import { lookupTicket } from "@/lib/checkout.functions";

export const Route = createFileRoute("/tickets/")({
  head: () => ({
    meta: [
      { title: "Find My Ticket — Tumdo Kalenjin Connect" },
      { name: "description", content: "Retrieve your ticket with your Ticket ID and email address." },
      { property: "og:title", content: "Find My Ticket — Tumdo Kalenjin Connect" },
      { property: "og:description", content: "Retrieve your ticket anytime." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lookup,
});

function Lookup() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const find = useServerFn(lookupTicket);
  const nav = useNavigate();
  return (
    <PublicShell>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr("");
          setBusy(true);
          try {
            const r = await find({ data: { code, email } });
            if (r.token) nav({ to: "/tickets/$token", params: { token: r.token } });
            else setErr("We couldn't find a ticket matching that Ticket ID and email.");
          } catch {
            setErr("Check the Ticket ID (TK-XXXXXXXXXX) and email format.");
          }
          setBusy(false);
        }}
        className="mx-auto max-w-md space-y-4 p-4 pt-8"
      >
        <div className="text-center">
          <Ticket className="mx-auto h-12 w-12 rounded-2xl bg-accent p-2.5 text-primary" />
          <h1 className="mt-3 text-2xl font-black">Find My Ticket</h1>
          <p className="text-sm text-muted-foreground">Enter the Ticket ID from your email and the email you used to buy.</p>
        </div>
        <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
          <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ticket ID, e.g. TK-1A2B3C4D5E" className="w-full rounded-xl border px-3 py-2.5 font-mono text-sm uppercase outline-none focus:border-primary" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-primary" />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-bold text-primary-foreground shadow-red">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Find Ticket
          </button>
        </div>
      </form>
      <BottomNav />
    </PublicShell>
  );
}
