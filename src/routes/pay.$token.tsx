import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, XCircle, FlaskConical, Smartphone } from "lucide-react";
import { PublicShell } from "@/components/brand";
import { getOrderStatus, sandboxProviderAction } from "@/lib/checkout.functions";
import { ksh } from "@/lib/format";

export const Route = createFileRoute("/pay/$token")({
  head: () => ({
    meta: [
      { title: "Processing Payment — Tumdo Kalenjin Connect" },
      { name: "description", content: "Your payment is being verified securely." },
      { property: "og:title", content: "Processing Payment — Tumdo Kalenjin Connect" },
      { property: "og:description", content: "Your payment is being verified securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Pay,
});

function Pay() {
  const { token } = Route.useParams();
  const fetchStatus = useServerFn(getOrderStatus);
  const sandbox = useServerFn(sandboxProviderAction);
  const nav = useNavigate();
  const [acting, setActing] = useState(false);
  const { data, refetch } = useQuery({
    queryKey: ["order", token],
    queryFn: () => fetchStatus({ data: { token } }),
    refetchInterval: (q) => (q.state.data?.status === "processing" || q.state.data?.status === "pending" ? 3000 : false),
  });

  useEffect(() => {
    if (data?.status === "paid") nav({ to: "/orders/$token", params: { token }, replace: true });
  }, [data?.status, nav, token]);

  const pay = data?.payments?.[0];

  async function act(outcome: "approved" | "declined") {
    setActing(true);
    await sandbox({ data: { token, outcome } }).catch(() => {});
    await refetch();
    setActing(false);
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-md space-y-4 p-4 pt-10 text-center">
        {!data || data.status === "processing" || data.status === "pending" || data.status === "paid" ? (
          <div className="rounded-3xl border bg-card p-8 shadow-card">
            <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <h1 className="mt-5 text-xl font-black">Processing payment…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {pay?.method === "mpesa" ? "Check your phone and enter your M-Pesa PIN to complete payment." : "We're waiting for confirmation from your payment provider."}
            </p>
            {data && <p className="mt-4 text-sm">Amount: <b>{ksh(data.total)}</b> · Ref <b>{pay?.transaction_ref}</b></p>}
            <p className="mt-2 text-[11px] text-muted-foreground">Your ticket is issued only after the payment is verified on our server.</p>
          </div>
        ) : (
          <div className="rounded-3xl border bg-card p-8 shadow-card">
            <XCircle className="animate-pop mx-auto h-16 w-16 text-destructive" />
            <h1 className="mt-4 text-xl font-black">Payment {data.status}</h1>
            <p className="mt-2 text-sm text-muted-foreground">No money was taken and no ticket was issued. Please try again.</p>
            <Link to="/events/$eventId" params={{ eventId: (data.events as { id: string }).id }} className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">
              Try again
            </Link>
          </div>
        )}

        {data?.sandbox && data.status === "processing" && (
          <div className="rounded-2xl border-2 border-dashed border-warning bg-warning/10 p-4 text-left">
            <p className="flex items-center gap-2 text-sm font-black"><FlaskConical className="h-4 w-4" /> SANDBOX PAYMENT MODE</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Test mode — no real money moves. This panel stands in for the payment provider (e.g. the M-Pesa prompt on your phone). It's switched off in production.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button disabled={acting} onClick={() => act("approved")} className="flex items-center justify-center gap-1.5 rounded-full bg-success py-2.5 text-sm font-bold text-success-foreground disabled:opacity-50">
                <Smartphone className="h-4 w-4" /> Approve
              </button>
              <button disabled={acting} onClick={() => act("declined")} className="rounded-full border border-destructive py-2.5 text-sm font-bold text-destructive disabled:opacity-50">
                Decline
              </button>
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
