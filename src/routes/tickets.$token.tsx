import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { PublicShell } from "@/components/brand";
import { TicketCard } from "@/components/ticket-card";
import { getTicket } from "@/lib/checkout.functions";

export const Route = createFileRoute("/tickets/$token")({
  head: () => ({
    meta: [
      { title: "Your Ticket — Tumdo Kalenjin Connect" },
      { name: "description", content: "Your digital event ticket with QR code." },
      { property: "og:title", content: "Your Ticket — Tumdo Kalenjin Connect" },
      { property: "og:description", content: "Your digital event ticket." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TicketPage,
});

function TicketPage() {
  const { token } = Route.useParams();
  const fetchTicket = useServerFn(getTicket);
  const { data, isLoading, isError } = useQuery({ queryKey: ["ticket", token], queryFn: () => fetchTicket({ data: { token } }), retry: false });
  return (
    <PublicShell>
      <div className="space-y-4 p-4 pt-6">
        {isLoading && <div className="mx-auto h-[520px] max-w-sm animate-pulse rounded-3xl bg-muted" />}
        {isError && <p className="p-10 text-center">Ticket not found. <Link to="/tickets" className="text-primary underline">Look up your ticket</Link></p>}
        {data && (
          <>
            <TicketCard
              t={{
                token: data.token,
                ticket_code: data.ticket_code,
                status: data.status,
                ticket_type: (data.ticket_types as { name: string }).name,
                customer: data.customers as { full_name: string; email: string },
                event: data.events as never,
              }}
            />
            <button onClick={() => window.print()} className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-primary py-3 font-bold text-primary-foreground shadow-red print:hidden">
              <Download className="h-4 w-4" /> Download Ticket
            </button>
          </>
        )}
      </div>
    </PublicShell>
  );
}
