import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Download, ExternalLink, Mail } from "lucide-react";
import { PublicShell } from "@/components/brand";
import { TicketCard } from "@/components/ticket-card";
import { getOrderStatus } from "@/lib/checkout.functions";
import { ksh } from "@/lib/format";

export const Route = createFileRoute("/orders/$token")({
  head: () => ({
    meta: [
      { title: "Payment Successful — Tumdo Kalenjin Connect" },
      { name: "description", content: "Your payment has been verified. Here are your tickets." },
      { property: "og:title", content: "Payment Successful — Tumdo Kalenjin Connect" },
      { property: "og:description", content: "Your verified tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

type Order = Awaited<ReturnType<typeof getOrderStatus>>;

function OrderPage() {
  const { token } = Route.useParams();
  const fetchStatus = useServerFn(getOrderStatus);
  const { data, isLoading } = useQuery({ queryKey: ["order", token], queryFn: () => fetchStatus({ data: { token } }) });
  if (isLoading || !data) return <PublicShell><div className="m-4 h-72 animate-pulse rounded-2xl bg-muted" /></PublicShell>;
  const o = data as Order & {
    events: { name: string; event_type: string; event_date: string; start_time: string | null; venue: string; location: string; cover_image_url: string | null };
    customers: { full_name: string; email: string };
    payments: { transaction_ref: string; status: string; verification_status: string }[];
    tickets: { token: string; ticket_code: string; status: string; ticket_types: { name: string } }[];
  };
  if (o.status !== "paid")
    return <PublicShell><div className="p-10 text-center">Payment not verified yet. <Link to="/pay/$token" params={{ token }} className="text-primary underline">Check status</Link></div></PublicShell>;
  const pay = o.payments[0];

  return (
    <PublicShell>
      <div className="mx-auto max-w-md space-y-5 p-4">
        <div className="rounded-3xl border bg-card p-6 text-center shadow-card print:hidden">
          <CheckCircle2 className="animate-pop mx-auto h-16 w-16 text-success" />
          <h1 className="mt-3 text-2xl font-black">Payment Successful!</h1>
          <p className="text-sm text-muted-foreground">Your payment has been verified and processed securely.</p>
          <dl className="mt-4 space-y-1.5 text-left text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Transaction Reference</dt><dd className="font-bold">{pay.transaction_ref}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Amount Paid</dt><dd className="font-bold">{ksh(o.total)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd><span className="rounded-full bg-success px-2 py-0.5 text-xs font-bold text-success-foreground">Verified</span></dd></div>
          </dl>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" />Tickets for {o.customers.email}</p>
        </div>

        <h2 className="text-lg font-extrabold print:hidden">Your Tickets ({o.tickets.length})</h2>
        {o.tickets.map((t) => (
          <div key={t.token} className="space-y-2 break-inside-avoid">
            <TicketCard t={{ token: t.token, ticket_code: t.ticket_code, status: t.status, ticket_type: t.ticket_types.name, customer: o.customers, event: o.events }} />
            <Link to="/tickets/$token" params={{ token: t.token }} className="mx-auto flex max-w-sm items-center justify-center gap-1.5 text-xs font-bold text-primary print:hidden">
              <ExternalLink className="h-3.5 w-3.5" /> Open ticket link
            </Link>
          </div>
        ))}
        <button onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-bold text-primary-foreground shadow-red print:hidden">
          <Download className="h-4 w-4" /> Download Tickets
        </button>
        <p className="text-center text-[11px] text-muted-foreground print:hidden">Bookmark this page — it's your secure link to these tickets.</p>
      </div>
    </PublicShell>
  );
}
